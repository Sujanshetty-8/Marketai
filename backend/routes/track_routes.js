// routes/track.routes.js
const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');

// Import the models
const Tracker = require('../models/tracker.js');
const Event = require('../models/event.js');
const DiscountCode = require('../models/discountcode.js');
const Campaign = require('../models/camp_model.js');
const User = require('../models/user_model.js');
const Analytics = require('../models/analytics.js');
const BusinessProfile = require('../models/business_profile.js');

// Helper function to generate channel-specific code prefix
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
    'radio': 'RADI',
    'tv': 'TVSN',
    'outdoor': 'OUTD',
    'direct': 'DRCT',
    'referral': 'REFR'
  };
  
  const key = channelName.toLowerCase().replace(/[^a-z]/g, '');
  return prefixMap[key] || 'GENR'; // Generic prefix as fallback
};

// ROUTE: GET /track/:campaignName?channel=:channelName
// Dynamic landing page route
router.get('/:campaignName', async (req, res) => {
  try {
    const { campaignName } = req.params;
    const { channel } = req.query;
    
    // Check if this is a browser request (not an API call)
    const acceptHeader = req.get('Accept') || '';
    const userAgent = req.get('User-Agent') || '';
    const isBrowserRequest = acceptHeader.includes('text/html') && 
                           !acceptHeader.includes('application/json');
    
    // If it's a browser request, serve a simple HTML page that redirects to React app
    if (isBrowserRequest) {
      // For mobile access via ngrok, we need to serve the landing page directly
      // since the frontend might not be accessible from mobile
      const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
      const frontendUrl = `${frontendBase}/track/${campaignName}${channel ? `?channel=${channel}` : ''}`;
      
      // Check if this is a mobile/external request (via ngrok)
      const isExternalRequest = req.get('host')?.includes('ngrok') || req.get('host')?.includes('ngrok-free.dev');
      
      if (isExternalRequest) {
        // For external/mobile requests, serve the landing page content directly
        // We'll create a simple mobile-friendly landing page
        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Campaign Offer</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .container {
                background: rgba(255,255,255,0.95);
                color: #333;
                border-radius: 20px;
                padding: 30px;
                max-width: 400px;
                width: 100%;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              }
              .offer-icon { font-size: 60px; margin-bottom: 20px; }
              .shop-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #333; }
              .campaign-name { font-size: 18px; color: #666; margin-bottom: 20px; }
              .offer-box { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 15px;
                margin: 20px 0;
              }
              .code-box {
                background: #f8f9fa;
                border: 2px dashed #dee2e6;
                padding: 20px;
                border-radius: 15px;
                margin: 20px 0;
              }
              .code { 
                font-size: 28px; 
                font-weight: bold; 
                color: #007bff; 
                letter-spacing: 2px;
                margin: 10px 0;
              }
              .loading { 
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #007bff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              .btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                margin: 10px 5px;
              }
              .contact-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 10px;
                margin-top: 20px;
                font-size: 14px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="offer-icon">🎉</div>
              <div class="shop-name" id="shopName">Loading...</div>
              <div class="campaign-name" id="campaignName">Exclusive Offer</div>
              
              <div class="offer-box">
                <div id="offerText">Loading your special offer...</div>
              </div>
              
              <div class="code-box">
                <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Your unique code:</div>
                <div class="code" id="uniqueCode">
                  <div class="loading"></div>
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 10px;">Show this code at the store</div>
              </div>
              
              <div class="contact-info" id="contactInfo">
                <div>📍 Visit our store to redeem</div>
              </div>
              
              <button class="btn" onclick="copyCode()" id="copyBtn" style="display:none;">Copy Code</button>
            </div>
            
            <script>
              // Fetch the actual campaign data
              fetch(window.location.href, {
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': 'true'
                }
              })
              .then(response => response.json())
              .then(data => {
                document.getElementById('shopName').textContent = data.shopName || 'Special Offer';
                document.getElementById('campaignName').textContent = data.campaignName || 'Exclusive Deal';
                document.getElementById('offerText').textContent = data.offer || 'Amazing discount just for you!';
                document.getElementById('uniqueCode').textContent = data.uniqueCode || 'LOADING...';
                document.getElementById('copyBtn').style.display = 'inline-block';
                
                if (data.shopAddress || data.shopPhone) {
                  let contactHtml = '';
                  if (data.shopAddress) contactHtml += '📍 ' + data.shopAddress + '<br>';
                  if (data.shopPhone) contactHtml += '📞 ' + data.shopPhone;
                  document.getElementById('contactInfo').innerHTML = contactHtml;
                }
              })
              .catch(error => {
                console.error('Error:', error);
                document.getElementById('uniqueCode').textContent = 'ERROR';
              });
              
              function copyCode() {
                const code = document.getElementById('uniqueCode').textContent;
                navigator.clipboard.writeText(code).then(() => {
                  document.getElementById('copyBtn').textContent = 'Copied!';
                  setTimeout(() => {
                    document.getElementById('copyBtn').textContent = 'Copy Code';
                  }, 2000);
                });
              }
            </script>
          </body>
          </html>
        `;
        return res.send(html);
      } else {
        // For local requests, redirect to React frontend
        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Loading Campaign...</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .loader { text-align: center; }
              .spinner { 
                border: 4px solid rgba(255,255,255,0.3); 
                border-radius: 50%; 
                border-top: 4px solid white; 
                width: 40px; 
                height: 40px; 
                animation: spin 1s linear infinite; 
                margin: 0 auto 20px;
              }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
            <script>
              // Redirect to frontend after a brief moment
              setTimeout(() => {
                window.location.href = '${frontendUrl}';
              }, 1000);
            </script>
          </head>
          <body>
            <div class="loader">
              <div class="spinner"></div>
              <h2>Loading your exclusive offer...</h2>
              <p>Please wait while we prepare your campaign details.</p>
            </div>
          </body>
          </html>
        `;
        return res.send(html);
      }
    }
    
    console.log(`[TRACKING] API Request received for campaignName: "${campaignName}", channel: "${channel}"`);
    
    // Get client info for analytics
    const clientInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer')
    };

    // For demo/test purposes, provide mock data for common test IDs
    const testIds = ['demo', 'test123', 'campaign-abc', 'mock-tracker-123'];
    if (testIds.includes(campaignName)) {
      const mockCode = `${getChannelPrefix(channel || 'demo')}${nanoid(3).toUpperCase()}`;
      const mockData = {
        shopName: 'Demo Electronics Store',
        campaignName: 'Diwali Special Offer 2024',
        offer: '🎉 Get 25% OFF on all electronics + Free gift wrapping! 🎁',
        uniqueCode: mockCode,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        shopAddress: '123 Main Street, Electronics Market, Mumbai, Maharashtra 400001',
        shopPhone: '+91 98765 43210',
        terms: 'Valid on minimum purchase of ₹500. Cannot be combined with other offers. Valid until stocks last.',
        channelName: channel || 'demo',
        trackingId: 'demo-tracking'
      };
      return res.status(200).json(mockData);
    }

    // Find campaign by name (theme) and get associated tracker for the channel
    const queryStr = campaignName.replace(/-/g, ' ').trim().replace(/[^a-zA-Z0-9\s]/g, '');
    const campaign = await Campaign.findOne({ 
      theme: { $regex: new RegExp(queryStr, 'i') }
    }).populate('user');

    console.log(`[TRACKING] Campaign search result for "${campaignName}": ${campaign ? 'FOUND' : 'NOT FOUND'}`);
    if (campaign) {
      console.log(`[TRACKING] Shop name: "${campaign.user?.shop_name || 'missing'}", theme: "${campaign.theme}"`);
    }

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Find or create tracker for this channel
    let tracker = await Tracker.findOne({ 
      campaign: campaign._id, 
      channelName: { $regex: new RegExp(channel || 'main', 'i') }
    });

    if (!tracker) {
      // Create new tracker for this channel
      const channelPrefix = getChannelPrefix(channel || 'main');
      tracker = new Tracker({
        campaign: campaign._id,
        channelName: channel || 'main',
        channelType: channel ? channel.toLowerCase() : 'main',
        uniquePath: `${campaignName}-${channel || 'main'}-${nanoid(4)}`,
        codePrefix: channelPrefix
      });
      await tracker.save();
    }

    // Increment visit count
    tracker.visits += 1;
    await tracker.save();

    // Log the visit event
    const newEvent = new Event({ tracker: tracker._id });
    await newEvent.save();

    // Generate channel-specific unique discount code
    const codeNumber = nanoid(3).toUpperCase();
    const codeString = `${tracker.codePrefix}${codeNumber}`;
    
    const newCode = new DiscountCode({
      tracker: tracker._id,
      codeString: codeString,
      channelName: tracker.channelName,
      customerInfo: clientInfo
    });
    await newCode.save();

    // 1. Device Type
    let deviceType = 'Desktop';
    const ua = req.get('User-Agent') || '';
    if (/mobile|iphone|android|phone/i.test(ua)) {
      deviceType = 'Mobile';
    } else if (/ipad|tablet/i.test(ua)) {
      deviceType = 'Tablet';
    }

    // 2. Geolocation Fallback
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const sampleLocations = ['Mangalore, Karnataka', 'Bangalore, Karnataka', 'Mumbai, Maharashtra', 'Chennai, Tamil Nadu', 'Delhi'];
    const locationStr = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];

    // 3. Unique vs Returning
    const existingVisits = await Analytics.countDocuments({
      tracker: tracker._id,
      'metadata.ipAddress': ip
    });
    const visitType = existingVisits > 0 ? 'returning' : 'unique';

    // Log analytics
    const analyticsEntry = new Analytics({
      campaign: campaign._id,
      tracker: tracker._id,
      eventType: 'visit',
      channelName: tracker.channelName,
      channelType: tracker.channelType,
      metadata: {
        ipAddress: ip,
        userAgent: ua,
        referrer: req.get('Referer') || '',
        deviceType,
        location: locationStr,
        visitType,
        codeGenerated: codeString,
        timestamp: new Date()
      }
    });
    await analyticsEntry.save();

    // Fetch the business profile to get the USP
    const businessProfile = await BusinessProfile.findOne({ user: campaign.user._id });

    // Prepare response data
    const responseData = {
      shopName: campaign.user.shop_name,
      campaignName: businessProfile && businessProfile.usp ? businessProfile.usp : campaign.theme,
      offer: campaign.offer,
      uniqueCode: codeString,
      validUntil: campaign.endDate.toISOString(),
      shopAddress: campaign.user.shop_address,
      shopPhone: campaign.user.shop_phone,
      terms: campaign.terms || 'Standard terms apply.',
      channelName: tracker.channelName,
      trackingId: tracker._id.toString(),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${req.protocol}://${req.get('host')}/track/${campaignName}?channel=${tracker.channelName}`
    };

    res.status(200).json(responseData);

  } catch (err) {
    console.error('Track route error:', err.message);
    res.status(500).json({ message: 'Server Error during tracking' });
  }
});

