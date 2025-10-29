# Campaign AI Frontend

A React frontend application for Campaign AI - helping small Indian businesses plan and track marketing campaigns using AI.

## Features

- **Authentication**: Register and login for shop owners
- **Campaign Management**: Create AI-generated campaign plans
- **QR Code Tracking**: Automatically generate trackable QR codes and links
- **Analytics**: Track scans, redemptions, and ROI
- **Dashboard**: Simple dashboard to manage campaign data
- **Customer Landing**: Public pages for customer offer redemption

## Tech Stack

- **React 18** with Vite
- **React Router DOM** for routing
- **Axios** for API calls
- **Tailwind CSS** for styling
- **JWT** authentication with localStorage

## Project Structure

```
src/
├── pages/
│   ├── RegisterPage.jsx      # Shop owner registration
│   ├── LoginPage.jsx         # Authentication
│   ├── DashboardPage.jsx     # Main dashboard
│   ├── NewCampaignPage.jsx   # Campaign creation
│   └── CustomerLandingPage.jsx # Public offer pages
├── components/
│   ├── Navbar.jsx            # Navigation bar
│   ├── PrivateRoute.jsx      # Route protection
│   ├── CampaignList.jsx      # Campaign display
│   ├── SuggestionList.jsx    # AI suggestions
│   └── RedemptionComponent.jsx # Code redemption
├── api/
│   └── axiosConfig.js        # API configuration
├── App.jsx                   # Main app with routing
└── main.jsx                  # Entry point
```

## Setup Instructions

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Environment setup**:

   ```bash
   cp .env.example .env
   ```

   Update `VITE_API_BASE_URL` with your backend URL.

3. **Start development server**:

   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## API Endpoints Expected

The frontend expects these backend endpoints:

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Campaigns

- `GET /api/campaigns` - List user campaigns
- `POST /api/campaigns/plan` - Generate AI campaign plan
- `POST /api/campaigns/add-channel` - Add campaign channel

### Tracking & Redemption

- `GET /track/:trackerId` - Get tracking data and log scan
- `POST /api/redeem` - Redeem customer code

## 🔗 Backend Integration

### Quick Start for Backend Team

1. **Read the documentation**:
   - `API_DOCUMENTATION.md` - Complete API specifications
   - `BACKEND_INTEGRATION_GUIDE.md` - Step-by-step integration guide

2. **Test with mock server**:
   ```bash
   # Copy the test server files
   cp backend-package.json package.json
   npm install
   node backend-test-server.js
   ```

3. **Connect frontend to your backend**:
   ```bash
   # Update .env
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=http://localhost:3000
   
   # Restart frontend
   npm run dev
   ```

### Environment Configuration

The frontend supports multiple environments:

**Development (Mock Mode)**:
```bash
VITE_USE_MOCK=true
VITE_API_BASE_URL=http://localhost:3000
```

**Production (Real Backend)**:
```bash
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://your-api-domain.com
```

## Key Features

### Authentication Flow

- Registration with shop details (name, address, phone, email, password)
- JWT token storage in localStorage
- Automatic redirect to dashboard on successful login
- Protected routes with automatic logout on token expiration

### Campaign Creation

- Form-based campaign setup (theme, offer, budget, dates)
- AI-powered campaign suggestions
- Channel addition with QR code generation
- Real-time loading states and error handling

### Dashboard

- Campaign overview with scan/redemption counts
- Quick campaign creation access
- Code redemption interface for shop owners

### Customer Experience

- Clean, mobile-friendly landing pages
- Automatic scan tracking
- Unique redemption codes
- Shop information display

## Responsive Design

Built with Tailwind CSS for:

- Mobile-first responsive design
- Clean, modern UI components
- Consistent color scheme and spacing
- Accessible form controls and buttons

## Development Notes

- Uses React 18 with modern hooks
- Axios interceptors for automatic token handling
- Error boundaries and loading states
- Clean component separation
- Production-ready code structure
