import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NewCampaignPage from './pages/NewCampaignPage';
import CampaignSuggestionsPage from './pages/CampaignSuggestionsPage';
import CampaignAssetsPage from './pages/CampaignAssetsPage';
import CustomerLandingPage from './pages/CustomerLandingPage';
import DynamicLandingPage from './pages/DynamicLandingPage';
import CampaignAnalyticsPage from './pages/CampaignAnalyticsPage';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/track/:campaignName" element={<DynamicLandingPage />} />
        <Route path="/track/legacy/:trackerId" element={<CustomerLandingPage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/new-campaign" 
          element={
            <PrivateRoute>
              <NewCampaignPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/campaign-suggestions" 
          element={
            <PrivateRoute>
              <CampaignSuggestionsPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/campaign-assets" 
          element={
            <PrivateRoute>
              <CampaignAssetsPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/campaign-analytics/:campaignId" 
          element={
            <PrivateRoute>
              <CampaignAnalyticsPage />
            </PrivateRoute>
          } 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;