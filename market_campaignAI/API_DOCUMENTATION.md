# Campaign AI - Backend API Documentation

This document provides all the API endpoints that the frontend expects. The backend team can implement these endpoints to connect with the React frontend.

## 🔧 Configuration

### Environment Variables
The frontend reads the backend URL from:
```bash
VITE_API_BASE_URL=http://localhost:3000  # Your backend URL
VITE_USE_MOCK=false                      # Set to false to use real backend
```

### CORS Setup
Make sure your backend allows requests from the frontend domain:
```javascript
// Example for Express.js
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-frontend-domain.com'],
  credentials: true
}));
```

## 📋 API Endpoints

### 1. Authentication Endpoints

#### POST `/api/auth/register`
**Description**: Register a new shop owner

**Request Body**:
```json
{
  "shopName": "My Amazing Shop",
  "address": "123 Main Street, Mumbai, Maharashtra",
  "phoneNumber": "+91 98765 43210",
  "email": "owner@shop.com",
  "password": "securepassword123"
}
```

**Success Response** (201):
```json
{
  "message": "Registration successful",
  "shopId": "shop_123"
}
```

**Error Response** (400):
```json
{
  "message": "Email already exists"
}
```

---

#### POST `/api/auth/login`
**Description**: Login shop owner

**Request Body**:
```json
{
  "email": "owner@shop.com",
  "password": "securepassword123"
}
```

**Success Response** (200):
```json
{
  "token": "jwt_token_here",
  "shopName": "My Amazing Shop",
  "shopId": "shop_123"
}
```

**Error Response** (401):
```json
{
  "message": "Invalid credentials"
}
```

---

### 2. Campaign Management

#### GET `/api/campaigns`
**Description**: Get all campaigns for the authenticated shop
**Headers**: `Authorization: Bearer <jwt_token>`

**Success Response** (200):
```json
[
  {
    "id": 1,
    "name": "Diwali Sale 2024",
    "theme": "Diwali Sale",
    "offer": "20% off on all items",
    "budget": 5000,
    "startDate": "2024-11-01",
    "endDate": "2024-11-15",
    "status": "active",
    "scans": 45,
    "redemptions": 12,
    "createdAt": "2024-10-28T10:00:00Z"
  }
]
```

---

#### POST `/api/campaigns/plan`
**Description**: Generate AI campaign suggestions
**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "theme": "Diwali Sale",
  "offer": "20% off on all items + Free gift wrapping",
  "budget": "5000",
  "startDate": "2024-11-01",
  "endDate": "2024-11-15",
  "targetAudience": "Families with children",
  "campaignType": "hybrid"
}
```

**Success Response** (200):
```json
{
  "suggestions": [
    {
      "id": 1,
      "channel": "WhatsApp Marketing",
      "description": "Share offers directly with customers",
      "content": "🎉 Diwali Sale is here! Get 20% off on all items + Free gift wrapping! 🎁\n\nValid till Nov 15th. Visit our store or scan QR code!\n\n#DiwaliSale #Offers",
      "type": "Digital",
      "estimatedReach": "500-1000 customers",
      "estimatedCost": 500
    },
    {
      "id": 2,
      "channel": "Facebook Posts",
      "description": "Social media marketing on Facebook",
      "content": "Celebrate Diwali with amazing discounts! 20% off + Free gift wrapping on all purchases. Limited time offer!",
      "type": "Digital",
      "estimatedReach": "200-800 customers",
      "estimatedCost": 1000
    },
    {
      "id": 3,
      "channel": "Print Flyers",
      "description": "Physical flyers for local distribution",
      "content": "Diwali Special Offer - 20% Off + Free Gift Wrapping",
      "type": "Offline",
      "estimatedReach": "1000-2000 customers",
      "estimatedCost": 1500
    }
  ]
}
```

---

#### POST `/api/campaigns/add-channel`
**Description**: Add a selected channel to campaign
**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "suggestionId": 1,
  "channel": "WhatsApp Marketing",
  "content": "Generated content here..."
}
```

**Success Response** (200):
```json
{
  "message": "Channel added successfully",
  "channelId": "channel_123"
}
```

---

