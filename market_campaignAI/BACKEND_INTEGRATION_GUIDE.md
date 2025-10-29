# Backend Integration Guide for Campaign AI

This guide helps your backend team integrate quickly with the React frontend.

## 🚀 Quick Setup Steps

### 1. Environment Configuration

Create these environment files for easy switching between mock and real backend:

**For Development (Mock Mode)**:
```bash
# .env.development
VITE_USE_MOCK=true
VITE_API_BASE_URL=http://localhost:3000
```

**For Production (Real Backend)**:
```bash
# .env.production
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://your-backend-api.com
```

### 2. Backend Server Requirements

Your backend should run on:
- **Development**: `http://localhost:3000`
- **Production**: Your deployed API URL

### 3. CORS Configuration

Add CORS headers to allow frontend requests:

```javascript
// Express.js example
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',  // Vite dev server
    'https://your-frontend-domain.com'  // Production frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 📋 Implementation Priority

Implement endpoints in this order for smooth integration:

### Phase 1: Authentication (Critical)
1. `POST /api/auth/register`
2. `POST /api/auth/login`

### Phase 2: Basic Campaign Management
3. `GET /api/campaigns`
4. `POST /api/campaigns/plan`

### Phase 3: Advanced Features
5. `POST /api/campaigns/add-channel`
6. `POST /api/campaigns/generate-assets`
7. `GET /track/:trackerId`
8. `POST /api/redeem`

## 🔧 Database Schema Suggestions

### Users/Shops Table
```sql
CREATE TABLE shops (
  id VARCHAR(50) PRIMARY KEY,
  shop_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Campaigns Table
```sql
CREATE TABLE campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  theme VARCHAR(255) NOT NULL,
  offer TEXT NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_audience VARCHAR(255),
  campaign_type ENUM('online', 'offline', 'hybrid') NOT NULL,
  status ENUM('draft', 'active', 'paused', 'completed') DEFAULT 'draft',
  scans INT DEFAULT 0,
  redemptions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id)
);
```

### Tracking Table
```sql
CREATE TABLE tracking (
  id VARCHAR(50) PRIMARY KEY,
  campaign_id INT NOT NULL,
  channel VARCHAR(100) NOT NULL,
  tracking_url VARCHAR(500) NOT NULL,
  qr_code_url VARCHAR(500),
  scans INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
```

### Redemptions Table
```sql
CREATE TABLE redemptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tracking_id VARCHAR(50) NOT NULL,
  unique_code VARCHAR(20) NOT NULL UNIQUE,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMP NULL,
  customer_ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tracking_id) REFERENCES tracking(id)
);
```

## 🎯 Sample Backend Implementation (Node.js/Express)

### Basic Server Setup
```javascript
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-frontend.com'],
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

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { shopName, address, phoneNumber, email, password } = req.body;
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Save to database (implement your DB logic)
    const shopId = `shop_${Date.now()}`;
    
    res.status(201).json({
      message: 'Registration successful',
      shopId
    });
  } catch (error) {
    res.status(400).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Verify credentials (implement your DB logic)
    const shop = { id: 'shop_123', shopName: 'Demo Shop', email };
    
    // Generate JWT
    const token = jwt.sign(
      { shopId: shop.id, shopName: shop.shopName, email: shop.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      shopName: shop.shopName,
      shopId: shop.id
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/campaigns', authenticateToken, async (req, res) => {
  try {
    // Fetch campaigns from database
    const campaigns = [
      {
        id: 1,
        name: 'Diwali Sale 2024',
        theme: 'Diwali Sale',
        offer: '20% off on all items',
        budget: 5000,
        startDate: '2024-11-01',
        endDate: '2024-11-15',
        status: 'active',
        scans: 45,
        redemptions: 12,
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch campaigns' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 🤖 AI Integration Suggestions

### For Campaign Suggestions (`/api/campaigns/plan`)
```javascript
// Example using OpenAI
const openai = require('openai');

app.post('/api/campaigns/plan', authenticateToken, async (req, res) => {
  try {
    const { theme, offer, budget, targetAudience, campaignType } = req.body;
    
    const prompt = `Generate marketing campaign suggestions for:
    Theme: ${theme}
    Offer: ${offer}
    Budget: ₹${budget}
    Target Audience: ${targetAudience}
    Campaign Type: ${campaignType}
    
    Provide 3 channel suggestions with content, estimated reach, and cost.`;
    
    // Call OpenAI API or your AI service
    const suggestions = await generateAISuggestions(prompt);
    
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate suggestions' });
  }
});
```

### For Asset Generation (`/api/campaigns/generate-assets`)
```javascript
const QRCode = require('qrcode');

app.post('/api/campaigns/generate-assets', authenticateToken, async (req, res) => {
  try {
    const { campaignData, selectedChannels } = req.body;
    
    // Generate unique tracking IDs
    const trackingId = `track_${Date.now()}`;
    const trackingUrl = `${process.env.FRONTEND_URL}/track/${trackingId}`;
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(trackingUrl);
    
    // Generate social media content using AI
    const socialMediaPosts = await generateSocialMediaContent(campaignData, selectedChannels);
    
    // Generate PDF pamphlets
    const pamphlets = await generatePamphlets(campaignData, trackingUrl);
    
    const assets = {
      qrCodes: [{
        id: 1,
        name: 'Main Campaign QR',
        url: qrCodeUrl,
        trackingUrl,
        scans: 0
      }],
      socialMediaPosts,
      pamphlets
    };
    
    res.json({ assets });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate assets' });
  }
});
```

## 📱 QR Code & Tracking Implementation

### QR Code Generation
```javascript
const QRCode = require('qrcode');

const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    throw new Error('QR code generation failed');
  }
};
```

### Tracking Endpoint
```javascript
app.get('/track/:trackerId', async (req, res) => {
  try {
    const { trackerId } = req.params;
    
    // Log the scan
    await logScan(trackerId, req.ip);
    
    // Get campaign details
    const campaignDetails = await getCampaignByTrackerId(trackerId);
    
    if (!campaignDetails) {
      return res.status(404).json({ message: 'Invalid or expired tracking link' });
    }
    
    // Generate unique redemption code
    const uniqueCode = generateRedemptionCode();
    await saveRedemptionCode(trackerId, uniqueCode);
    
    res.json({
      shopName: campaignDetails.shopName,
      campaignName: campaignDetails.name,
      offer: campaignDetails.offer,
      uniqueCode,
      validUntil: campaignDetails.endDate,
      shopAddress: campaignDetails.shopAddress,
      shopPhone: campaignDetails.shopPhone,
      terms: campaignDetails.terms
    });
  } catch (error) {
    res.status(500).json({ message: 'Tracking failed' });
  }
});
```

## 🎨 PDF Generation Example

```javascript
const PDFDocument = require('pdfkit');

const generateFlyer = async (campaignData, qrCodeUrl) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    
    // Add content to PDF
    doc.fontSize(24).text(campaignData.theme, 50, 50);
    doc.fontSize(16).text(campaignData.offer, 50, 100);
    
    // Add QR code (you'll need to convert base64 to buffer)
    // doc.image(qrCodeBuffer, 400, 50, { width: 100 });
    
    doc.end();
  });
};
```

## 🧪 Testing Your Backend

### 1. Test Authentication
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"shopName":"Test Shop","address":"123 Test St","phoneNumber":"+91 1234567890","email":"test@shop.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@shop.com","password":"password123"}'
```

### 2. Test Protected Routes
```bash
# Get campaigns (replace TOKEN with actual JWT)
curl -X GET http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer TOKEN"
```

### 3. Connect Frontend
```bash
# Update .env
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:3000

# Restart frontend
npm run dev
```

## 🚨 Common Issues & Solutions

### CORS Errors
- Make sure CORS is configured for your frontend domain
- Include credentials: true if using cookies

### JWT Token Issues
- Verify JWT secret matches between frontend and backend
- Check token expiration times
- Ensure proper Authorization header format

### API Response Format
- Frontend expects exact JSON structure as documented
- Include proper HTTP status codes
- Handle errors gracefully with meaningful messages

## 📞 Support

If your backend team needs help:
1. Check the API_DOCUMENTATION.md for detailed endpoint specs
2. Test endpoints with Postman before connecting frontend
3. Use browser dev tools to see exact requests from frontend
4. Enable mock mode (`VITE_USE_MOCK=true`) to see expected responses

Your backend team can implement endpoints incrementally - the frontend will fall back to mock data for unimplemented endpoints during development! 🚀