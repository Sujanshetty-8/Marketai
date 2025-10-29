// routes/stats.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth_midware.js');
const Campaign = require('../models/camp_model.js');
const Tracker = require('../models/tracker.js');
const Event = require('../models/event.js');
const DiscountCode = require('../models/discountcode.js');

// GET /api/stats - Get dashboard stats for logged-in user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get user's campaigns
        const userCampaigns = await Campaign.find({ user: userId });
        const campaignIds = userCampaigns.map(c => c._id);

        // 2. Get trackers related to these campaigns
        const userTrackers = await Tracker.find({ campaign: { $in: campaignIds } });
        const trackerIds = userTrackers.map(t => t._id);

        // 3. Count total scans (Events) for these trackers
        const totalScans = await Event.countDocuments({ tracker: { $in: trackerIds } });

        // 4. Count total redemptions (DiscountCodes) for these trackers
        const totalRedemptions = await DiscountCode.countDocuments({
            tracker: { $in: trackerIds },
            status: 'redeemed'
        });

        // 5. Count total campaigns
        const totalCampaigns = userCampaigns.length;

        // Basic ROI calculation (Example: assumes simple profit per redemption)
        // You might need a more complex calculation based on budget, actual sale value etc.
        // const estimatedProfitPerRedemption = 100; // Example value in ₹
        // const totalBudgetSpent = userCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
        // const totalRevenue = totalRedemptions * estimatedProfitPerRedemption;
        // const roi = totalBudgetSpent > 0 ? ((totalRevenue - totalBudgetSpent) / totalBudgetSpent) * 100 : 0;
        // const roiAmount = totalRevenue - totalBudgetSpent; // Simple profit


        res.json({
            totalCampaigns,
            totalScans,
            totalRedemptions,
            // roi: roiAmount // Uncomment and adjust if you calculate ROI
        });

    } catch (err) {
        console.error("Error fetching dashboard stats:", err.message);
        res.status(500).json({ message: 'Server Error fetching stats' });
    }
});

module.exports = router;