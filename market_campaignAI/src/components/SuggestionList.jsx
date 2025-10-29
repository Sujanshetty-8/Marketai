import { useState } from 'react';
import api from '../api/axiosConfig';

const SuggestionList = ({ suggestions, onChannelAdded }) => {
  const [loadingChannels, setLoadingChannels] = useState({});

  const handleAddChannel = async (suggestion) => {
    setLoadingChannels(prev => ({ ...prev, [suggestion.id]: true }));

    try {
      const response = await api.post('/api/campaigns/add-channel', {
        suggestionId: suggestion.id,
        channel: suggestion.channel,
        content: suggestion.content
      });
      
      if (onChannelAdded) {
        onChannelAdded(response.data);
      }
    } catch (err) {
      console.error('Error adding channel:', err);
      alert('Failed to add channel. Please try again.');
    } finally {
      setLoadingChannels(prev => ({ ...prev, [suggestion.id]: false }));
    }
  };

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">AI Campaign Suggestions</h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={suggestion.id || index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{suggestion.channel}</h3>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {suggestion.type || 'Digital'}
                </span>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">AI-Generated Content:</h4>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <pre className="whitespace-pre-wrap font-sans">{suggestion.content}</pre>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                {suggestion.estimatedReach && (
                  <div className="text-gray-600">
                    <span className="font-medium">Budget/Reach:</span> {suggestion.estimatedReach}
                  </div>
                )}
                {suggestion.budget && (
                  <div className="text-gray-600">
                    <span className="font-medium">Allocated Budget:</span> ₹{suggestion.budget}
                  </div>
                )}
              </div>

              {suggestion.callToAction && (
                <div className="mb-4 text-sm">
                  <span className="font-medium text-gray-700">Call to Action:</span>
                  <p className="text-gray-600 mt-1">{suggestion.callToAction}</p>
                </div>
              )}

              {suggestion.visualPrompt && (
                <div className="mb-4 text-sm">
                  <span className="font-medium text-gray-700">Visual Design Suggestion:</span>
                  <p className="text-gray-600 mt-1 italic">{suggestion.visualPrompt}</p>
                </div>
              )}

              <button
                onClick={() => handleAddChannel(suggestion)}
                disabled={loadingChannels[suggestion.id]}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                {loadingChannels[suggestion.id] ? 'Adding...' : '+ Add Channel'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestionList;