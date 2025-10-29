// routes/redeem.routes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth_midware.js');
const DiscountCode = require('../models/discountcode.js');
const Tracker = require('../models/tracker.js');
const Campaign = require('../models/camp_model.js');
const Analytics = require('../models/analytics.js');

// ------------------------------------
// ROUTE: POST /api/redeem
// DESC: Redeem a unique discount code (Protected)
// ------------------------------------
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const loggedInUserId = req.user.id;

    if (!code) {
      return res.status(400).json({ message: 'Redemption code is required' });
    }

    // Find the code and populate tracker and campaign
    const discountCode = await DiscountCode.findOne({ codeString: code.trim().toUpperCase() })
      .populate({
        path: 'tracker',
        populate: { path: 'campaign' }
      });

    if (!discountCode) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    // Check if already redeemed
    if (discountCode.status === 'redeemed') {
      return res.status(400).json({ message: 'Code already used' });
    }

    // Security check: Verify the logged-in user owns the campaign
    if (!discountCode.tracker || !discountCode.tracker.campaign) {
      return res.status(500).json({ message: 'Error verifying code ownership (Missing data)' });
    }
    if (discountCode.tracker.campaign.user.toString() !== loggedInUserId) {
      return res.status(401).json({ message: 'Unauthorized: You do not own this campaign' });
    }

    // Mark as redeemed
    discountCode.status = 'redeemed';
    discountCode.redeemedAt = new Date();
    await discountCode.save();

    // Update tracker conversion count
    const tracker = discountCode.tracker;
    tracker.conversions += 1;
    await tracker.save();

    // Log conversion analytics
    const analyticsEntry = new Analytics({
      campaign: tracker.campaign._id,
      tracker: tracker._id,
      eventType: 'conversion',
      channelName: tracker.channelName,
      channelType: tracker.channelType,
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        codeRedeemed: discountCode.codeString,
        timestamp: new Date()
      }
    });
    await analyticsEntry.save();

    // Send success response with analytics data
    res.json({
      message: 'Code redeemed successfully!',
      redemptionDetails: {
        code: discountCode.codeString,
        channel: tracker.channelName,
        campaign: tracker.campaign.theme,
        redeemedAt: discountCode.redeemedAt,
        totalConversions: tracker.conversions
      }
    });

  } catch (err) {
    console.error('Redeem error:', err.message);
    res.status(500).json({ message: 'Server Error during redemption' });
  }
});

// ------------------------------------
// ROUTE: GET /api/redeem/analytics/:campaignId
// DESC: Get redemption analytics for a campaign (Protected)
// ------------------------------------
router.get('/analytics/:campaignId', authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const loggedInUserId = req.user.id;

    // Verify campaign ownership
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.user.toString() !== loggedInUserId) {
      return res.status(404).json({ message: 'Campaign not found or unauthorized' });
    }

    // Get analytics data
    const analytics = await Analytics.find({ 
      campaign: campaignId 
    }).populate('tracker', 'channelName channelType');

    // Group by channel and event type
    const channelStats = {};
    
    analytics.forEach(entry => {
      const channelName = entry.channelName;
      if (!channelStats[channelName]) {
        channelStats[channelName] = {
          channelName,
          channelType: entry.channelType,
          visits: 0,
          conversions: 0,
          conversionRate: 0
        };
      }
      
      if (entry.eventType === 'visit') {
        channelStats[channelName].visits++;
      } else if (entry.eventType === 'conversion') {
        channelStats[channelName].conversions++;
      }
    });

    // Calculate conversion rates
    Object.values(channelStats).forEach(stats => {
      stats.conversionRate = stats.visits > 0 ? 
        ((stats.conversions / stats.visits) * 100).toFixed(2) : 0;
    });

    res.json({
      campaignId,
      channelStats: Object.values(channelStats),
      totalVisits: analytics.filter(a => a.eventType === 'visit').length,
      totalConversions: analytics.filter(a => a.eventType === 'conversion').length
    });

  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ message: 'Server Error fetching analytics' });
  }
});

module.exports = router;
