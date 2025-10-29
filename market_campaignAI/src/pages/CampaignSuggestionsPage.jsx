import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SuggestionList from '../components/SuggestionList';

const CampaignSuggestionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState([]);

  // Get campaign data and suggestions from navigation state or sessionStorage
  const campaignData = location.state?.campaignData ||
    (sessionStorage.getItem('campaignData') ? JSON.parse(sessionStorage.getItem('campaignData')) : {});
  const suggestions = location.state?.suggestions ||
    (sessionStorage.getItem('campaignSuggestions') ? JSON.parse(sessionStorage.getItem('campaignSuggestions')) : []);

  useEffect(() => {
    setIsVisible(true);

    // Debug: Log what we received
    console.log('CampaignSuggestionsPage - Campaign Data:', campaignData);
    console.log('CampaignSuggestionsPage - Suggestions:', suggestions);
    console.log('CampaignSuggestionsPage - Suggestions length:', suggestions.length);

    // If no data, redirect back to new campaign
    if (!campaignData.theme) {
      console.warn('No campaign theme found, redirecting to new-campaign');
      navigate('/new-campaign');
    } else if (suggestions.length === 0) {
      console.warn('No suggestions found, but staying on page to debug');
      // Don't redirect immediately, let's see what's happening
    }
  }, [campaignData, suggestions, navigate]);

  const handleChannelAdded = (channelData) => {
    setSelectedChannels(prev => [...prev, channelData]);
  };

  const handleContinue = () => {
    if (selectedChannels.length === 0) {
      alert('Please select at least one channel to continue');
      return;
    }

    // Store data in sessionStorage for persistence
    sessionStorage.setItem('campaignSuggestions', JSON.stringify(suggestions));
    sessionStorage.setItem('campaignData', JSON.stringify(campaignData));
    sessionStorage.setItem('selectedChannels', JSON.stringify(selectedChannels));

    navigate('/campaign-assets', {
      state: {
        campaignData,
        selectedChannels,
        suggestions // Pass suggestions to assets page
      }
    });
  };

  const handleBackToCampaign = () => {
    navigate('/new-campaign', {
      state: { campaignData }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleBackToCampaign}
                className="flex items-center text-blue-600 hover:text-blue-800 group transition-colors duration-300"
              >
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Campaign Details
              </button>

              {/* Progress Indicator */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    ✓
                  </div>
                  <span className="ml-2 text-sm font-medium text-green-600">Details</span>
                </div>
                <div className="w-8 h-0.5 bg-green-500"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium text-blue-600">Suggestions</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-500">Assets</span>
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              AI Campaign Suggestions
            </h1>
            <p className="text-xl text-gray-600">
              Our AI has analyzed your campaign details and created personalized marketing suggestions
            </p>
          </div>

          {/* Campaign Summary */}
          <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white text-lg">📋</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Campaign Summary</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Theme:</span>
                  <p className="text-gray-600">{campaignData.theme}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Budget:</span>
                  <p className="text-gray-600">₹{campaignData.budget}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Type:</span>
                  <p className="text-gray-600 capitalize">{campaignData.campaignType}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
            <SuggestionList
              suggestions={suggestions}
              onChannelAdded={handleChannelAdded}
            />
          </div>

          {/* Selected Channels Summary */}
          {selectedChannels.length > 0 && (
            <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '600ms' }}>
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-white text-lg">✅</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Selected Channels ({selectedChannels.length})</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedChannels.map((channel, index) => (
                    <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 border border-green-200">
                      <h3 className="font-semibold text-gray-900">{channel.channel || `Channel ${index + 1}`}</h3>
                      <p className="text-sm text-gray-600 mt-1">Ready for asset generation</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-between transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '800ms' }}>
            <button
              onClick={handleBackToCampaign}
              className="flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Edit Campaign Details
            </button>

            <button
              onClick={handleContinue}
              disabled={selectedChannels.length === 0}
              className="group flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:transform-none"
            >
              Continue to Assets
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          {/* Help Text */}
          {selectedChannels.length === 0 && (
            <div className={`mt-6 text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '1000ms' }}>
              <p className="text-gray-500 text-sm">
                💡 Select at least one channel above to continue to the next step
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignSuggestionsPage;