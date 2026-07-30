import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axiosConfig';

const BusinessProfilePage = () => {
  const [profile, setProfile] = useState({
    businessName: '',
    industry: '',
    location: '',
    targetAudience: '',
    products: [],
    services: [],
    budget: 0,
    businessSize: '',
    usp: '',
    channels: [],
    goals: [],
    competitors: [],
    preferredLanguage: 'English'
  });
  const [productsInput, setProductsInput] = useState('');
  const [servicesInput, setServicesInput] = useState('');
  const [goalsInput, setGoalsInput] = useState('');
  const [competitorsInput, setCompetitorsInput] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/business-profile');
      setProfile(res.data);
      setProductsInput(res.data.products?.join(', ') || '');
      setServicesInput(res.data.services?.join(', ') || '');
      setGoalsInput(res.data.goals?.join(', ') || '');
      setCompetitorsInput(res.data.competitors?.join(', ') || '');
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Could not load your business profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');

    // Parse comma-separated inputs to arrays
    const parsedProducts = productsInput.split(',').map(s => s.trim()).filter(Boolean);
    const parsedServices = servicesInput.split(',').map(s => s.trim()).filter(Boolean);
    const parsedGoals = goalsInput.split(',').map(s => s.trim()).filter(Boolean);
    const parsedCompetitors = competitorsInput.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      ...profile,
      products: parsedProducts,
      services: parsedServices,
      goals: parsedGoals,
      competitors: parsedCompetitors
    };

    try {
      await api.post('/api/business-profile', payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Failed to update business profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChannelCheckbox = (channelName) => {
    const currentChannels = [...profile.channels];
    const idx = currentChannels.indexOf(channelName);
    if (idx > -1) {
      currentChannels.splice(idx, 1);
    } else {
      currentChannels.push(channelName);
    }
    setProfile({ ...profile, channels: currentChannels });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            My Business Profile
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure your core business properties. This grounds the AI recommendations and prompts.
          </p>
        </div>

        {success && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-2xl text-sm text-center">
            ✓ Business profile updated successfully!
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-2xl text-sm text-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Field 1: Business Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Business Name *</label>
              <input
                type="text"
                required
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g. Mangalore Bakery"
              />
            </div>

            {/* Field 2: Industry */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Industry / Category</label>
              <input
                type="text"
                value={profile.industry}
                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g. Food & Beverage"
              />
            </div>

            {/* Field 3: Location */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Location (City/State)</label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g. Mangalore, Karnataka"
              />
            </div>

            {/* Field 4: Business Size */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Business Size</label>
              <select
                value={profile.businessSize}
                onChange={(e) => setProfile({ ...profile, businessSize: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select size</option>
                <option value="Micro">Micro (under 10 staff)</option>
                <option value="Small">Small (under 50 staff)</option>
                <option value="Medium">Medium (under 250 staff)</option>
              </select>
            </div>

            {/* Field 5: Target Audience */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Target Audience Description</label>
              <input
                type="text"
                value={profile.targetAudience}
                onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g. College students, young adults"
              />
            </div>

            {/* Field 6: Monthly Budget */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Monthly Marketing Budget (INR)</label>
              <input
                type="number"
                value={profile.budget}
                onChange={(e) => setProfile({ ...profile, budget: parseInt(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g. 5000"
              />
            </div>

          </div>

          {/* Comma-separated array inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Key Products (Comma-separated)</label>
              <input
                type="text"
                value={productsInput}
                onChange={(e) => setProductsInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none"
                placeholder="e.g. cakes, pastries, bread"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Key Services (Comma-separated)</label>
              <input
                type="text"
                value={servicesInput}
                onChange={(e) => setServicesInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none"
                placeholder="e.g. custom orders, home delivery"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Competitors (Comma-separated)</label>
              <input
                type="text"
                value={competitorsInput}
                onChange={(e) => setCompetitorsInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none"
                placeholder="e.g. Cakes & More, Sweet Shop"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Preferred Language</label>
              <select
                value={profile.preferredLanguage}
                onChange={(e) => setProfile({ ...profile, preferredLanguage: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
              </select>
            </div>
          </div>

          {/* Field: USP */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Unique Selling Proposition (USP)</label>
            <textarea
              rows={3}
              value={profile.usp}
              onChange={(e) => setProfile({ ...profile, usp: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="What makes your business stand out from competitors?"
            />
          </div>

          {/* Field: Channels checkboxes */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase block">Active Marketing Channels</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Facebook', 'Instagram', 'WhatsApp', 'SMS', 'Email', 'Pamphlet Distribution'].map((ch, idx) => (
                <label key={idx} className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.channels.includes(ch)}
                    onChange={() => handleChannelCheckbox(ch)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-200">{ch}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-102 shadow-lg disabled:opacity-50"
            >
              {saving ? 'Saving changes...' : 'Save Profile Settings'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default BusinessProfilePage;
