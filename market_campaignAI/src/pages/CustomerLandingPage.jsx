import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const CustomerLandingPage = () => {
  const { trackerId } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (trackerId) {
      trackScan();
    }
  }, [trackerId]);

  const trackScan = async () => {
    try {
      // Make API call with explicit JSON headers to ensure we get JSON response
      const response = await api.get(`/track/legacy/${trackerId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setTrackingData(response.data);
    } catch (err) {
      setError('Invalid or expired tracking link');
      console.error('Error tracking scan:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading offer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Shop/Brand Logo or Icon */}
          <div className="text-6xl mb-4">🎉</div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {trackingData?.shopName || 'Special Offer'}
          </h1>
          
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {trackingData?.campaignName || 'Exclusive Deal'}
            </h2>
            <p className="text-lg">
              {trackingData?.offer || 'Special discount just for you!'}
            </p>
          </div>

          {/* Unique Redemption Code */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Your unique code:</p>
            <div className="text-2xl font-bold text-blue-600 tracking-wider">
              {trackingData?.uniqueCode || 'A7B-X9P'}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Show this code at the store to redeem
            </p>
          </div>

          {/* Additional Information */}
          {trackingData?.validUntil && (
            <div className="text-sm text-gray-600 mb-4">
              Valid until: {new Date(trackingData.validUntil).toLocaleDateString()}
            </div>
          )}

          {trackingData?.terms && (
            <div className="text-xs text-gray-500 border-t pt-4">
              <p className="font-medium mb-1">Terms & Conditions:</p>
              <p>{trackingData.terms}</p>
            </div>
          )}

          {/* Contact Information */}
          {trackingData?.shopAddress && (
            <div className="mt-6 pt-4 border-t text-sm text-gray-600">
              <p className="font-medium">Visit us at:</p>
              <p>{trackingData.shopAddress}</p>
              {trackingData?.shopPhone && (
                <p className="mt-1">📞 {trackingData.shopPhone}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerLandingPage;