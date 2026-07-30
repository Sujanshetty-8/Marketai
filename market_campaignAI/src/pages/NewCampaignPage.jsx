import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axiosConfig';

const NewCampaignPage = () => {
  const navigate = useNavigate();

  const [formFields, setFormFields] = useState({
    businessName: '',
    industry: '',
    location: '',
    targetAudience: '',
    usp: '',
    budget: '',
    goal: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default 15 days
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [agentStep, setAgentStep] = useState(0);

  const agentStepsList = [
    { name: 'Research Agent', desc: 'Querying local trends & festival catalogs...' },
    { name: 'Strategy Agent', desc: 'Calculating budget splits & timelines...' },
    { name: 'Content Agent', desc: 'Writing personalized messaging copy...' },
    { name: 'Creative Agent', desc: 'Composing visual image prompts...' },
    { name: 'Reviewer Agent', desc: 'Validating final campaign guidelines...' }
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/business-profile');
      if (res.data) {
        setFormFields(prev => ({
          ...prev,
          businessName: res.data.businessName || '',
          industry: res.data.industry || '',
          location: res.data.location || '',
          targetAudience: res.data.targetAudience || '',
          usp: res.data.usp || '',
          budget: res.data.budget || ''
        }));
      }
    } catch (err) {
      console.error('Failed to pre-populate business profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormFields(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateCampaign = async (e) => {
    e.preventDefault();
    if (loading || generatingPlan) return;

    if (!formFields.businessName || !formFields.budget || !formFields.startDate || !formFields.endDate) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratingPlan(true);
    setAgentStep(0);

    // Dynamic compilation steps interval updater
    const animationInterval = setInterval(() => {
      setAgentStep(prev => {
        if (prev < agentStepsList.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2500);

    try {
      const res = await api.post('/api/ai/generate-plan', formFields);
      const { campaignPlan, savedCampaign } = res.data;

      // Clear interval and complete animation
      clearInterval(animationInterval);
      setAgentStep(agentStepsList.length - 1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGeneratingPlan(false);

      // Map suggestions output
      const transformedSuggestions = [];
      if (campaignPlan.budget_split?.channels) {
        Object.entries(campaignPlan.budget_split.channels).forEach(([channelName, allocatedBudget], index) => {
          const cleanName = channelName.toLowerCase();
          let type = 'Digital';
          if (cleanName.includes('flyer') || cleanName.includes('poster') || cleanName.includes('pamphlet') || cleanName.includes('print')) {
            type = 'Physical';
          }
          
          let copy = '';
          if (cleanName.includes('whatsapp')) copy = campaignPlan.content?.whatsapp;
          else if (cleanName.includes('instagram')) copy = campaignPlan.content?.instagram;
          else if (cleanName.includes('facebook')) copy = campaignPlan.content?.facebook;
          else if (cleanName.includes('google')) copy = campaignPlan.content?.google_business;
          else if (cleanName.includes('sms')) copy = campaignPlan.content?.sms;
          else if (cleanName.includes('email')) copy = campaignPlan.content?.email;
          else copy = campaignPlan.content?.whatsapp || '';

          let promptText = '';
          if (cleanName.includes('instagram')) promptText = campaignPlan.creative_prompts?.instagram?.prompt;
          else if (cleanName.includes('facebook')) promptText = campaignPlan.creative_prompts?.banner?.prompt;
          else if (cleanName.includes('flyer')) promptText = campaignPlan.creative_prompts?.flyer?.prompt;
          else if (cleanName.includes('poster')) promptText = campaignPlan.creative_prompts?.poster?.prompt;
          else promptText = campaignPlan.creative_prompts?.poster?.prompt || '';

          transformedSuggestions.push({
            id: index + 1,
            channel: channelName,
            description: `AI recommended allocation: ₹${allocatedBudget} for ${channelName}`,
            content: copy || `Special localized campaign for ${formFields.businessName}`,
            type,
            estimatedReach: `Expected conversions: ${campaignPlan.expected_conversion || 'AI-estimated'}`,
            budget: allocatedBudget,
            callToAction: campaignPlan.content?.cta || 'Scan QR!',
            visualPrompt: promptText,
            trackingType: type === 'Physical' ? 'qr_code' : 'link'
          });
        });
      }

      const campaignDataWithId = {
        theme: campaignPlan.campaign_objective || 'AI Marketing Campaign',
        offer: campaignPlan.referral_program || 'Special Discount',
        budget: parseInt(formFields.budget) || 0,
        campaignType: 'hybrid',
        businessType: formFields.industry || 'retail',
        location: formFields.location || 'India',
        campaignId: savedCampaign._id || savedCampaign.id
      };

      // Store in SessionStorage
      sessionStorage.setItem('campaignSuggestions', JSON.stringify(transformedSuggestions));
      sessionStorage.setItem('campaignData', JSON.stringify(campaignDataWithId));
      sessionStorage.setItem('campaignExplanation', JSON.stringify(campaignPlan.explanation || {}));
      sessionStorage.setItem('campaignTimeline', JSON.stringify(campaignPlan.timeline || {}));

      navigate('/campaign-suggestions', {
        state: {
          campaignData: campaignDataWithId,
          suggestions: transformedSuggestions,
          savedCampaign: savedCampaign
        }
      });

    } catch (err) {
      clearInterval(animationInterval);
      console.error('Failed to generate campaign plan:', err);
      setError(err.response?.data?.message || 'Failed to generate campaign plan. Make sure local AI service is online.');
      setGeneratingPlan(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white font-sans flex flex-col relative overflow-hidden">
      
      {/* Premium background radial glow blobs */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-600/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      <Navbar />

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 relative z-10 flex flex-col justify-center">
        
        {/* Main Card container */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-5">
          
          {/* Left Column: Form info guidance */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-950 to-indigo-900 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
            <div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                <span className="text-2xl">🚀</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-4">
                Launch Your Campaign
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Tell us about your campaign budget and goals. Our Multi-Agent System will analyze your local market trends, compile specific copy, and build instant trackable QR codes for your offline flyer distribution or social channels.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 text-xs text-slate-400">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <p>Basic business profile details are pre-filled automatically.</p>
                </div>
                <div className="flex items-start space-x-3 text-xs text-slate-400">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <p>Calendar picker generates precise dynamic timelines.</p>
                </div>
                <div className="flex items-start space-x-3 text-xs text-slate-400">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <p>Single-shot generation minimizes AI wait times.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10 text-xs text-slate-400">
              Powered by local Ollama & LangGraph campaign engine.
            </div>
          </div>

          {/* Right Column: Setup Form */}
          <div className="lg:col-span-3 p-8 relative">
            {error && (
              <div className="mb-6 p-4 bg-red-950/40 border border-red-800 text-red-200 text-sm rounded-2xl text-center">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleGenerateCampaign} className="space-y-6">
              
              {/* Form Section 1: Business Identity */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
                  1. Business Identity (Pre-filled)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Shop / Business Name</label>
                    <input
                      type="text"
                      name="businessName"
                      value={formFields.businessName}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. New Electricals"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Location (City/State)</label>
                    <input
                      type="text"
                      name="location"
                      value={formFields.location}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Mangalore"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Industry / Category</label>
                    <input
                      type="text"
                      name="industry"
                      value={formFields.industry}
                      onChange={handleInputChange}
                      placeholder="e.g. Appliances"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Target Audience</label>
                    <input
                      type="text"
                      name="targetAudience"
                      value={formFields.targetAudience}
                      onChange={handleInputChange}
                      placeholder="e.g. Families"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Unique USP</label>
                    <input
                      type="text"
                      name="usp"
                      value={formFields.usp}
                      onChange={handleInputChange}
                      placeholder="e.g. Free 1-year warranty"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Form Section 2: Campaign Configuration */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
                  2. Campaign Setup
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Campaign Budget (INR)</label>
                    <input
                      type="number"
                      name="budget"
                      value={formFields.budget}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. 3000"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formFields.startDate}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formFields.endDate}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Campaign Expectations / Goal</label>
                  <textarea
                    name="goal"
                    rows="3"
                    value={formFields.goal}
                    onChange={handleInputChange}
                    placeholder="Describe what you want to achieve from this campaign (e.g., Increase footfall via Clearance sales and easy EMI promotions)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || generatingPlan}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Generating Marketing Strategy...</span>
                ) : (
                  <>
                    <span>Generate Campaign Plan</span>
                    <span>🚀</span>
                  </>
                )}
              </button>
            </form>

            {/* Premium Loader Overlay */}
            {generatingPlan && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col justify-center items-center p-8 z-50">
                <div className="w-full max-w-md space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin border-b-2 border-indigo-200" />
                    <h4 className="text-xl font-extrabold text-indigo-300 animate-pulse">
                      ⚡ Orchestrating Marketing Agents ⚡
                    </h4>
                    <p className="text-xs text-slate-400 mt-2">
                      Please wait, local Ollama is compiling your materials...
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {agentStepsList.map((step, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center space-x-4 p-3 rounded-2xl border transition-all duration-500 ${
                          agentStep > idx
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                            : agentStep === idx
                            ? 'bg-indigo-900/60 border-indigo-400 text-indigo-100 scale-[1.02] font-semibold'
                            : 'bg-slate-900/40 border-white/5 text-slate-600'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white/10">
                          {agentStep > idx ? '✓' : idx + 1}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-xs">{step.name}</div>
                          {agentStep === idx && (
                            <div className="text-[10px] text-indigo-400 mt-0.5">{step.desc}</div>
                          )}
                        </div>
                        {agentStep === idx && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCampaignPage;