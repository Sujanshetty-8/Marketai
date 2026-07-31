// index.js (or wherever you start your app)
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3000;
// index.js
require('dotenv').config(); // This loads the .env file
const express = require('express');
const cors = require('cors');
const app = express();

// Replace this with your own database connection string
// If local: 'mongodb://127.0.0.1:27017/campaignSparkDB'
// If Atlas: Get the string from your Atlas dashboard
const DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campaigndb';

async function connectToDB() {
  try {
    await mongoose.connect(DB_URI);
    console.log('Successfully connected to MongoDB!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit if we can't connect
  }
}

connectToDB();

// --- 3. Middleware ---
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    const isLocalhost = origin.startsWith('http://localhost:');
    const isVercel = origin.endsWith('.vercel.app');
    
    if (isLocalhost || isVercel) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// --- 4. Define a Basic Route ---
app.get('/', (req, res) => {
  res.send('Hello, CampaignSpark API is running!');
});

// --- 5. DEFINE YOUR API ROUTES ---
const authRoutes = require('./routes/auth.js');
app.use('/api/auth', authRoutes);

const campaignRoutes = require('./routes/camp_route.js');
app.use('/api/campaigns', campaignRoutes); // Plug in the campaign routes

const trackRoutes = require('./routes/track_routes.js');
app.use('/track', trackRoutes);

const redeemRoutes = require('./routes/redeem_routes.js');
app.use('/api/redeem', redeemRoutes); // Plug in the redeem route

const statsRoutes = require('./routes/stats_route.js');
app.use('/api/stats', statsRoutes); // Plug in the stats route

const analyticsRoutes = require('./routes/analytics_routes.js');
app.use('/api/analytics', analyticsRoutes); // Plug in the analytics route

const profileRoutes = require('./routes/profile_routes.js');
app.use('/api/business-profile', profileRoutes); // Plug in the business profile route

const aiRoutes = require('./routes/ai_routes.js');
app.use('/api/ai', aiRoutes); // Plug in the AI agent routes


// --- 6. Start the Server ---
// ... (same as before, just becomes step 6)
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});