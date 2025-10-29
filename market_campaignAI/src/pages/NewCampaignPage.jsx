import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axiosConfig';

const NewCampaignPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    theme: '',
    offer: '',
    budget: '',
    startDate: '',
    endDate: '',
    targetAudience: '',
    campaignType: 'online',
    businessType: '',
    location: '',
    goalDescription: '',
    channelPreference: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // If coming back from suggestions page, populate form data
    if (location.state?.campaignData) {
      setFormData(location.state.campaignData);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.theme || !formData.offer || !formData.budget || !formData.businessType || !formData.location) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      // Call the real AI backend for campaign plan generation
      const aiResponse = await fetch('https://lennon-untilling-lorenzo.ngrok-free.dev/generate_plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: formData.theme,
          offer: formData.offer,
          budget: parseInt(formData.budget) || 0,
          campaignType: formData.campaignType,
          targetAudience: formData.targetAudience,
          startDate: formData.startDate,
          endDate: formData.endDate,
          business_type: formData.businessType || 'retail',
          location: formData.location || 'India',
          goal_description: formData.goalDescription || `${formData.theme} campaign to ${formData.offer}`,
          channel_preference: formData.channelPreference || 'AI Recommend',
          user_id: localStorage.getItem('shopName') || 'demo_user'
        })
      });

      if (!aiResponse.ok) {
        throw new Error('AI service unavailable');
      }

      const aiData = await aiResponse.json();

      // Debug: Log the AI response to see what we're getting
      console.log('AI Response:', aiData);

      // Transform AI response to match frontend expectations
      let suggestions = [];

      // Handle the actual AI response structure with campaign_overview and channel_recommendations
      if (aiData.channel_recommendations && Array.isArray(aiData.channel_recommendations)) {
        suggestions = aiData.channel_recommendations.map((item, index) => ({
          id: index + 1,
          channel: item.channel_name || `Channel ${index + 1}`,
          description: item.target_audience_specifics?.details ||
            `AI-recommended ${item.channel_name} for your ${formData.businessType} business`,
          content: item.content?.suggested_copy ||
            `${formData.theme}: ${formData.offer}`,
          type: item.channel_name?.includes('WhatsApp') || item.channel_name?.includes('Social') ? 'Digital' :
            item.channel_name?.includes('Flyer') || item.channel_name?.includes('Local') ? 'Physical' : 'Digital',
          estimatedReach: `Budget: ₹${item.allocated_budget || 'AI-optimized'}`,
          budget: item.allocated_budget,
          callToAction: item.content?.call_to_action,
          visualPrompt: item.content?.visual_prompt,
          trackingType: item.tracking_info?.type
        }));

        // Add campaign overview information if available
        if (aiData.campaign_overview) {
          const overview = aiData.campaign_overview;
          // Store additional campaign insights for potential use
          sessionStorage.setItem('campaignOverview', JSON.stringify({
            suggestedTheme: overview.suggested_theme_name,
            strategicAngle: overview.strategic_angle,
            targetAudience: overview.primary_target_audience,
            timing: overview.timing_recommendation,
            competitor: overview.competitor_note
          }));
        }
      } else if (aiData.marketing_plan && Array.isArray(aiData.marketing_plan)) {
        // Fallback for different AI response format
        suggestions = aiData.marketing_plan.map((item, index) => ({
          id: index + 1,
          channel: item.channel || item.name || `Channel ${index + 1}`,
          description: item.description || item.details || 'AI-generated marketing channel',
          content: item.content || item.message || `${formData.theme}: ${formData.offer}`,
          type: item.type || 'Digital',
          estimatedReach: item.reach || item.estimated_reach || 'AI-estimated reach'
        }));
      } else if (aiData.suggestions && Array.isArray(aiData.suggestions)) {
        // Another fallback format
        suggestions = aiData.suggestions.map((item, index) => ({
          id: index + 1,
          channel: item.channel || item.name || `Channel ${index + 1}`,
          description: item.description || 'AI-generated suggestion',
          content: item.content || `${formData.theme}: ${formData.offer}`,
          type: item.type || 'Digital',
          estimatedReach: item.estimatedReach || 'AI-estimated reach'
        }));
      } else {
        // Create fallback suggestions if AI format is completely unexpected
        console.warn('Unexpected AI response format, creating structured suggestions:', aiData);
        suggestions = [
          {
            id: 1,
            channel: 'WhatsApp Marketing',
            description: `AI-recommended WhatsApp campaign for ${formData.businessType} business`,
            content: `🎉 ${formData.theme} is here! ${formData.offer}. Visit us at ${formData.location}!`,
            type: 'Digital',
            estimatedReach: '500-1000 customers'
          },
          {
            id: 2,
            channel: 'Social Media Campaign',
            description: `AI-optimized social media strategy for ${formData.targetAudience}`,
            content: `✨ ${formData.theme} ✨\n\n${formData.offer}\n\nLimited time offer in ${formData.location}!`,
            type: 'Digital',
            estimatedReach: '200-800 customers'
          }
        ];
      }

      console.log('Processed suggestions:', suggestions);

      // Save campaign to database after getting AI suggestions
      try {
        const campaignResponse = await api.post('/api/campaigns', {
          theme: formData.theme,
          offer: formData.offer,
          campaignType: formData.campaignType,
          budget: parseInt(formData.budget) || 0,
          startDate: formData.startDate,
          endDate: formData.endDate,
          targetAudience: formData.targetAudience
        });

        const savedCampaign = campaignResponse.data;
        console.log('Campaign saved to database:', savedCampaign);

        // Store campaign ID for later use
        const campaignDataWithId = {
          ...formData,
          campaignId: savedCampaign._id || savedCampaign.id
        };

        // Store suggestions and campaign data in sessionStorage for persistence
        sessionStorage.setItem('campaignSuggestions', JSON.stringify(suggestions));
        sessionStorage.setItem('campaignData', JSON.stringify(campaignDataWithId));

        // Navigate to suggestions page with data
        navigate('/campaign-suggestions', {
          state: {
            campaignData: campaignDataWithId,
            suggestions: suggestions,
            savedCampaign: savedCampaign
          }
        });

      } catch (campaignSaveError) {
        console.error('Failed to save campaign to database:', campaignSaveError);
        // Still proceed with suggestions even if campaign save fails
        sessionStorage.setItem('campaignSuggestions', JSON.stringify(suggestions));
        sessionStorage.setItem('campaignData', JSON.stringify(formData));

        navigate('/campaign-suggestions', {
          state: {
            campaignData: formData,
            suggestions: suggestions
          }
        });
      }
    } catch (err) {
      console.error('AI API Error:', err);

      // Fallback to local mock API if AI service fails
      try {
        const response = await api.post('/api/campaigns/plan', formData);
        const suggestions = response.data.suggestions || [];

        // Also save campaign to database in fallback
        try {
          const campaignResponse = await api.post('/api/campaigns', {
            theme: formData.theme,
            offer: formData.offer,
            campaignType: formData.campaignType,
            budget: parseInt(formData.budget) || 0,
            startDate: formData.startDate,
            endDate: formData.endDate,
            targetAudience: formData.targetAudience
          });

          const savedCampaign = campaignResponse.data;
          const campaignDataWithId = {
            ...formData,
            campaignId: savedCampaign._id || savedCampaign.id
          };

          navigate('/campaign-suggestions', {
            state: {
              campaignData: campaignDataWithId,
              suggestions: suggestions,
              savedCampaign: savedCampaign
            }
          });
        } catch (campaignSaveError) {
          console.error('Failed to save campaign in fallback:', campaignSaveError);
          navigate('/campaign-suggestions', {
            state: {
              campaignData: formData,
              suggestions: suggestions
            }
          });
        }
      } catch (fallbackErr) {
        setError('Failed to generate campaign plan. Please try again.');
        setLoading(false);
      }
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 left-10 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 right-20 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-6 group transition-colors duration-300"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              Create New Campaign
            </h1>
            <p className="text-xl text-gray-600">
              Let our AI help you plan the perfect marketing campaign for your business
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Campaign Form */}
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/20">
                <div className="px-8 py-6 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                      <span className="text-white text-lg">🎯</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Campaign Details</h2>
                  </div>
                </div>
                <div className="p-8">
                  <form onSubmit={handleGeneratePlan} className="space-y-6">
                    <div>
                      <label htmlFor="theme" className="block text-sm font-semibold text-gray-700 mb-2">
                        Campaign Theme <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="theme"
                          name="theme"
                          required
                          value={formData.theme}
                          onChange={handleChange}
                          placeholder="e.g., Diwali Sale, Summer Collection"
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <span className="text-gray-400">🎨</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="offer" className="block text-sm font-semibold text-gray-700 mb-2">
                        Offer Details <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <textarea
                          id="offer"
                          name="offer"
                          required
                          rows={3}
                          value={formData.offer}
                          onChange={handleChange}
                          placeholder="e.g., 20% off on all items, Buy 2 Get 1 Free"
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm resize-none"
                        />
                        <div className="absolute top-3 right-0 pr-3 flex items-center">
                          <span className="text-gray-400">🎁</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="budget" className="block text-sm font-semibold text-gray-700 mb-2">
                        Budget (₹) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="budget"
                          name="budget"
                          required
                          value={formData.budget}
                          onChange={handleChange}
                          placeholder="5000"
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <span className="text-gray-400">💰</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          required
                          value={formData.startDate}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          name="endDate"
                          required
                          value={formData.endDate}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="targetAudience" className="block text-sm font-semibold text-gray-700 mb-2">
                        Target Audience
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="targetAudience"
                          name="targetAudience"
                          value={formData.targetAudience}
                          onChange={handleChange}
                          placeholder="e.g., Young professionals, Families"
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <span className="text-gray-400">👥</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="campaignType" className="block text-sm font-semibold text-gray-700 mb-2">
                        Campaign Type
                      </label>
                      <div className="relative">
                        <select
                          id="campaignType"
                          name="campaignType"
                          value={formData.campaignType}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                        >
                          <option value="online">Online</option>
                          <option value="offline">Offline</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="businessType" className="block text-sm font-semibold text-gray-700 mb-2">
                        Business Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="businessType"
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                        >
                          <option value="">Select Business Type</option>
                          <option value="retail">Retail Store</option>
                          <option value="restaurant">Restaurant</option>
                          <option value="fashion">Fashion & Clothing</option>
                          <option value="electronics">Electronics</option>
                          <option value="grocery">Grocery Store</option>
                          <option value="services">Services</option>
                          <option value="other">Other</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                        Location <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="e.g., Mumbai, Delhi, Bangalore"
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <span className="text-gray-400">📍</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="goalDescription" className="block text-sm font-semibold text-gray-700 mb-2">
                        Campaign Goal
                      </label>
                      <div className="relative">
                        <textarea
                          id="goalDescription"
                          name="goalDescription"
                          rows={3}
                          value={formData.goalDescription}
                          onChange={handleChange}
                          placeholder="e.g., Increase sales during festival season, attract new customers"
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm resize-none"
                        />
                        <div className="absolute top-3 right-0 pr-3 flex items-center">
                          <span className="text-gray-400">🎯</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="channelPreference" className="block text-sm font-semibold text-gray-700 mb-2">
                        Preferred Channels
                      </label>
                      <div className="relative">
                        <select
                          id="channelPreference"
                          name="channelPreference"
                          value={formData.channelPreference}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                        >
                          <option value="">Select Preference</option>
                          <option value="Online">Online (WhatsApp, Social Media)</option>
                          <option value="Offline">Offline (Print, Radio, In-store)</option>
                          <option value="Both">Both (Online + Offline)</option>
                          <option value="AI Recommend">AI Recommend (Let AI decide)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl animate-fadeInUp">
                        <div className="flex items-center">
                          <span className="text-red-500 mr-2">⚠️</span>
                          {error}
                        </div>
                      </div>
                    )}



                    <button
                      type="submit"
                      disabled={loading}
                      className="group w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                          <span>AI is analyzing your campaign...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span className="text-2xl mr-3">🤖</span>
                          Generate AI Plan
                          <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Campaign Preview */}
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/20 p-8 text-center">
                <div className="text-6xl mb-6 animate-bounce">🤖</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Campaign Planner</h3>
                <p className="text-gray-600 leading-relaxed mb-8">
                  Fill out the campaign details and click "Generate AI Plan" to get personalized marketing suggestions powered by artificial intelligence.
                </p>

                {/* Process Steps */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                      1
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Campaign Details</p>
                      <p className="text-sm text-gray-600">Theme, offer, budget & dates</p>
                    </div>
                  </div>

                  <div className="flex items-center bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                      2
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">AI Suggestions</p>
                      <p className="text-sm text-gray-600">Personalized marketing channels</p>
                    </div>
                  </div>

                  <div className="flex items-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                      3
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Generate Assets</p>
                      <p className="text-sm text-gray-600">QR codes, posts & pamphlets</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 rounded-2xl p-4">
                    <div className="text-2xl mb-2">📱</div>
                    <p className="font-semibold text-blue-900">Digital Channels</p>
                    <p className="text-blue-700">WhatsApp, Social Media</p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-4">
                    <div className="text-2xl mb-2">📊</div>
                    <p className="font-semibold text-purple-900">Analytics</p>
                    <p className="text-purple-700">Track & Optimize</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCampaignPage;