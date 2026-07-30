const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth_midware.js');
const ChatSession = require('../models/chat_session.js');
const BusinessProfile = require('../models/business_profile.js');
const Campaign = require('../models/camp_model.js');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';

// @route   GET /api/ai/session
// @desc    Get or create active chat session
// @access  Private
router.get('/session', authMiddleware, async (req, res) => {
  try {
    let session = await ChatSession.findOne({ user: req.user.id, status: 'active' });
    if (!session) {
      // Check if user already has a saved Business Profile
      const businessProfile = await BusinessProfile.findOne({ user: req.user.id });
      
      let initialMsg = "Hello! I am your AI Marketing Consultant. Let's build your business profile first. What business do you own?";
      let prepopulatedProfile = {};
      
      if (businessProfile && businessProfile.businessName) {
        // Returning user: pre-populate core business fields
        prepopulatedProfile = {
          businessName: businessProfile.businessName,
          industry: businessProfile.industry,
          location: businessProfile.location,
          targetAudience: businessProfile.targetAudience,
          usp: businessProfile.usp
        };
        initialMsg = `Hello again! Let's create a new campaign for **${businessProfile.businessName}**. What is your budget in INR for this campaign?`;
      }
      
      session = new ChatSession({
        user: req.user.id,
        messages: [{
          sender: 'ai',
          text: initialMsg
        }],
        extractedProfile: prepopulatedProfile
      });
      await session.save();
    }
    res.json(session);
  } catch (err) {
    console.error('Get chat session error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/ai/message
// @desc    Send a message to the AI Consultant
// @access  Private
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // 1. Get current active session
    let session = await ChatSession.findOne({ user: req.user.id, status: 'active' });
    if (!session) {
      session = new ChatSession({
        user: req.user.id,
        messages: []
      });
    }

    // 2. Add user message to session
    session.messages.push({
      sender: 'user',
      text: message
    });

    // 3. Call Python FastAPI AI service
    const response = await fetch(`${PYTHON_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        history: session.messages.map(m => ({ sender: m.sender, text: m.text })),
        user_id: req.user.id.toString(),
        extracted_profile: session.extractedProfile || {}
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python AI service returned error:', errorText);
      return res.status(502).json({ message: 'AI Consultant service currently unavailable.' });
    }

    const aiResult = await response.json();

    // 4. Update session messages with AI response
    session.messages.push({
      sender: 'ai',
      text: aiResult.response
    });

    // 5. Update extracted profile metadata in session
    if (aiResult.extracted_profile) {
      session.extractedProfile = {
        ...session.extractedProfile,
        ...aiResult.extracted_profile
      };
    }

    // 6. Check if profile is complete and save to database
    if (aiResult.profile_completed && aiResult.extracted_profile) {
      const ep = session.extractedProfile;
      // Convert budget to number
      const parsedBudget = parseInt(ep.budget) || 0;
      
      const profileFields = {
        user: req.user.id,
        businessName: ep.businessName || ep.business_name || 'My Shop',
        industry: ep.industry || '',
        location: ep.location || '',
        targetAudience: ep.targetAudience || ep.target_audience || '',
        products: ep.products || [],
        services: ep.services || [],
        budget: parsedBudget,
        businessSize: ep.businessSize || ep.business_size || '',
        usp: ep.usp || '',
        channels: ep.channels || [],
        goals: ep.goals || [],
        competitors: ep.competitors || [],
        preferredLanguage: ep.preferredLanguage || ep.preferred_language || 'English'
      };

      await BusinessProfile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { upsate: true, new: true, upsert: true }
      );
      
      session.status = 'completed';
    }

    // 7. Save session
    await session.save();

    // 8. Return response to frontend
    res.json({
      response: aiResult.response,
      sessionStatus: session.status,
      extractedProfile: session.extractedProfile,
      campaignPlan: aiResult.campaign_plan || null
    });

  } catch (err) {
    console.error('Post message error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/ai/reset
// @desc    Reset chat session
// @access  Private
router.post('/reset', authMiddleware, async (req, res) => {
  try {
    // Mark any active session as completed/archived
    await ChatSession.updateMany(
      { user: req.user.id, status: 'active' },
      { $set: { status: 'completed' } }
    );

    // Check if user already has a saved Business Profile
    const businessProfile = await BusinessProfile.findOne({ user: req.user.id });
    
    let initialMsg = "Hello! I am your AI Marketing Consultant. Let's build your business profile first. What business do you own?";
    let prepopulatedProfile = {};
    
    if (businessProfile && businessProfile.businessName) {
      // Returning user: pre-populate core business fields
      prepopulatedProfile = {
        businessName: businessProfile.businessName,
        industry: businessProfile.industry,
        location: businessProfile.location,
        targetAudience: businessProfile.targetAudience,
        usp: businessProfile.usp
      };
      initialMsg = `Hello again! Let's create a new campaign for **${businessProfile.businessName}**. What is your budget in INR for this campaign?`;
    }

    // Create a new session
    const session = new ChatSession({
      user: req.user.id,
      messages: [{
        sender: 'ai',
        text: initialMsg
      }],
      extractedProfile: prepopulatedProfile
    });
    await session.save();

    res.json(session);
  } catch (err) {
    console.error('Reset chat session error:', err.message);
    res.status(500).send('Server Error');
  }
// @route   POST /api/ai/generate-plan
// @desc    Generate a campaign plan in single-shot using manual details
// @access  Private
router.post('/generate-plan', authMiddleware, async (req, res) => {
  try {
    const {
      businessName,
      industry,
      location,
      targetAudience,
      budget,
      startDate,
      endDate,
      goal,
      usp
    } = req.body;

    if (!businessName || !budget || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required campaign details.' });
    }

    // 1. Calculate duration in days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const durationDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (durationDays <= 0) {
      return res.status(400).json({ message: 'End date must be after start date.' });
    }

    // 2. Call Python FastAPI AI service
    const payload = {
      message: 'Generate marketing plan',
      history: [],
      user_id: req.user.id.toString(),
      extracted_profile: {
        businessName,
        industry: industry || '',
        location,
        targetAudience: targetAudience || '',
        budget: parseInt(budget) || 0,
        duration: `${durationDays} days`,
        goal: goal || '',
        usp: usp || '',
        profile_completed: true // Skip chat profiling node LLM call
      }
    };

    const response = await fetch(`${PYTHON_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python AI service returned error:', errorText);
      return res.status(502).json({ message: 'AI Plan Generator service is currently offline.' });
    }

    const aiResult = await response.json();
    const campaignPlan = aiResult.campaign_plan;

    if (!campaignPlan) {
      return res.status(500).json({ message: 'AI Plan Generator failed to generate campaign plan.' });
    }

    // 3. Save User's Business Profile (upsert/update so it's saved for future campaigns!)
    const profileFields = {
      user: req.user.id,
      businessName,
      industry: industry || '',
      location,
      targetAudience: targetAudience || '',
      budget: parseInt(budget) || 0,
      usp: usp || ''
    };

    await BusinessProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileFields },
      { upsert: true, new: true }
    );

    // 4. Save the generated Campaign to database
    const newCampaign = new Campaign({
      user: req.user.id,
      theme: campaignPlan.campaign_objective || 'AI Marketing Campaign',
      offer: campaignPlan.referral_program || 'Special Discount',
      campaignType: 'hybrid',
      budget: parseInt(budget) || 0,
      startDate: start,
      endDate: end,
      targetAudience: targetAudience || 'Local customers'
    });

    const savedCampaign = await newCampaign.save();

    // 5. Send response to frontend
    res.json({
      campaignPlan,
      savedCampaign
    });

  } catch (err) {
    console.error('Generate plan error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
