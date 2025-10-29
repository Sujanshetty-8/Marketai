import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !import.meta.env.VITE_API_BASE_URL;

// Mock API responses for development
const mockResponses = {
  '/api/auth/register': () => ({ data: { message: 'Registration successful' } }),
  '/api/auth/login': () => ({
    data: {
      token: 'mock-jwt-token-12345',
      shopName: 'Demo Shop'
    }
  }),
  '/api/campaigns': () => ({
    data: [
      { id: 1, name: 'Diwali Sale', scans: 45, redemptions: 12, status: 'active' },
      { id: 2, name: 'Summer Collection', scans: 23, redemptions: 8, status: 'draft' }
    ]
  }),
  '/api/campaigns/plan': () => ({
    data: {
      suggestions: [
        {
          id: 1,
          channel: 'WhatsApp Marketing',
          description: 'Share offers directly with customers',
          content: 'Special Diwali offer! Get 20% off on all items. Limited time only!',
          type: 'Digital',
          estimatedReach: '500-1000 customers'
        },
        {
          id: 2,
          channel: 'Social Media Posts',
          description: 'Facebook and Instagram posts',
          content: 'Celebrate Diwali with amazing discounts at our store!',
          type: 'Digital',
          estimatedReach: '200-500 customers'
        }
      ]
    }
  }),
  '/api/campaigns/add-channel': (config) => {
    const requestData = JSON.parse(config.data || '{}');
    return {
      data: {
        message: 'Channel added successfully',
        channel: requestData.channel || 'Facebook Local Ads',
        qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mock-url',
        trackingUrl: 'http://localhost:5173/track/mock-tracker-123',
        trackingId: 'mock-123',
        suggestionId: requestData.suggestionId
      }
    };
  },
  '/api/redeem': () => ({ data: { message: 'Code redeemed successfully!' } }),
  '/api/campaigns/generate-assets': (data) => ({
    data: {
      assets: {
        qrCodes: [
          {
            id: 1,
            name: 'Main Campaign QR',
            url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://campaignai.com/track/main-campaign-123',
            trackingUrl: 'http://localhost:5173/track/demo',
            scans: 0
          },
          {
            id: 2,
            name: 'WhatsApp Share QR',
            url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://campaignai.com/track/whatsapp-123',
            trackingUrl: 'http://localhost:5173/track/demo',
            scans: 0
          }
        ],
        socialMediaPosts: [
          {
            id: 1,
            platform: 'Facebook',
            content: `🎉 Special Campaign is here! Amazing offers await!\n\nDon't miss out on this amazing deal! Visit our store or scan the QR code to claim your offer.\n\n#Sale #Offers #SpecialCampaign`,
            hashtags: ['#Sale', '#Offers', '#SpecialCampaign'],
            imageUrl: 'https://via.placeholder.com/1200x630/3B82F6/FFFFFF?text=Facebook+Post'
          },
          {
            id: 2,
            platform: 'Instagram',
            content: `✨ Special Campaign ✨\n\nAmazing offers await!\n\nSwipe up or scan our QR code! 📱\n\n#SpecialCampaign #InstaSale #LimitedOffer`,
            hashtags: ['#InstaSale', '#LimitedOffer', '#SpecialCampaign'],
            imageUrl: 'https://via.placeholder.com/1080x1080/8B5CF6/FFFFFF?text=Instagram+Post'
          },
          {
            id: 3,
            platform: 'WhatsApp',
            content: `🛍️ *Special Campaign* 🛍️\n\nAmazing offers await!\n\n📍 Visit our store today!\n💬 Share with friends and family\n\nLimited time offer!`,
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
      }
    }
  }),
  '/api/analytics/dashboard': () => ({
    data: {
      summary: {
        totalCampaigns: 3,
        totalVisits: 45,
        totalConversions: 12,
        overallConversionRate: 26.7,
        activeChannels: 8
      },
      campaignPerformance: [
        { id: 1, name: 'Diwali Sale', visits: 25, conversions: 8, conversionRate: 32.0, channels: 3, status: 'active' },
        { id: 2, name: 'Summer Collection', visits: 15, conversions: 3, conversionRate: 20.0, channels: 2, status: 'active' },
        { id: 3, name: 'Mega Sale', visits: 5, conversions: 1, conversionRate: 20.0, channels: 3, status: 'draft' }
      ],
      channelTypePerformance: [
        { type: 'social', visits: 25, conversions: 7, channels: 4, conversionRate: 28.0 },
        { type: 'print', visits: 15, conversions: 4, channels: 2, conversionRate: 26.7 },
        { type: 'messaging', visits: 5, conversions: 1, channels: 2, conversionRate: 20.0 }
      ],
      recentActivity: 15
    }
  }),
  '/api/analytics/sync-data': () => ({
    data: {
      message: 'Data synchronized successfully',
      syncedTrackers: 2,
      totalTrackers: 4
    }
  })
};

// Handle DELETE requests in the response interceptor
const handleDeleteRequest = (url) => {
  if (url?.includes('/api/analytics/cleanup/')) {
    return {
      data: {
        message: 'Cleanup completed successfully',
        removedTrackers: 3,
        remainingTrackers: 1
      }
    };
  }
  return null;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses with mock data if needed
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If using mock mode or connection failed, return mock data
    if (USE_MOCK || error.code === 'ERR_NETWORK') {
      const url = error.config?.url;
      const method = error.config?.method?.toUpperCase();

      console.log(`🔧 Mock API: ${method} ${url}`);

      if (mockResponses[url]) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return Promise.resolve(mockResponses[url]());
      }

      // Handle DELETE requests
      if (error.config?.method?.toUpperCase() === 'DELETE') {
        const deleteResponse = handleDeleteRequest(url);
        if (deleteResponse) {
          await new Promise(resolve => setTimeout(resolve, 500));
          return Promise.resolve(deleteResponse);
        }
      }

      // Handle tracking URLs
      if (url?.startsWith('/track/')) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return Promise.resolve({
          data: {
            shopName: 'Demo Shop',
            campaignName: 'Diwali Special Offer',
            offer: '20% off on all items + Free gift wrapping',
            uniqueCode: 'DIW-2024',
            validUntil: '2024-11-15',
            shopAddress: '123 Main Street, Mumbai, Maharashtra',
            shopPhone: '+91 98765 43210',
            terms: 'Valid on minimum purchase of ₹500. Cannot be combined with other offers.'
          }
        });
      }

      // Handle analytics URLs
      if (url?.startsWith('/api/analytics/campaign/')) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return Promise.resolve({
          data: {
            campaign: {
              id: '1',
              name: 'Diwali Sale',
              startDate: '2024-10-15',
              endDate: '2024-11-15',
              status: 'active'
            },
            summary: {
              totalVisits: 45,
              totalConversions: 12,
              overallConversionRate: 26.7,
              activeChannels: 4
            },
            channelPerformance: [
              {
                channelName: 'instagram',
                channelType: 'social',
                visits: 18,
                conversions: 6,
                conversionRate: 33.3,
                trackingUrl: 'http://localhost:5173/track/diwali-sale?channel=instagram',
                qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:3000/track/diwali-sale?channel=instagram'
              },
              {
                channelName: 'whatsapp',
                channelType: 'messaging',
                visits: 12,
                conversions: 4,
                conversionRate: 33.3,
                trackingUrl: 'http://localhost:5173/track/diwali-sale?channel=whatsapp',
                qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:3000/track/diwali-sale?channel=whatsapp'
              },
              {
                channelName: 'pamphlet',
                channelType: 'print',
                visits: 10,
                conversions: 2,
                conversionRate: 20.0,
                trackingUrl: 'http://localhost:5173/track/diwali-sale?channel=pamphlet',
                qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:3000/track/diwali-sale?channel=pamphlet'
              },
              {
                channelName: 'facebook',
                channelType: 'social',
                visits: 5,
                conversions: 0,
                conversionRate: 0,
                trackingUrl: 'http://localhost:5173/track/diwali-sale?channel=facebook',
                qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:3000/track/diwali-sale?channel=facebook'
              }
            ],
            topChannels: [
              { channelName: 'instagram', conversions: 6 },
              { channelName: 'whatsapp', conversions: 4 },
              { channelName: 'pamphlet', conversions: 2 }
            ],
            dailyStats: [
              { date: '2024-10-23', visits: 8, conversions: 2 },
              { date: '2024-10-24', visits: 6, conversions: 1 },
              { date: '2024-10-25', visits: 7, conversions: 3 },
              { date: '2024-10-26', visits: 5, conversions: 1 },
              { date: '2024-10-27', visits: 9, conversions: 2 },
              { date: '2024-10-28', visits: 6, conversions: 2 },
              { date: '2024-10-29', visits: 4, conversions: 1 }
            ],
            recentRedemptions: [
              { code: 'INST789', channel: 'instagram', redeemedAt: '2024-10-29T10:30:00Z', createdAt: '2024-10-29T09:15:00Z' },
              { code: 'WHAP456', channel: 'whatsapp', redeemedAt: '2024-10-29T08:45:00Z', createdAt: '2024-10-29T08:20:00Z' },
              { code: 'PAMP123', channel: 'pamphlet', redeemedAt: '2024-10-28T16:20:00Z', createdAt: '2024-10-28T14:10:00Z' },
              { code: 'INST654', channel: 'instagram', redeemedAt: '2024-10-28T14:15:00Z', createdAt: '2024-10-28T13:45:00Z' }
            ]
          }
        });
      }
    }

    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('shopName');
      window.location.href = '/login';
    }

    // Log the actual error for debugging
    console.error('API Error:', error.response?.data || error.message);

    return Promise.reject(error);
  }
);

export default api;