// ROUTE: GET /track/legacy/:uniquePath (for backward compatibility)
router.get('/legacy/:uniquePath', async (req, res) => {
  try {
    const { uniquePath } = req.params;

    // Check if this is a browser request (not an API call)
    const acceptHeader = req.get('Accept') || '';
    const userAgent = req.get('User-Agent') || '';
    const isBrowserRequest = acceptHeader.includes('text/html') && 
                           !acceptHeader.includes('application/json');
    
    // If it's a browser request, serve a simple HTML page that redirects to React app
    if (isBrowserRequest) {
      const frontendUrl = `http://localhost:5173/track/legacy/${uniquePath}`;
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Loading Campaign...</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .loader { text-align: center; }
            .spinner { 
              border: 4px solid rgba(255,255,255,0.3); 
              border-radius: 50%; 
              border-top: 4px solid white; 
              width: 40px; 
              height: 40px; 
              animation: spin 1s linear infinite; 
              margin: 0 auto 20px;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
          <script>
            // Redirect to frontend after a brief moment
            setTimeout(() => {
              window.location.href = '${frontendUrl}';
            }, 1000);
          </script>
        </head>
        <body>
          <div class="loader">
            <div class="spinner"></div>
            <h2>Loading your exclusive offer...</h2>
            <p>Please wait while we prepare your campaign details.</p>
          </div>
        </body>
        </html>
      `;
      return res.send(html);
    }

    // Find the tracker and populate related campaign and user info
    const tracker = await Tracker.findOne({ uniquePath: uniquePath })
      .populate({
        path: 'campaign',
        populate: { path: 'user' }
      });

    if (!tracker || !tracker.campaign || !tracker.campaign.user) {
      return res.status(404).json({ message: 'Invalid or expired tracking link' });
    }

    // Increment visit count
    tracker.visits += 1;
    await tracker.save();

    // Log the scan/click
    const newEvent = new Event({ tracker: tracker._id });
    await newEvent.save();

    // Generate unique discount code with channel prefix
    const codeNumber = nanoid(3).toUpperCase();
    const codeString = `${tracker.codePrefix}${codeNumber}`;
    
    const newCode = new DiscountCode({
      tracker: tracker._id,
      codeString: codeString,
      channelName: tracker.channelName
    });
    await newCode.save();

    // 1. Device Type
    let deviceType = 'Desktop';
    const ua = req.get('User-Agent') || '';
    if (/mobile|iphone|android|phone/i.test(ua)) {
      deviceType = 'Mobile';
    } else if (/ipad|tablet/i.test(ua)) {
      deviceType = 'Tablet';
    }

    // 2. Geolocation Fallback
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const sampleLocations = ['Mangalore, Karnataka', 'Bangalore, Karnataka', 'Mumbai, Maharashtra', 'Chennai, Tamil Nadu', 'Delhi'];
    const locationStr = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];

    // 3. Unique vs Returning
    const existingVisits = await Analytics.countDocuments({
      tracker: tracker._id,
      'metadata.ipAddress': ip
    });
    const visitType = existingVisits > 0 ? 'returning' : 'unique';

    // Log analytics
    const analyticsEntry = new Analytics({
      campaign: tracker.campaign._id,
      tracker: tracker._id,
      eventType: 'visit',
      channelName: tracker.channelName,
      channelType: tracker.channelType,
      metadata: {
        ipAddress: ip,
        userAgent: ua,
        referrer: req.get('Referer') || '',
        deviceType,
        location: locationStr,
        visitType,
        codeGenerated: codeString,
        timestamp: new Date()
      }
    });
    await analyticsEntry.save();

    const campaignDetails = tracker.campaign;
    const userDetails = campaignDetails.user;

    // Fetch the business profile to get the USP
    const businessProfile = await BusinessProfile.findOne({ user: userDetails._id });

    const responseData = {
      shopName: userDetails.shop_name,
      campaignName: businessProfile && businessProfile.usp ? businessProfile.usp : campaignDetails.theme,
      offer: campaignDetails.offer,
      uniqueCode: codeString,
      validUntil: campaignDetails.endDate.toISOString(),
      shopAddress: userDetails.shop_address,
      shopPhone: userDetails.shop_phone,
      terms: campaignDetails.terms || 'Standard terms apply.',
      channelName: tracker.channelName,
      trackingId: tracker._id.toString()
    };

    res.status(200).json(responseData);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error during tracking' });
  }
});

module.exports = router;