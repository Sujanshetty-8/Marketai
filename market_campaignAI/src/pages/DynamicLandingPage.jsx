import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const DynamicLandingPage = () => {
  const { campaignName } = useParams();
  const [searchParams] = useSearchParams();
  const channel = searchParams.get('channel') || 'main';
  
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (campaignName) {
      trackVisit();
    }
  }, [campaignName, channel]);

  useEffect(() => {
    if (trackingData) {
      setIsVisible(true);
    }
  }, [trackingData]);

  const trackVisit = async () => {
    try {
      // Make API call with explicit JSON headers to ensure we get JSON response
      const response = await api.get(`/track/${campaignName}?channel=${channel}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setTrackingData(response.data);
    } catch (err) {
      setError('Invalid or expired campaign link');
      console.error('Error tracking visit:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channelName) => {
    const icons = {
      'instagram': '📸',
      'facebook': '📘',
      'whatsapp': '💬',
      'pamphlet': '📄',
      'email': '📧',
      'sms': '📱',
      'print': '🖨️',
      'main': '🎯'
    };
    return icons[channelName.toLowerCase()] || '🎉';
  };

  const getChannelColor = (channelName) => {
    const colors = {
      'instagram': 'from-pink-500 to-purple-600',
      'facebook': 'from-blue-600 to-blue-700',
      'whatsapp': 'from-green-500 to-green-600',
      'pamphlet': 'from-gray-600 to-gray-700',
      'email': 'from-red-500 to-red-600',
      'sms': 'from-indigo-500 to-indigo-600',
      'print': 'from-yellow-600 to-orange-600',
      'main': 'from-purple-600 to-blue-600'
    };
    return colors[channelName.toLowerCase()] || 'from-blue-500 to-purple-600';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Code copied to clipboard');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Loading your exclusive offer...</p>
          <p className="text-gray-500 text-sm mt-2">Via {channel} channel</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="text-sm text-gray-500">
              Campaign: {campaignName} | Channel: {channel}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className={`relative z-10 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-white/20 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}`}>
        <div className="text-center">
          {/* Channel Badge */}
          <div className="inline-flex items-center bg-gray-100 rounded-full px-4 py-2 mb-6">
            <span className="text-lg mr-2">{getChannelIcon(trackingData?.channelName)}</span>
            <span className="text-sm font-medium text-gray-700 capitalize">
              Via {trackingData?.channelName || channel}
            </span>
          </div>

          {/* Shop/Brand Logo or Icon */}
          <div className="text-7xl mb-6 animate-bounce">🎉</div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {trackingData?.shopName || 'Special Offer'}
          </h1>
          
          {/* Main Offer Card */}
          <div className={`bg-gradient-to-r ${getChannelColor(trackingData?.channelName)} text-white rounded-2xl p-6 mb-6 shadow-lg transform hover:scale-105 transition-transform duration-300`}>
            <h2 className="text-xl font-semibold mb-3">
              {trackingData?.campaignName || 'Exclusive Deal'}
            </h2>
            <p className="text-lg leading-relaxed">
              {trackingData?.offer || 'Special discount just for you!'}
            </p>
          </div>

          {/* Unique Redemption Code */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-6 border-2 border-dashed border-gray-300">
            <p className="text-sm text-gray-600 mb-3 font-medium">Your unique redemption code:</p>
            <div 
              className="text-3xl font-bold text-blue-600 tracking-wider mb-3 cursor-pointer hover:text-blue-800 transition-colors duration-300"
              onClick={() => copyToClipboard(trackingData?.uniqueCode)}
              title="Click to copy"
            >
              {trackingData?.uniqueCode || 'LOADING...'}
            </div>
            <button
              onClick={() => copyToClipboard(trackingData?.uniqueCode)}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Click to copy code
            </button>
            <p className="text-xs text-gray-500 mt-3">
              Show this code at the store to redeem your offer
            </p>
          </div>

          {/* Validity Information */}
          {trackingData?.validUntil && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center text-yellow-800">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">
                  Valid until: {new Date(trackingData.validUntil).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          {trackingData?.terms && (
            <div className="text-xs text-gray-500 border-t border-gray-200 pt-4 mb-6">
              <p className="font-medium mb-2">Terms & Conditions:</p>
              <p className="leading-relaxed">{trackingData.terms}</p>
            </div>
          )}

          {/* Contact Information */}
          {trackingData?.shopAddress && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">Visit us at:</span>
              </div>
              <p className="mb-2">{trackingData.shopAddress}</p>
              {trackingData?.shopPhone && (
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${trackingData.shopPhone}`} className="text-blue-600 hover:text-blue-800 font-medium">
                    {trackingData.shopPhone}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* QR Code for sharing (if available) */}
          {trackingData?.qrCodeUrl && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Share this offer:</p>
              <img 
                src={trackingData.qrCodeUrl} 
                alt="QR Code" 
                className="w-24 h-24 mx-auto rounded-lg shadow-md"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicLandingPage;