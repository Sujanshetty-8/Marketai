import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SuggestionList from '../components/SuggestionList';

const CampaignSuggestionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [activeTab, setActiveTab] = useState('explanation'); // explanation, timeline, suggestions

  // Load state
  const campaignData = location.state?.campaignData ||
    (sessionStorage.getItem('campaignData') ? JSON.parse(sessionStorage.getItem('campaignData')) : {});
  const suggestions = location.state?.suggestions ||
    (sessionStorage.getItem('campaignSuggestions') ? JSON.parse(sessionStorage.getItem('campaignSuggestions')) : []);
  const explanation = sessionStorage.getItem('campaignExplanation') ? JSON.parse(sessionStorage.getItem('campaignExplanation')) : null;
  const timeline = sessionStorage.getItem('campaignTimeline') ? JSON.parse(sessionStorage.getItem('campaignTimeline')) : null;

  useEffect(() => {
    setIsVisible(true);

    if (!campaignData.theme) {
      console.warn('No campaign theme found, redirecting to new-campaign');
      navigate('/new-campaign');
    }
  }, [campaignData, navigate]);

  const handleChannelAdded = (channelData) => {
    // Add unique channels to selected state
    setSelectedChannels(prev => {
      const exists = prev.some(c => c.channel === channelData.channel);
      if (exists) return prev;
      return [...prev, channelData];
    });
  };

  const handleContinue = () => {
    if (selectedChannels.length === 0) {
      alert('Please select at least one channel to generate tracking assets.');
      return;
    }

    sessionStorage.setItem('selectedChannels', JSON.stringify(selectedChannels));

    navigate('/campaign-assets', {
      state: {
        campaignData,
        selectedChannels,
        suggestions
      }
    });
  };

  const handleBackToCampaign = () => {
    navigate('/new-campaign');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50 text-gray-900 font-sans flex flex-col relative overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 left-10 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute -bottom-8 right-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: "4s" }}></div>
      </div>

      <Navbar />

      <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Header Section */}
        <div className={`transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Campaign Strategy Board
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Review your customized AI marketing proposal and select active channels.
              </p>
            </div>
            
            {/* Steps tracker */}
            <div className="flex items-center space-x-2 bg-white/80 border border-gray-200 px-4 py-2 rounded-full text-xs font-semibold text-gray-600 shadow-sm h-fit">
              <span className="text-emerald-600 font-bold">✓ Chat Profiler</span>
              <span className="text-gray-300">→</span>
              <span className="text-indigo-600 font-bold">2. Strategy suggestions</span>
              <span className="text-gray-300">→</span>
              <span className="text-gray-400">3. QR tracking assets</span>
            </div>
          </div>
        </div>

        {/* Campaign Metrics & Info Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Campaign Objective', val: campaignData.theme, icon: '🎯' },
            { label: 'Budget allocated', val: `₹${campaignData.budget}`, icon: '💰' },
            { label: 'Category Focus', val: campaignData.businessType || 'Retail', icon: '🏪' },
            { label: 'Region / Location', val: campaignData.location || 'India', icon: '📍' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/80 backdrop-blur-sm border border-gray-150 rounded-2xl p-4 flex items-center space-x-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg">
                {stat.icon}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs text-gray-500 font-semibold">{stat.label}</span>
                <p className="text-sm font-semibold truncate text-gray-800">{stat.val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard Tabs for Strategy Details */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'explanation', label: 'AI Strategy Explanation', icon: '🛡️' },
            { id: 'timeline', label: '30-Day Campaign Checklist', icon: '📅' },
            { id: 'suggestions', label: 'Channel Copy Suggestions', icon: '✨' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-6 text-sm font-medium border-b-2 transition-all duration-300 ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1 Content: AI Strategy Explanation */}
        {activeTab === 'explanation' && explanation && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/80 backdrop-blur-sm border border-gray-150 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  💡 Why this recommendation?
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {explanation.why_this_recommendation}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-sm border border-gray-150 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-emerald-600 mb-3 flex items-center">
                    👍 Core Advantages
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {explanation.advantages}
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-150 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-rose-600 mb-3 flex items-center">
                    ⚠️ Potential Risks
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {explanation.possible_risks}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-md rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                  AI Confidence Score
                </h3>
                <div className="relative flex items-center justify-center h-32 w-32 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent border-r-transparent animate-spin-slow"></div>
                  <span className="text-3xl font-extrabold text-indigo-700">
                    {explanation.confidence_score}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Calculated based on hyper-local trends, location competitors, and RAG guidelines.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm border border-gray-150 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-2">
                  📈 Expected Conversion
                </h3>
                <p className="text-sm text-gray-600">
                  {explanation.expected_outcome || '3-5% customer footfall increase.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 Content: 30-Day Timeline */}
        {activeTab === 'timeline' && timeline && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Weekly Milestones */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-150 rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                🗓️ Weekly Milestones
              </h3>
              <div className="space-y-3">
                {timeline.weekly && timeline.weekly.map((task, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
                    <span className="text-indigo-600 font-bold text-xs bg-indigo-50 px-2.5 py-1 rounded-full h-fit">
                      W{idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 leading-relaxed">{task}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Routine Tasks */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-150 rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                📋 Daily Action Tasks
              </h3>
              <div className="space-y-3">
                {timeline.daily && timeline.daily.map((task, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
                    <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full h-fit">
                      Day
                    </span>
                    <span className="text-sm text-gray-700 leading-relaxed">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3 Content: Suggestions & Selection */}
        {activeTab === 'suggestions' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-150 rounded-3xl p-6 shadow-sm">
              <SuggestionList
                suggestions={suggestions}
                onChannelAdded={handleChannelAdded}
              />
            </div>

            {selectedChannels.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-indigo-900 mb-3 flex items-center">
                  💡 Selected Channels ({selectedChannels.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedChannels.map((channel, index) => (
                    <div key={index} className="bg-white border border-indigo-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                      <div>
                        <h4 className="font-semibold text-indigo-700">{channel.channel}</h4>
                        <span className="text-xs text-gray-500">QR Code tracking enabled</span>
                      </div>
                      <span className="text-emerald-600 text-lg font-bold">✓</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Panel Footer */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleBackToCampaign}
            className="px-6 py-4 border border-gray-300 hover:bg-gray-50 rounded-2xl text-sm font-semibold transition-all duration-300 text-gray-700 bg-white shadow-sm"
          >
            ← Restart Chat Consultation
          </button>

          <button
            onClick={handleContinue}
            disabled={selectedChannels.length === 0}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center shadow-md shadow-indigo-200"
          >
            Generate Tracking QR Codes →
          </button>
        </div>

      </div>
    </div>
  );
};

export default CampaignSuggestionsPage;