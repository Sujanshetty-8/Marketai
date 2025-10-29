import { useState } from 'react';
import api from '../api/axiosConfig';

const RedemptionComponent = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setMessage('Please enter a redemption code');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/api/redeem', { code: code.trim() });
      setMessage(response.data.message || 'Code redeemed successfully!');
      setMessageType('success');
      setCode('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to redeem code');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Redeem Customer Code</h2>
      </div>
      <div className="p-6">
        <form onSubmit={handleRedeem} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Redemption Code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., A7B-X9P"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Redeeming...' : 'Redeem Code'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default RedemptionComponent;