#### POST `/api/campaigns/generate-assets`
**Description**: Generate QR codes, social media posts, and pamphlets
**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "campaignData": {
    "theme": "Diwali Sale",
    "offer": "20% off on all items + Free gift wrapping",
    "budget": "5000",
    "startDate": "2024-11-01",
    "endDate": "2024-11-15",
    "targetAudience": "Families",
    "campaignType": "hybrid"
  },
  "selectedChannels": [
    {
      "id": 1,
      "channel": "WhatsApp Marketing",
      "content": "Generated content..."
    },
    {
      "id": 2,
      "channel": "Facebook Posts",
      "content": "Generated content..."
    }
  ]
}
```

**Success Response** (200):
```json
{
  "assets": {
    "qrCodes": [
      {
        "id": 1,
        "name": "Main Campaign QR",
        "url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://yourdomain.com/track/campaign_123",
        "trackingUrl": "https://yourdomain.com/track/campaign_123",
        "scans": 0
      },
      {
        "id": 2,
        "name": "WhatsApp Share QR",
        "url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://yourdomain.com/track/whatsapp_123",
        "trackingUrl": "https://yourdomain.com/track/whatsapp_123",
        "scans": 0
      }
    ],
    "socialMediaPosts": [
      {
        "id": 1,
        "platform": "Facebook",
        "content": "🎉 Diwali Sale is here! 20% off on all items + Free gift wrapping! 🎁\n\nDon't miss out on this amazing deal! Visit our store or scan the QR code to claim your offer.\n\n#DiwaliSale #Sale #Offers",
        "hashtags": ["#DiwaliSale", "#Sale", "#Offers"],
        "imageUrl": "https://yourdomain.com/generated-images/facebook_post_123.jpg"
      },
      {
        "id": 2,
        "platform": "Instagram",
        "content": "✨ Diwali Sale ✨\n\n20% off + Free gift wrapping! 🎁\n\nSwipe up or scan our QR code! 📱\n\n#DiwaliSale #InstaSale #LimitedOffer",
        "hashtags": ["#DiwaliSale", "#InstaSale", "#LimitedOffer"],
        "imageUrl": "https://yourdomain.com/generated-images/instagram_post_123.jpg"
      },
      {
        "id": 3,
        "platform": "WhatsApp",
        "content": "🛍️ *Diwali Sale* 🛍️\n\n20% off + Free gift wrapping! 🎁\n\n📍 Visit our store today!\n💬 Share with friends and family\n\nValid till Nov 15th",
        "hashtags": [],
        "imageUrl": "https://yourdomain.com/generated-images/whatsapp_post_123.jpg"
      }
    ],
    "pamphlets": [
      {
        "id": 1,
        "name": "A4 Flyer Design",
        "description": "Professional A4 flyer with QR code and offer details",
        "downloadUrl": "https://yourdomain.com/downloads/flyer_123.pdf",
        "previewUrl": "https://yourdomain.com/previews/flyer_123.jpg",
        "format": "PDF"
      },
      {
        "id": 2,
        "name": "Business Card Insert",
        "description": "Small card design for counter display",
        "downloadUrl": "https://yourdomain.com/downloads/card_123.pdf",
        "previewUrl": "https://yourdomain.com/previews/card_123.jpg",
        "format": "PDF"
      }
    ]
  }
}
```

---

### 3. Tracking & Analytics

#### GET `/track/:trackerId`
**Description**: Track QR code scan and return offer details (Public endpoint - no auth required)

**URL Parameters**:
- `trackerId`: Unique tracking identifier

**Success Response** (200):
```json
{
  "shopName": "My Amazing Shop",
  "campaignName": "Diwali Special Offer",
  "offer": "20% off on all items + Free gift wrapping",
  "uniqueCode": "DIW-2024-A7B",
  "validUntil": "2024-11-15",
  "shopAddress": "123 Main Street, Mumbai, Maharashtra",
  "shopPhone": "+91 98765 43210",
  "terms": "Valid on minimum purchase of ₹500. Cannot be combined with other offers."
}
```

**Error Response** (404):
```json
{
  "message": "Invalid or expired tracking link"
}
```

---

#### POST `/api/redeem`
**Description**: Redeem customer code at shop
**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "code": "DIW-2024-A7B"
}
```

**Success Response** (200):
```json
{
  "message": "Code redeemed successfully!",
  "customerDetails": {
    "scannedAt": "2024-10-28T14:30:00Z",
    "campaign": "Diwali Sale"
  }
}
```

**Error Response** (400):
```json
{
  "message": "Invalid or already used code"
}
```

---

## 🔐 Authentication

### JWT Token Format
The frontend expects JWT tokens with this payload structure:
```json
{
  "shopId": "shop_123",
  "shopName": "My Amazing Shop",
  "email": "owner@shop.com",
  "iat": 1635724800,
  "exp": 1635811200
}
```

### Token Storage
- Frontend stores JWT in `localStorage.getItem('token')`
- Sent in Authorization header: `Bearer <token>`
- Auto-logout on 401 responses

---

## 🎯 QR Code Generation

### Recommended QR Code Service
Use a service like:
- **QR Server API**: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=<tracking_url>`
- **Custom QR Generator**: Implement your own QR code generation

### Tracking URL Format
```
https://yourdomain.com/track/<unique_campaign_id>
```

---

## 📱 File Upload/Download

### Image Generation
For social media posts, generate images with:
- Campaign theme and offer text
- Shop branding/logo
- QR code embedded
- Platform-specific dimensions:
  - Facebook: 1200x630px
  - Instagram: 1080x1080px
  - WhatsApp: 800x600px

### PDF Generation
For pamphlets, generate PDFs with:
- A4 size (595x842px) for flyers
- Business card size (350x200px) for inserts
- Include QR codes and offer details
- Professional design templates

---

## 🧪 Testing the Integration

### 1. Update Environment
```bash
# In your .env file
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:3000  # Your backend URL
```

### 2. Test Endpoints
Use tools like Postman or curl to test each endpoint before connecting the frontend.

### 3. Error Handling
The frontend handles these HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized (triggers auto-logout)
- `404`: Not Found
- `500`: Server Error

---

## 🚀 Quick Start for Backend Team

1. **Set up CORS** for frontend domain
2. **Implement authentication** endpoints first
3. **Add JWT middleware** for protected routes
4. **Create campaign endpoints** with mock data initially
5. **Add QR code generation** using external service
6. **Implement asset generation** with templates
7. **Test with frontend** by setting `VITE_USE_MOCK=false`

---

## 📞 Frontend Integration Points

The frontend will automatically:
- Send JWT tokens in headers
- Handle loading states during API calls
- Show error messages for failed requests
- Redirect to login on 401 errors
- Fall back to mock data if API fails (in development)

---

## 🎨 Asset Generation Tips

### Social Media Content
- Use AI services like OpenAI GPT for content generation
- Include relevant emojis and hashtags
- Customize content based on campaign theme and target audience

### QR Code Best Practices
- Generate unique tracking IDs for each campaign/channel
- Use short, memorable tracking URLs
- Include campaign metadata in tracking system

### PDF Generation
- Use libraries like Puppeteer, jsPDF, or PDFKit
- Create responsive templates that work for different content lengths
- Include shop branding and contact information

This documentation should give your backend team everything they need to connect seamlessly with the frontend! 🎉