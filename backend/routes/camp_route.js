// routes/campaign.routes.js
const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid'); // Make sure you installed v3: require('nanoid').nanoid if using require

// --- Import your "bouncer" and "blueprints" ---
const authMiddleware = require('../middleware/auth_midware.js');
const Campaign = require('../models/camp_model.js');
const Tracker = require('../models/tracker.js');
const Event = require('../models/event.js'); // <-- Added for campaign stats
const DiscountCode = require('../models/discountcode.js'); // <-- Added for campaign stats
const User = require('../models/user_model.js'); // <-- Added for user info

// ------------------------------------
// ROUTE 1: POST /api/campaigns
// DESC: Create a new campaign (This is a PROTECTED route)
// ------------------------------------
router.post('/', authMiddleware, async (req, res) => {
  try {
    // 1. Get the campaign data from the request body
    const { theme, offer, campaignType, budget, startDate, endDate, targetAudience } = req.body;

    // 2. Get the user's ID from the middleware
    const userId = req.user.id;

    // 3. Create the new campaign document
    const newCampaign = new Campaign({
      user: userId, // Link this campaign to the logged-in user
      theme,
      offer,
      campaignType,
      budget,
      startDate,
      endDate,
      targetAudience
      // Add status: 'draft' if you want a default status
    });

    // 4. Save the campaign to the database
    const campaign = await newCampaign.save();

    // 5. Send back the newly created campaign
    // It's often good practice to send back the created object
    res.status(201).json(campaign);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ------------------------------------
// ROUTE 2: GET /api/campaigns
// DESC: Get all campaigns for the logged-in user with stats (PROTECTED)
// (UPDATED to include stats)
// ------------------------------------
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Find campaigns for the user
    // .lean() makes queries faster and returns plain JS objects
    const campaigns = await Campaign.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();

    // Fetch stats for each campaign in parallel
    const campaignsWithStats = await Promise.all(campaigns.map(async (campaign) => {
        // Find trackers linked to this specific campaign
        const trackers = await Tracker.find({ campaign: campaign._id });
        const trackerIds = trackers.map(t => t._id); // Get just the IDs

        // Count scans (Events) for these trackers
        const scans = await Event.countDocuments({ tracker: { $in: trackerIds } });

        // Count redemptions (DiscountCodes marked 'redeemed') for these trackers
        const redemptions = await DiscountCode.countDocuments({
            tracker: { $in: trackerIds },
            status: 'redeemed' // Only count redeemed codes
        });

        // Return the campaign object merged with stats and formatted for frontend
        return {
            ...campaign,
            id: campaign._id.toString(), // Rename _id to id for frontend compatibility
            name: campaign.theme, // Use theme as the display name
            scans: scans,
            redemptions: redemptions,
            status: campaign.status || 'active' // Provide a default status if needed
            // Ensure date fields are formatted if needed, e.g., startDate: campaign.startDate.toISOString()
        };
    }));

    res.json(campaignsWithStats); // Send the enriched campaign list

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// ------------------------------------
// ROUTE 3: POST /api/campaigns/:id/trackers
// DESC: Add a new trackable channel (tracker) to a campaign (PROTECTED)
// ------------------------------------
router.post('/:id/trackers', authMiddleware, async (req, res) => {
  try {
    // 1. Get the channel name from the request body
    const { channelName } = req.body;
    if (!channelName) {
        return res.status(400).json({ msg: 'Channel name is required', message: 'Channel name is required' });
    }

    // 2. Find the campaign using the ID from the URL parameter
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ msg: 'Campaign not found', message: 'Campaign not found' });
    }

    // 3. SECURITY CHECK: Ensure the logged-in user actually owns this campaign
    if (campaign.user.toString() !== req.user.id) {
      // Use toString() to compare ObjectId with string ID
      return res.status(401).json({ msg: 'User not authorized', message: 'User not authorized' });
    }

    // 4. Create the new tracker document
    const newTracker = new Tracker({
      campaign: req.params.id, // Link to the found campaign
      channelName: channelName,
      uniquePath: nanoid(8) // Generates a random 8-character string for the URL
    });

    // 5. Save the tracker to the database
    const tracker = await newTracker.save();

    

    // 6. Send back the newly created tracker object
    res.status(201).json(tracker);

  } catch (err) {
    console.error(err.message);
    // Check for potential duplicate uniquePath error (though unlikely with nanoid)
    if (err.code === 11000) {
         return res.status(500).json({ msg: 'Error generating unique tracker path, please try again.', message: 'Error generating unique tracker path, please try again.' });
    }
    res.status(500).send('Server Error');
  }
});

// ------------------------------------
// ROUTE 4: POST /api/campaigns/plan
// DESC: Generate AI campaign plan suggestions (PROTECTED)
// ------------------------------------
router.post('/plan', authMiddleware, async (req, res) => {
  try {
    const { theme, offer, budget, campaignType, targetAudience } = req.body;
    
    // Mock AI suggestions based on campaign data
    const suggestions = [
      {
        id: 1,
        channel: 'WhatsApp Marketing',
        description: `Share ${theme} offers directly with customers via WhatsApp`,
        content: `🎉 ${theme} is here! ${offer}. Limited time only! Visit our store today.`,
        type: 'Digital',
        estimatedReach: '500-1000 customers'
      },
      {
        id: 2,
        channel: 'Social Media Posts',
        description: 'Facebook and Instagram posts to promote your campaign',
        content: `Celebrate with ${theme}! ${offer} Don't miss out on this amazing deal!`,
        type: 'Digital',
        estimatedReach: '200-500 customers'
      },
      {
        id: 3,
        channel: 'QR Code Flyers',
        description: 'Physical flyers with QR codes for offline promotion',
        content: `${theme} - ${offer}. Scan QR code for instant access!`,
        type: 'Physical',
        estimatedReach: '100-300 customers'
      }
    ];

    res.json({ suggestions });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ------------------------------------
// ROUTE 5: POST /api/campaigns/add-channel
// DESC: Add a marketing channel to campaign (PROTECTED)
// ------------------------------------
router.post('/add-channel', authMiddleware, async (req, res) => {
  try {
    const { campaignId, channel, suggestionId } = req.body;
    
    // Generate QR code URL and tracking URL - use ngrok for mobile access
    const trackingId = require('nanoid').nanoid(8);
    const ngrokUrl = 'https://collectivistic-kade-waggly.ngrok-free.dev';
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ngrokUrl}/track/${trackingId}`;
    const trackingUrl = `${ngrokUrl}/track/${trackingId}`;
    
    res.json({
      message: 'Channel added successfully',
      channel: channel, // Include the original channel name
      qrCode: qrCodeUrl,
      trackingUrl: trackingUrl,
      trackingId: trackingId,
      suggestionId: suggestionId
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ------------------------------------
// ROUTE 6: POST /api/campaigns/generate-assets
// DESC: Generate campaign assets with channel-specific tracking (PROTECTED)
// ------------------------------------
router.post('/generate-assets', authMiddleware, async (req, res) => {
  try {
    const { campaignData, selectedChannels } = req.body;
    
    // Get user info for meaningful URLs
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find the campaign in database
    let campaign;
    if (campaignData.campaignId) {
      campaign = await Campaign.findById(campaignData.campaignId);
    } else {
      campaign = await Campaign.findOne({ 
        user: req.user.id, 
        theme: campaignData.theme 
      }).sort({ createdAt: -1 });
    }
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found. Please create the campaign first.' });
    }
    
    // Helper function to get channel prefix
    const getChannelPrefix = (channelName) => {
      const prefixMap = {
        'pamphlet': 'PAMP',
        'instagram': 'INST', 
        'facebook': 'FACE',
        'whatsapp': 'WHAP',
        'twitter': 'TWIT',
        'linkedin': 'LINK',
        'email': 'MAIL',
        'sms': 'SMSG',
        'print': 'PRNT',
        'main': 'MAIN'
      };
      
      const key = channelName.toLowerCase().replace(/[^a-z]/g, '');
      return prefixMap[key] || 'GENR';
    };
    
    // Create campaign slug for URLs
    const campaignSlug = campaign.theme.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    // Map selected channels to channel definitions
    const channelDefinitions = {
      'pamphlet': { name: 'pamphlet', displayName: 'Pamphlet QR', type: 'print' },
      'instagram': { name: 'instagram', displayName: 'Instagram QR', type: 'social' },
      'facebook': { name: 'facebook', displayName: 'Facebook QR', type: 'social' },
      'whatsapp': { name: 'whatsapp', displayName: 'WhatsApp QR', type: 'messaging' },
      'twitter': { name: 'twitter', displayName: 'Twitter QR', type: 'social' },
      'linkedin': { name: 'linkedin', displayName: 'LinkedIn QR', type: 'social' },
      'email': { name: 'email', displayName: 'Email QR', type: 'email' },
      'sms': { name: 'sms', displayName: 'SMS QR', type: 'messaging' },
      'main': { name: 'main', displayName: 'Main Campaign QR', type: 'general' }
    };
    
    // Create channels array based on selected channels
    let channels = [];
    
    if (selectedChannels && selectedChannels.length > 0) {
      // Use only selected channels
      channels = selectedChannels.map(selectedChannel => {
        console.log('Processing selectedChannel:', selectedChannel);
        
        // Handle different selectedChannel formats
        let channelText = '';
        if (typeof selectedChannel === 'string') {
          channelText = selectedChannel;
        } else if (selectedChannel && typeof selectedChannel === 'object') {
          channelText = selectedChannel.channel || selectedChannel.name || selectedChannel.description || '';
        }
        
        // Clean and normalize channel name
        const channelName = channelText.toLowerCase().replace(/[^a-z]/g, '');
        
        console.log('Cleaned channelName:', channelName);
        
        // Map common channel names to our standard names
        const channelMapping = {
          'facebooklocalads': 'facebook',
          'facebookad': 'facebook',
          'facebookads': 'facebook',
          'facebookmarketing': 'facebook',
          'facebooklocal': 'facebook',
          'instagramad': 'instagram',
          'instagramads': 'instagram',
          'instagrammarketing': 'instagram',
          'whatsappmarketing': 'whatsapp',
          'whatsappshare': 'whatsapp',
          'whatsappshareqr': 'whatsapp',
          'socialmediacampaign': 'facebook', // Default social to facebook
          'socialmediaposts': 'facebook',
          'qrcodeflyers': 'pamphlet',
          'printmaterials': 'pamphlet',
          'pamphletdistribution': 'pamphlet'
        };
        
        const mappedChannelName = channelMapping[channelName] || channelName;
        
        console.log('Mapped channelName:', mappedChannelName);
        
        // Return the channel definition or create a custom one
        if (channelDefinitions[mappedChannelName]) {
          return channelDefinitions[mappedChannelName];
        } else {
          return {
            name: mappedChannelName,
            displayName: `${channelText} QR`,
            type: 'general'
          };
        }
      });
      
      // Remove duplicates
      channels = channels.filter((channel, index, self) => 
        index === self.findIndex(c => c.name === channel.name)
      );
    } else {
      // Fallback: create a main campaign QR if no channels selected
      channels = [channelDefinitions.main];
    }
    
    console.log('Selected channels:', selectedChannels);
    console.log('Generated channels:', channels);
    
    // Create or update trackers for each channel
    const qrCodes = [];
    
    for (const channel of channels) {
      // Check if tracker already exists
      let tracker = await Tracker.findOne({
        campaign: campaign._id,
        channelName: channel.name
      });
      
      if (!tracker) {
        // Create new tracker
        tracker = new Tracker({
          campaign: campaign._id,
          channelName: channel.name,
          channelType: channel.type,
          uniquePath: `${campaignSlug}-${channel.name}-${require('nanoid').nanoid(4)}`,
          codePrefix: getChannelPrefix(channel.name)
        });
        await tracker.save();
      }
      
      // Generate QR code and tracking URL - use ngrok URL for mobile access
      const ngrokUrl = 'https://collectivistic-kade-waggly.ngrok-free.dev';
      const trackingUrl = `${ngrokUrl}/track/${campaignSlug}?channel=${channel.name}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(trackingUrl)}`;
      
      qrCodes.push({
        id: qrCodes.length + 1,
        name: channel.displayName,
        channel: channel.name,
        channelType: channel.type,
        url: qrCodeUrl,
        trackingUrl: trackingUrl,
        scans: tracker.visits,
        conversions: tracker.conversions,
        conversionRate: tracker.visits > 0 ? ((tracker.conversions / tracker.visits) * 100).toFixed(2) : 0,
        codePrefix: tracker.codePrefix
      });
    }
    
    // Generate social media posts only for selected social channels
    const socialMediaPosts = [];
    const socialPlatforms = {
      'facebook': {
        platform: 'Facebook',
        content: `🎉 ${campaignData.theme} is here! ${campaignData.offer}\n\nDon't miss out on this amazing deal! Visit our store or scan the QR code to claim your offer.\n\n#Sale #Offers #${campaignData.theme.replace(/\s+/g, '')}`,
        hashtags: ['#Sale', '#Offers', `#${campaignData.theme.replace(/\s+/g, '')}`],
        imageUrl: 'https://via.placeholder.com/1200x630/3B82F6/FFFFFF?text=Facebook+Post'
      },
      'instagram': {
        platform: 'Instagram',
        content: `✨ ${campaignData.theme} ✨\n\n${campaignData.offer}\n\nSwipe up or scan our QR code! 📱\n\n#${campaignData.theme.replace(/\s+/g, '')} #InstaSale #LimitedOffer`,
        hashtags: ['#InstaSale', '#LimitedOffer', `#${campaignData.theme.replace(/\s+/g, '')}`],
        imageUrl: 'https://via.placeholder.com/1080x1080/8B5CF6/FFFFFF?text=Instagram+Post'
      },
      'twitter': {
        platform: 'Twitter',
        content: `🎉 ${campaignData.theme} 🎉\n\n${campaignData.offer}\n\nVisit our store today! #${campaignData.theme.replace(/\s+/g, '')} #Sale`,
        hashtags: ['#Sale', `#${campaignData.theme.replace(/\s+/g, '')}`],
        imageUrl: 'https://via.placeholder.com/1200x675/1DA1F2/FFFFFF?text=Twitter+Post'
      },
      'whatsapp': {
        platform: 'WhatsApp',
        content: `🛍️ *${campaignData.theme}* 🛍️\n\n${campaignData.offer}\n\n📍 Visit our store today!\n💬 Share with friends and family\n\nLimited time offer!`,
        hashtags: [],
        imageUrl: 'https://via.placeholder.com/800x600/10B981/FFFFFF?text=WhatsApp+Message'
      }
    };

    channels.forEach((channel, index) => {
      if (socialPlatforms[channel.name]) {
        const platform = socialPlatforms[channel.name];
        socialMediaPosts.push({
          id: socialMediaPosts.length + 1,
          platform: platform.platform,
          content: platform.content,
          hashtags: platform.hashtags,
          imageUrl: platform.imageUrl,
          trackingUrl: qrCodes.find(qr => qr.channel === channel.name)?.trackingUrl,
          qrCode: qrCodes.find(qr => qr.channel === channel.name)?.url
        });
      }
    });

    // Generate pamphlets only if print channels are selected
    const pamphlets = [];
    const hasPrintChannel = channels.some(ch => ch.type === 'print' || ch.name === 'pamphlet');
    const hasMainChannel = channels.some(ch => ch.name === 'main');

    if (hasPrintChannel) {
      pamphlets.push({
        id: 1,
        name: 'A4 Flyer Design',
        description: `Professional A4 flyer for ${campaignData.theme} with QR code and offer details`,
        downloadUrl: '#',
        previewUrl: 'https://via.placeholder.com/595x842/EF4444/FFFFFF?text=A4+Flyer+Design',
        format: 'PDF',
        trackingUrl: qrCodes.find(qr => qr.channel === 'pamphlet')?.trackingUrl,
        qrCode: qrCodes.find(qr => qr.channel === 'pamphlet')?.url
      });
    }

    if (hasMainChannel || pamphlets.length === 0) {
      pamphlets.push({
        id: pamphlets.length + 1,
        name: 'Business Card Insert',
        description: 'Small card design for counter display',
        downloadUrl: '#',
        previewUrl: 'https://via.placeholder.com/350x200/F59E0B/FFFFFF?text=Business+Card',
        format: 'PDF',
        trackingUrl: qrCodes.find(qr => qr.channel === 'main')?.trackingUrl || qrCodes[0]?.trackingUrl,
        qrCode: qrCodes.find(qr => qr.channel === 'main')?.url || qrCodes[0]?.url
      });
    }

    const assets = {
      qrCodes,
      socialMediaPosts,
      pamphlets,
      campaignAnalytics: {
        totalVisits: qrCodes.reduce((sum, qr) => sum + qr.scans, 0),
        totalConversions: qrCodes.reduce((sum, qr) => sum + qr.conversions, 0),
        channelPerformance: qrCodes.map(qr => ({
          channel: qr.name,
          visits: qr.scans,
          conversions: qr.conversions,
          conversionRate: qr.conversionRate
        }))
      }
    };

    res.json({ assets });
  } catch (err) {
    console.error('Generate assets error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;