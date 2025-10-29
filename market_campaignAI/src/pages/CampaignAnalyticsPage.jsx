import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axiosConfig';

const CampaignAnalyticsPage = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showInactiveChannels, setShowInactiveChannels] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (campaignId) {
      fetchAnalytics();
    }
  }, [campaignId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/analytics/campaign/${campaignId}`);
      setAnalytics(response.data);
    } catch (err) {
      setError('Failed to fetch campaign analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // First sync the data
      await api.post('/api/analytics/sync-data');
      // Then fetch fresh analytics
      await fetchAnalytics();
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
    setRefreshing(false);
  };

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      await api.delete(`/api/analytics/cleanup/${campaignId}`);
      await fetchAnalytics(); // Refresh data after cleanup
    } catch (err) {
      console.error('Error cleaning up:', err);
    }
    setCleaning(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Link copied to clipboard');
    });
  };

  const getChannelIcon = (channelType) => {
    const icons = {
      'social': '📱',
      'messaging': '💬',
      'print': '📄',
      'general': '🎯',
      'email': '📧',
      'sms': '📱'
    };
    return icons[channelType] || '📊';
  };

  const getChannelColor = (channelName) => {
    const colors = {
      'instagram': 'from-pink-500 to-purple-600',
      'facebook': 'from-blue-600 to-blue-700',
      'whatsapp': 'from-green-500 to-green-600',
      'pamphlet': 'from-gray-600 to-gray-700',
      'email': 'from-red-500 to-red-600',
      'main': 'from-purple-600 to-blue-600'
    };
    return colors[channelName?.toLowerCase()] || 'from-blue-500 to-purple-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <span className="text-white text-3xl">📊</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Analytics</h2>
            <p className="text-gray-600 mb-8">Fetching campaign performance data...</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Analytics</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition-colors duration-300"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 right-10 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 left-10 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 right-20 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-blue-600 hover:text-blue-800 group transition-colors duration-300"
              >
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors duration-300"
                >
                  <svg className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {refreshing ? 'Refreshing...' : 'Refresh Data'}
                </button>
                
                <button
                  onClick={handleCleanup}
                  disabled={cleaning}
                  className="flex items-center bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors duration-300"
                >
                  <svg className={`w-4 h-4 mr-2 ${cleaning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {cleaning ? 'Cleaning...' : 'Clean Up'}
                </button>
              </div>
            </div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              Campaign Analytics
            </h1>
            <p className="text-xl text-gray-600">
              {analytics?.campaign?.name} - Detailed Performance Metrics
            </p>
          </div>

          {/* Campaign Summary */}
          <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white text-lg">📋</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Campaign Overview</h2>
              </div>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Campaign:</span>
                  <p className="text-gray-600">{analytics?.campaign?.name}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Status:</span>
                  <p className={`font-medium ${analytics?.campaign?.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                    {analytics?.campaign?.status || 'Active'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Start Date:</span>
                  <p className="text-gray-600">
                    {analytics?.campaign?.startDate ? new Date(analytics.campaign.startDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">End Date:</span>
                  <p className="text-gray-600">
                    {analytics?.campaign?.endDate ? new Date(analytics.campaign.endDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">👁️</span>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{analytics?.summary?.totalVisits || 0}</p>
                  </div>
                </div>
                <h3 className="text-gray-600 font-medium">Total Visits</h3>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{analytics?.summary?.totalConversions || 0}</p>
                  </div>
                </div>
                <h3 className="text-gray-600 font-medium">Conversions</h3>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{analytics?.summary?.overallConversionRate || 0}%</p>
                  </div>
                </div>
                <h3 className="text-gray-600 font-medium">Conversion Rate</h3>
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{analytics?.summary?.activeChannels || 0}</p>
                  </div>
                </div>
                <h3 className="text-gray-600 font-medium">Active Channels</h3>
              </div>
            </div>
          </div>

          {/* Channel Performance */}
          <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/20">
              <div className="px-8 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                      <span className="text-white text-lg">📈</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Channel Performance</h2>
                  </div>
                  
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showInactiveChannels}
                        onChange={(e) => setShowInactiveChannels(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${showInactiveChannels ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${showInactiveChannels ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                      <span className="ml-3 text-sm text-gray-700">Show inactive channels</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-8">
                {analytics?.channelPerformance?.length > 0 ? (
                  <div className="grid gap-6">
                    {analytics.channelPerformance
                      .filter(channel => {
                        // Show all channels if toggle is on, otherwise only show active ones
                        if (showInactiveChannels) return true;
                        return channel.visits > 0 || channel.conversions > 0;
                      })
                      .map((channel, index) => (
                      <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className={`w-12 h-12 bg-gradient-to-r ${getChannelColor(channel.channelName)} rounded-xl flex items-center justify-center mr-4`}>
                              <span className="text-white text-lg">{getChannelIcon(channel.channelType)}</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 capitalize">{channel.channelName}</h3>
                              <p className="text-sm text-gray-600 capitalize">{channel.channelType} Channel</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-600">{channel.conversionRate}%</div>
                            <div className="text-sm text-gray-500">Conversion Rate</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center bg-white rounded-xl p-3">
                            <div className="text-xl font-bold text-blue-600">{channel.visits}</div>
                            <div className="text-xs text-gray-500">Visits</div>
                          </div>
                          <div className="text-center bg-white rounded-xl p-3">
                            <div className="text-xl font-bold text-green-600">{channel.conversions}</div>
                            <div className="text-xs text-gray-500">Conversions</div>
                          </div>
                          <div className="text-center bg-white rounded-xl p-3">
                            <div className="text-xl font-bold text-purple-600">{channel.conversionRate}%</div>
                            <div className="text-xs text-gray-500">Rate</div>
                          </div>
                          <div className="text-center bg-white rounded-xl p-3">
                            <div className="text-xl font-bold text-orange-600">
                              {channel.visits > 0 ? Math.round((channel.conversions / channel.visits) * 100) : 0}
                            </div>
                            <div className="text-xs text-gray-500">Score</div>
                          </div>
                        </div>

                        {/* QR Code and Tracking URL */}
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tracking URL:</label>
                            <div className="flex">
                              <input
                                type="text"
                                value={channel.trackingUrl || `${window.location.origin}/track/${analytics.campaign.name.toLowerCase().replace(/\s+/g, '-')}?channel=${channel.channelName}`}
                                readOnly
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-xl bg-gray-50 text-sm"
                              />
                              <button
                                onClick={() => copyToClipboard(channel.trackingUrl || `${window.location.origin}/track/${analytics.campaign.name.toLowerCase().replace(/\s+/g, '-')}?channel=${channel.channelName}`)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-xl transition-colors duration-300"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          <div className="text-center">
                            <label className="block text-sm font-medium text-gray-700 mb-2">QR Code:</label>
                            <img
                              src={channel.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + '/track/' + analytics.campaign.name.toLowerCase().replace(/\s+/g, '-') + '?channel=' + channel.channelName)}`}
                              alt={`${channel.channelName} QR Code`}
                              className="w-20 h-20 mx-auto rounded-lg shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <p className="text-gray-500">
                      {analytics?.channelPerformance?.length > 0 
                        ? 'No active channels found.' 
                        : 'No channel data available yet.'
                      }
                    </p>
                    <p className="text-gray-400 text-sm">
                      {analytics?.channelPerformance?.length > 0 
                        ? 'Toggle "Show inactive channels" to see all channels, or use "Clean Up" to remove unused ones.'
                        : 'Create some QR codes and start tracking visits!'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {analytics?.recentRedemptions?.length > 0 && (
            <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '500ms' }}>
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/20">
                <div className="px-8 py-6 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                      <span className="text-white text-lg">🎯</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Recent Redemptions</h2>
                  </div>
                </div>
                <div className="p-8">
                  <div className="space-y-4">
                    {analytics.recentRedemptions.map((redemption, index) => (
                      <div key={index} className="flex items-center justify-between bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{redemption.code}</div>
                            <div className="text-sm text-gray-600">via {redemption.channel}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(redemption.redeemedAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(redemption.redeemedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Performance Chart */}
          {analytics?.dailyStats?.length > 0 && (
            <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '600ms' }}>
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/20">
                <div className="px-8 py-6 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4">
                      <span className="text-white text-lg">📅</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Daily Performance (Last 7 Days)</h2>
                  </div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-7 gap-2">
                    {analytics.dailyStats.map((day, index) => (
                      <div key={index} className="text-center">
                        <div className="text-xs text-gray-500 mb-2">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="bg-gradient-to-t from-blue-100 to-blue-50 rounded-lg p-3 mb-2">
                          <div className="text-lg font-bold text-blue-600">{day.visits}</div>
                          <div className="text-xs text-gray-500">Visits</div>
                        </div>
                        <div className="bg-gradient-to-t from-green-100 to-green-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-green-600">{day.conversions}</div>
                          <div className="text-xs text-gray-500">Conversions</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignAnalyticsPage;