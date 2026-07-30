const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth_midware.js');
const BusinessProfile = require('../models/business_profile.js');

// @route   GET /api/business-profile
// @desc    Get current user's business profile
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    let profile = await BusinessProfile.findOne({ user: req.user.id });
    if (!profile) {
      // Return empty profile values to prevent UI crash
      return res.json({
        businessName: '',
        industry: '',
        location: '',
        targetAudience: '',
        products: [],
        services: [],
        budget: 0,
        businessSize: '',
        usp: '',
        channels: [],
        goals: [],
        competitors: [],
        preferredLanguage: 'English'
      });
    }
    res.json(profile);
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/business-profile
// @desc    Create or update current user's business profile
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      businessName,
      industry,
      location,
      targetAudience,
      products,
      services,
      budget,
      businessSize,
      usp,
      channels,
      goals,
      competitors,
      preferredLanguage
    } = req.body;

    if (!businessName) {
      return res.status(400).json({ message: 'Business name is required' });
    }

    const profileFields = {
      user: req.user.id,
      businessName,
      industry: industry || '',
      location: location || '',
      targetAudience: targetAudience || '',
      products: Array.isArray(products) ? products : [],
      services: Array.isArray(services) ? services : [],
      budget: budget || 0,
      businessSize: businessSize || '',
      usp: usp || '',
      channels: Array.isArray(channels) ? channels : [],
      goals: Array.isArray(goals) ? goals : [],
      competitors: Array.isArray(competitors) ? competitors : [],
      preferredLanguage: preferredLanguage || 'English'
    };

    let profile = await BusinessProfile.findOne({ user: req.user.id });

    if (profile) {
      // Update
      profile = await BusinessProfile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    }

    // Create new
    profile = new BusinessProfile(profileFields);
    await profile.save();
    res.status(201).json(profile);

  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
