import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const CampaignList = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/api/campaigns');
      setCampaigns(response.data);
    } catch (err) {
      setError('Failed to fetch campaigns');
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Your Campaigns</h2>
      </div>
      <div className="p-6">
        {campaigns.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No campaigns yet. Create your first campaign to get started!
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <div 
                key={campaign.id} 
                onClick={() => navigate(`/campaign-analytics/${campaign.id || campaign._id}`)}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 bg-white hover:bg-blue-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                  <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Scans:</span>
                    <span className="font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs">
                      {campaign.scans || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Redemptions:</span>
                    <span className="font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">
                      {campaign.redemptions || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Status:</span>
                    <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                      campaign.status === 'active' 
                        ? 'text-green-600 bg-green-100' 
                        : 'text-gray-500 bg-gray-100'
                    }`}>
                      {campaign.status || 'Draft'}
                    </span>
                  </div>
                </div>
                
                {/* Conversion Rate */}
                {campaign.scans > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Conversion Rate:</span>
                      <span className="font-medium text-purple-600 text-sm">
                        {((campaign.redemptions || 0) / campaign.scans * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Click indicator */}
                <div className="mt-3 text-center">
                  <span className="text-xs text-blue-600 opacity-70 hover:opacity-100 transition-opacity duration-300">
                    Click to view detailed analytics →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignList;