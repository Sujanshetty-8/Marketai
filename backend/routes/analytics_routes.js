// routes/analytics.routes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth_midware.js');
const Analytics = require('../models/analytics.js');
const Campaign = require('../models/camp_model.js');
const Tracker = require('../models/tracker.js');
const DiscountCode = require('../models/discountcode.js');

// ------------------------------------
// ROUTE: GET /api/analytics/campaign/:campaignId
// DESC: Get comprehensive analytics for a campaign (Protected)
// ------------------------------------
router.get('/campaign/:campaignId', authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const loggedInUserId = req.user.id;

    // Verify campaign ownership
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.user.toString() !== loggedInUserId) {
      return res.status(404).json({ message: 'Campaign not found or unauthorized' });
    }

    // Get all trackers for this campaign
    const trackers = await Tracker.find({ campaign: campaignId });
    
    // Get analytics data
    const analytics = await Analytics.find({ 
      campaign: campaignId 
    }).sort({ createdAt: -1 });

    // Get recent redemptions
    const recentRedemptions = await DiscountCode.find({
      tracker: { $in: trackers.map(t => t._id) },
      status: 'redeemed'
    }).populate('tracker', 'channelName')
      .sort({ redeemedAt: -1 })
      .limit(10);
      
    console.log(`\n=== REDEMPTIONS DEBUG ===`);
    console.log(`Found ${recentRedemptions.length} recent redemptions for this campaign`);
    recentRedemptions.forEach(redemption => {
      console.log(`  - Code: ${redemption.codeString}, Channel: ${redemption.tracker?.channelName}, Redeemed: ${redemption.redeemedAt}`);
    });
    
    // Also check ALL redemptions for this campaign (not just recent)
    const allRedemptions = await DiscountCode.find({
      tracker: { $in: trackers.map(t => t._id) },
      status: 'redeemed'
    }).populate('tracker', 'channelName');
    
    console.log(`Total redemptions for this campaign: ${allRedemptions.length}`);
    console.log('=== END REDEMPTIONS DEBUG ===\n');

    // Channel performance analysis - only show active channels
    const channelPerformance = {};
    
    console.log(`\n=== ANALYTICS DEBUG for Campaign: ${campaign.theme} ===`);
    console.log(`Found ${trackers.length} trackers for this campaign`);
    
    for (const tracker of trackers) {
      console.log(`\nTracker: ${tracker.channelName} (ID: ${tracker._id})`);
      console.log(`  - Visits: ${tracker.visits}`);
      console.log(`  - Stored Conversions: ${tracker.conversions}`);
      
      // Get actual conversion count from redeemed discount codes
      const actualConversions = await DiscountCode.countDocuments({
        tracker: tracker._id,
        status: 'redeemed'
      });
      
      console.log(`  - Actual Conversions: ${actualConversions}`);
      
      // Get all discount codes for this tracker (for debugging)
      const allCodes = await DiscountCode.find({ tracker: tracker._id });
      console.log(`  - Total Codes Generated: ${allCodes.length}`);
      console.log(`  - Redeemed Codes: ${allCodes.filter(c => c.status === 'redeemed').map(c => c.codeString).join(', ')}`);
      
      // Update tracker if conversion count is different (sync data)
      if (tracker.conversions !== actualConversions) {
        console.log(`  - Syncing: ${tracker.conversions} -> ${actualConversions}`);
        tracker.conversions = actualConversions;
        await tracker.save();
      }
      
      // Only include channels that have activity (visits > 0 OR conversions > 0)
      // OR channels that were recently created (within last 24 hours)
      const isRecentlyCreated = (new Date() - tracker.createdAt) < (24 * 60 * 60 * 1000);
      const hasActivity = tracker.visits > 0 || actualConversions > 0;
      
      console.log(`  - Recently Created: ${isRecentlyCreated}`);
      console.log(`  - Has Activity: ${hasActivity}`);
      console.log(`  - Will Include: ${hasActivity || isRecentlyCreated}`);
      
      if (hasActivity || isRecentlyCreated) {
        channelPerformance[tracker.channelName] = {
          channelName: tracker.channelName,
          channelType: tracker.channelType,
          visits: tracker.visits,
          conversions: actualConversions,
          conversionRate: tracker.visits > 0 ? 
            ((actualConversions / tracker.visits) * 100).toFixed(2) : 0,
          trackingUrl: `https://collectivistic-kade-waggly.ngrok-free.dev/track/${campaign.theme.toLowerCase().replace(/\s+/g, '-')}?channel=${tracker.channelName}`,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://collectivistic-kade-waggly.ngrok-free.dev/track/${campaign.theme.toLowerCase().replace(/\s+/g, '-')}?channel=${tracker.channelName}`
        };
      }
    }
    
    console.log(`\nFinal Channel Performance: ${Object.keys(channelPerformance).length} channels`);
    console.log('=== END ANALYTICS DEBUG ===\n');

    // Time-based analytics (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentAnalytics = analytics.filter(a => a.createdAt >= sevenDaysAgo);
    const dailyStats = {};
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      dailyStats[dateKey] = {
        date: dateKey,
        visits: 0,
        conversions: 0
      };
    }
    
    recentAnalytics.forEach(entry => {
      const dateKey = entry.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateKey]) {
        if (entry.eventType === 'visit') {
          dailyStats[dateKey].visits++;
        } else if (entry.eventType === 'conversion') {
          dailyStats[dateKey].conversions++;
        }
      }
    });

    // Summary statistics - use actual conversion data
    const totalVisits = trackers.reduce((sum, t) => sum + t.visits, 0);
    const totalConversions = Object.values(channelPerformance).reduce((sum, channel) => sum + channel.conversions, 0);
    const overallConversionRate = totalVisits > 0 ? 
      ((totalConversions / totalVisits) * 100).toFixed(2) : 0;

    // Top performing channels
    const topChannels = Object.values(channelPerformance)
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 5);

    res.json({
      campaign: {
        id: campaign._id,
        name: campaign.theme,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        status: campaign.status || 'active'
      },
      summary: {
        totalVisits,
        totalConversions,
        overallConversionRate: parseFloat(overallConversionRate),
        activeChannels: trackers.length
      },
      channelPerformance: Object.values(channelPerformance),
      topChannels,
      dailyStats: Object.values(dailyStats),
      recentRedemptions: recentRedemptions.map(redemption => ({
        code: redemption.codeString,
        channel: redemption.tracker.channelName,
        redeemedAt: redemption.redeemedAt,
        createdAt: redemption.createdAt
      }))
    });

  } catch (err) {
    console.error('Campaign analytics error:', err.message);
    res.status(500).json({ message: 'Server Error fetching campaign analytics' });
  }
});

// ------------------------------------
// ROUTE: GET /api/analytics/dashboard
// DESC: Get dashboard analytics for all user campaigns (Protected)
// ------------------------------------
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const loggedInUserId = req.user.id;

    // Get all user campaigns
    const campaigns = await Campaign.find({ user: loggedInUserId });
    const campaignIds = campaigns.map(c => c._id);

    // Get all trackers for user campaigns
    const trackers = await Tracker.find({ campaign: { $in: campaignIds } });

    // Get recent analytics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAnalytics = await Analytics.find({
      campaign: { $in: campaignIds },
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Calculate totals from actual database data
    const totalVisits = trackers.reduce((sum, t) => sum + t.visits, 0);
    
    // Get actual total conversions from redeemed codes
    const totalConversions = await DiscountCode.countDocuments({
      tracker: { $in: trackers.map(t => t._id) },
      status: 'redeemed'
    });
    
    const overallConversionRate = totalVisits > 0 ? 
      ((totalConversions / totalVisits) * 100).toFixed(2) : 0;

    // Campaign performance
    const campaignPerformance = await Promise.all(
      campaigns.map(async (campaign) => {
        const campaignTrackers = trackers.filter(t => 
          t.campaign.toString() === campaign._id.toString()
        );
        
        const visits = campaignTrackers.reduce((sum, t) => sum + t.visits, 0);
        
        // Get actual conversions for this campaign
        const conversions = await DiscountCode.countDocuments({
          tracker: { $in: campaignTrackers.map(t => t._id) },
          status: 'redeemed'
        });
        
        return {
          id: campaign._id,
          name: campaign.theme,
          visits,
          conversions,
          conversionRate: visits > 0 ? ((conversions / visits) * 100).toFixed(2) : 0,
          channels: campaignTrackers.length,
          status: campaign.status || 'active'
        };
      })
    );

    // Channel type performance - calculate from actual data
    const channelTypeStats = {};
    
    for (const tracker of trackers) {
      if (!channelTypeStats[tracker.channelType]) {
        channelTypeStats[tracker.channelType] = {
          type: tracker.channelType,
          visits: 0,
          conversions: 0,
          channels: 0
        };
      }
      
      // Get actual conversions for this tracker
      const actualConversions = await DiscountCode.countDocuments({
        tracker: tracker._id,
        status: 'redeemed'
      });
      
      channelTypeStats[tracker.channelType].visits += tracker.visits;
      channelTypeStats[tracker.channelType].conversions += actualConversions;
      channelTypeStats[tracker.channelType].channels++;
    }

    // Add conversion rates
    Object.values(channelTypeStats).forEach(stats => {
      stats.conversionRate = stats.visits > 0 ? 
        ((stats.conversions / stats.visits) * 100).toFixed(2) : 0;
    });

    res.json({
      summary: {
        totalCampaigns: campaigns.length,
        totalVisits,
        totalConversions,
        overallConversionRate: parseFloat(overallConversionRate),
        activeChannels: trackers.length
      },
      campaignPerformance: campaignPerformance.sort((a, b) => b.conversions - a.conversions),
      channelTypePerformance: Object.values(channelTypeStats),
      recentActivity: recentAnalytics.length
    });

  } catch (err) {
    console.error('Dashboard analytics error:', err.message);
    res.status(500).json({ message: 'Server Error fetching dashboard analytics' });
  }
});

