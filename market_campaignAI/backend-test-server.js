// Simple test server for backend team to get started quickly
// Run with: node backend-test-server.js

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'test-secret-key';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Mock database
const shops = [];
const campaigns = [];

// Authentication Routes
app.post('/api/auth/register', (req, res) => {
  try {
    const { shopName, address, phoneNumber, email, password } = req.body;
    
    // Check if email exists
    if (shops.find(shop => shop.email === email)) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const shopId = `shop_${Date.now()}`;
    shops.push({
      id: shopId,
      shopName,
      address,
      phoneNumber,
      email,
      password // In real app, hash this!
    });
    
    console.log(`✅ New shop registered: ${shopName} (${email})`);
    
    res.status(201).json({
      message: 'Registration successful',
      shopId
    });
  } catch (error) {
    res.status(400).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    const shop = shops.find(s => s.email === email && s.password === password);
    
    if (!shop) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { shopId: shop.id, shopName: shop.shopName, email: shop.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`✅ Shop logged in: ${shop.shopName}`);
    
    res.json({
      token,
      shopName: shop.shopName,
      shopId: shop.id
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Campaign Routes
app.get('/api/campaigns', authenticateToken, (req, res) => {
  try {
    const shopCampaigns = campaigns.filter(c => c.shopId === req.user.shopId);
    
    console.log(`📊 Fetched ${shopCampaigns.length} campaigns for ${req.user.shopName}`);
    
    res.json(shopCampaigns);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch campaigns' });
  }
});

app.post('/api/campaigns/plan', authenticateToken, (req, res) => {
  try {
    const { theme, offer, budget, targetAudience, campaignType } = req.body;
    
    console.log(`🤖 Generating AI plan for: ${theme}`);
    
    // Mock AI suggestions
    const suggestions = [
      {
        id: 1,
        channel: 'WhatsApp Marketing',
        description: 'Share offers directly with customers',
        content: `🎉 ${theme} is here! ${offer}\n\nDon't miss out! Visit our store or scan QR code!\n\n#${theme.replace(/\s+/g, '')} #Offers`,
        type: 'Digital',
        estimatedReach: '500-1000 customers',
        estimatedCost: Math.floor(budget * 0.2)
      },
      {
        id: 2,
        channel: 'Facebook Posts',
        description: 'Social media marketing on Facebook',
        content: `Celebrate with ${theme}! ${offer}\n\nLimited time offer - don't miss out!`,
        type: 'Digital',
        estimatedReach: '200-800 customers',
        estimatedCost: Math.floor(budget * 0.3)
      },
      {
        id: 3,
        channel: 'Print Flyers',
        description: 'Physical flyers for local distribution',
        content: `${theme} - ${offer}`,
        type: 'Offline',
        estimatedReach: '1000-2000 customers',
        estimatedCost: Math.floor(budget * 0.4)
      }
    ];
    
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate suggestions' });
  }
});

app.post('/api/campaigns/add-channel', authenticateToken, (req, res) => {
  try {
    const { suggestionId, channel, content } = req.body;
    
    console.log(`➕ Channel added: ${channel}`);
    
    res.json({
      message: 'Channel added successfully',
      channelId: `channel_${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add channel' });
  }
});

app.post('/api/campaigns/generate-assets', authenticateToken, (req, res) => {
  try {
    const { campaignData, selectedChannels } = req.body;
    
    console.log(`🎨 Generating assets for: ${campaignData.theme}`);
    
    // Create campaign record
    const campaignId = campaigns.length + 1;
    campaigns.push({
      id: campaignId,
      shopId: req.user.shopId,
      name: `${campaignData.theme} Campaign`,
      theme: campaignData.theme,
      offer: campaignData.offer,
      budget: parseFloat(campaignData.budget),
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      status: 'active',
      scans: 0,
      redemptions: 0,
      createdAt: new Date().toISOString()
    });
    
    // Generate mock assets
    const assets = {
      qrCodes: [
        {
          id: 1,
          name: 'Main Campaign QR',
          url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://localhost:5173/track/campaign_${campaignId}`,
          trackingUrl: `http://localhost:5173/track/campaign_${campaignId}`,
          scans: 0
        },
        {
          id: 2,
          name: 'WhatsApp Share QR',
          url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://localhost:5173/track/whatsapp_${campaignId}`,
          trackingUrl: `http://localhost:5173/track/whatsapp_${campaignId}`,
          scans: 0
        }
      ],
      socialMediaPosts: [
        {
          id: 1,
          platform: 'Facebook',
          content: `🎉 ${campaignData.theme} is here! ${campaignData.offer}\n\nDon't miss out on this amazing deal! Visit our store or scan the QR code to claim your offer.\n\n#${campaignData.theme.replace(/\s+/g, '')} #Sale #Offers`,
          hashtags: ['#Sale', '#Offers', `#${campaignData.theme.replace(/\s+/g, '')}`],
          imageUrl: 'https://via.placeholder.com/1200x630/3B82F6/FFFFFF?text=Facebook+Post'
        },
        {
          id: 2,
          platform: 'Instagram',
          content: `✨ ${campaignData.theme} ✨\n\n${campaignData.offer}\n\nSwipe up or scan our QR code! 📱\n\n#${campaignData.theme.replace(/\s+/g, '')} #InstaSale #LimitedOffer`,
          hashtags: ['#InstaSale', '#LimitedOffer', `#${campaignData.theme.replace(/\s+/g, '')}`],
          imageUrl: 'https://via.placeholder.com/1080x1080/8B5CF6/FFFFFF?text=Instagram+Post'
        },
        {
          id: 3,
          platform: 'WhatsApp',
          content: `🛍️ *${campaignData.theme}* 🛍️\n\n${campaignData.offer}\n\n📍 Visit our store today!\n💬 Share with friends and family\n\nValid till ${campaignData.endDate}`,
          hashtags: [],
          imageUrl: 'https://via.placeholder.com/800x600/10B981/FFFFFF?text=WhatsApp+Message'
        }
      ],
      pamphlets: [
        {
          id: 1,
          name: 'A4 Flyer Design',
          description: 'Professional A4 flyer with QR code and offer details',
          downloadUrl: '#',
          previewUrl: 'https://via.placeholder.com/595x842/EF4444/FFFFFF?text=A4+Flyer+Design',
          format: 'PDF'
        },
        {
          id: 2,
          name: 'Business Card Insert',
          description: 'Small card design for counter display',
          downloadUrl: '#',
          previewUrl: 'https://via.placeholder.com/350x200/F59E0B/FFFFFF?text=Business+Card',
          format: 'PDF'
        }
      ]
    };
    
    res.json({ assets });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate assets' });
  }
});

// Tracking Routes
app.get('/track/:trackerId', (req, res) => {
  try {
    const { trackerId } = req.params;
    
    console.log(`👀 QR Code scanned: ${trackerId} from IP: ${req.ip}`);
    
    // Mock tracking data
    const trackingData = {
      shopName: 'Demo Shop',
      campaignName: 'Special Campaign',
      offer: '20% off on all items + Free gift wrapping',
      uniqueCode: `CODE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      validUntil: '2024-12-31',
      shopAddress: '123 Main Street, Mumbai, Maharashtra',
      shopPhone: '+91 98765 43210',
      terms: 'Valid on minimum purchase of ₹500. Cannot be combined with other offers.'
    };
    
    res.json(trackingData);
  } catch (error) {
    res.status(404).json({ message: 'Invalid or expired tracking link' });
  }
});

app.post('/api/redeem', authenticateToken, (req, res) => {
  try {
    const { code } = req.body;
    
    console.log(`🎯 Code redeemed: ${code} by ${req.user.shopName}`);
    
    res.json({
      message: 'Code redeemed successfully!',
      customerDetails: {
        scannedAt: new Date().toISOString(),
        campaign: 'Demo Campaign'
      }
    });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or already used code' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Campaign AI Backend Test Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Campaign AI Test Backend Server Started!

📍 Server: http://localhost:${PORT}
🔍 Health Check: http://localhost:${PORT}/health

📚 Available Endpoints:
   POST /api/auth/register
   POST /api/auth/login
   GET  /api/campaigns
   POST /api/campaigns/plan
   POST /api/campaigns/add-channel
   POST /api/campaigns/generate-assets
   GET  /track/:trackerId
   POST /api/redeem

🎯 To connect frontend:
   1. Set VITE_USE_MOCK=false in .env
   2. Set VITE_API_BASE_URL=http://localhost:3000
   3. Restart frontend: npm run dev

💡 This is a test server with mock data.
   Replace with your real database and business logic!
  `);
});

module.exports = app;