// ------------------------------------
// ROUTE: POST /api/analytics/track-custom
// DESC: Track custom events (Protected)
// ------------------------------------
router.post('/track-custom', authMiddleware, async (req, res) => {
  try {
    const { campaignId, channelName, eventType, metadata } = req.body;
    const loggedInUserId = req.user.id;

    // Verify campaign ownership
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.user.toString() !== loggedInUserId) {
      return res.status(404).json({ message: 'Campaign not found or unauthorized' });
    }

    // Find or create tracker
    let tracker = await Tracker.findOne({ 
      campaign: campaignId, 
      channelName 
    });

    if (!tracker) {
      return res.status(404).json({ message: 'Tracker not found for this channel' });
    }

    // Create analytics entry
    const analyticsEntry = new Analytics({
      campaign: campaignId,
      tracker: tracker._id,
      eventType,
      channelName: tracker.channelName,
      channelType: tracker.channelType,
      metadata: {
        ...metadata,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      }
    });
    await analyticsEntry.save();

    res.json({ message: 'Event tracked successfully' });

  } catch (err) {
    console.error('Custom tracking error:', err.message);
    res.status(500).json({ message: 'Server Error tracking custom event' });
  }
});

// ------------------------------------
// ROUTE: POST /api/analytics/sync-data
// DESC: Synchronize analytics data (Protected)
// ------------------------------------
router.post('/sync-data', authMiddleware, async (req, res) => {
  try {
    const loggedInUserId = req.user.id;

    // Get all user campaigns
    const campaigns = await Campaign.find({ user: loggedInUserId });
    const campaignIds = campaigns.map(c => c._id);

    // Get all trackers for user campaigns
    const trackers = await Tracker.find({ campaign: { $in: campaignIds } });

    let syncedTrackers = 0;
    let cleanedTrackers = 0;

    // Sync each tracker's conversion count and clean up unused ones
    for (const tracker of trackers) {
      const actualConversions = await DiscountCode.countDocuments({
        tracker: tracker._id,
        status: 'redeemed'
      });

      // Check if tracker has any activity
      const hasActivity = tracker.visits > 0 || actualConversions > 0;
      const isOld = (new Date() - tracker.createdAt) > (7 * 24 * 60 * 60 * 1000); // Older than 7 days

      // Remove trackers that are old and have no activity
      if (isOld && !hasActivity) {
        await Tracker.findByIdAndDelete(tracker._id);
        cleanedTrackers++;
        continue;
      }

      // Sync conversion count for active trackers
      if (tracker.conversions !== actualConversions) {
        tracker.conversions = actualConversions;
        await tracker.save();
        syncedTrackers++;
      }
    }

    res.json({ 
      message: 'Data synchronized successfully',
      syncedTrackers,
      cleanedTrackers,
      totalTrackers: trackers.length - cleanedTrackers
    });

  } catch (err) {
    console.error('Data sync error:', err.message);
    res.status(500).json({ message: 'Server Error syncing data' });
  }
});

// ------------------------------------
// ROUTE: DELETE /api/analytics/cleanup/:campaignId
// DESC: Clean up unused trackers for a campaign (Protected)
// ------------------------------------
router.delete('/cleanup/:campaignId', authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const loggedInUserId = req.user.id;

    // Verify campaign ownership
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.user.toString() !== loggedInUserId) {
      return res.status(404).json({ message: 'Campaign not found or unauthorized' });
    }

    // Get all trackers for this campaign
    const trackers = await Tracker.find({ campaign: campaignId });
    let removedTrackers = 0;

    for (const tracker of trackers) {
      // Check if tracker has any activity
      const hasVisits = tracker.visits > 0;
      const hasConversions = await DiscountCode.countDocuments({
        tracker: tracker._id,
        status: 'redeemed'
      }) > 0;

      // Remove trackers with no activity
      if (!hasVisits && !hasConversions) {
        await Tracker.findByIdAndDelete(tracker._id);
        removedTrackers++;
      }
    }

    res.json({
      message: 'Cleanup completed successfully',
      removedTrackers,
      remainingTrackers: trackers.length - removedTrackers
    });

  } catch (err) {
    console.error('Cleanup error:', err.message);
    res.status(500).json({ message: 'Server Error during cleanup' });
  }
});

module.exports = router;