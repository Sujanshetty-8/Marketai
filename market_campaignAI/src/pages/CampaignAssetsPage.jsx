import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axiosConfig";

const CampaignAssetsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState({
    qrCodes: [],
    socialMediaPosts: [],
    pamphlets: [],
  });

  const campaignData = location.state?.campaignData || {};
  const selectedChannels = location.state?.selectedChannels || [];

  useEffect(() => {
    setIsVisible(true);
    if (!campaignData.theme || selectedChannels.length === 0) {
      navigate("/new-campaign");
      return;
    }
    generateAssets();
  }, [campaignData, selectedChannels, navigate]);

  const generateAssets = async () => {
    setLoading(true);
    try {
      // Call backend API to generate campaign assets
      const response = await api.post("/api/campaigns/generate-assets", {
        campaignData,
        selectedChannels,
      });

      setAssets(
        response.data.assets || {
          qrCodes: [],
          socialMediaPosts: [],
          pamphlets: [],
        }
      );
    } catch (error) {
      console.error("Error generating assets:", error);

      // Fallback to mock data if API fails (for development)
      const mockAssets = {
        qrCodes: [
          {
            id: 1,
            name: "Main Campaign QR",
            url: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://campaignai.com/track/main-campaign-123",
            trackingUrl: "http://localhost:5173/track/demo",
            scans: 0,
          },
          {
            id: 2,
            name: "WhatsApp Share QR",
            url: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://campaignai.com/track/whatsapp-123",
            trackingUrl: "http://localhost:5173/track/demo",
            scans: 0,
          },
        ],
        socialMediaPosts: [
          {
            id: 1,
            platform: "Facebook",
            content: `🎉 ${campaignData.theme} is here! ${
              campaignData.offer
            }\n\nDon't miss out on this amazing deal! Visit our store or scan the QR code to claim your offer.\n\n#${campaignData.theme?.replace(
              /\s+/g,
              ""
            )} #Sale #Offers`,
            hashtags: [
              "#Sale",
              "#Offers",
              `#${campaignData.theme?.replace(/\s+/g, "")}`,
            ],
            imageUrl:
              "https://via.placeholder.com/1200x630/3B82F6/FFFFFF?text=Facebook+Post",
          },
          {
            id: 2,
            platform: "Instagram",
            content: `✨ ${campaignData.theme} ✨\n\n${
              campaignData.offer
            }\n\nSwipe up or scan our QR code! 📱\n\n#${campaignData.theme?.replace(
              /\s+/g,
              ""
            )} #InstaSale #LimitedOffer`,
            hashtags: [
              "#InstaSale",
              "#LimitedOffer",
              `#${campaignData.theme?.replace(/\s+/g, "")}`,
            ],
            imageUrl:
              "https://via.placeholder.com/1080x1080/8B5CF6/FFFFFF?text=Instagram+Post",
          },
          {
            id: 3,
            platform: "WhatsApp",
            content: `🛍️ *${campaignData.theme}* 🛍️\n\n${campaignData.offer}\n\n📍 Visit our store today!\n💬 Share with friends and family\n\nValid till ${campaignData.endDate}`,
            hashtags: [],
            imageUrl:
              "https://via.placeholder.com/800x600/10B981/FFFFFF?text=WhatsApp+Message",
          },
        ],
        pamphlets: [
          {
            id: 1,
            name: "A4 Flyer Design",
            description: "Professional A4 flyer with QR code and offer details",
            downloadUrl: "#",
            previewUrl:
              "https://via.placeholder.com/595x842/EF4444/FFFFFF?text=A4+Flyer+Design",
            format: "PDF",
          },
          {
            id: 2,
            name: "Business Card Insert",
            description: "Small card design for counter display",
            downloadUrl: "#",
            previewUrl:
              "https://via.placeholder.com/350x200/F59E0B/FFFFFF?text=Business+Card",
            format: "PDF",
          },
        ],
      };

      setAssets(mockAssets);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (asset, type) => {
    // Mock download functionality
    console.log(`Downloading ${type}:`, asset);
    alert(`Downloading ${asset.name || asset.platform} ${type}...`);
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    alert("Text copied to clipboard!");
  };

  const handleFinishCampaign = () => {
    // Clear campaign data from sessionStorage when finishing
    sessionStorage.removeItem('campaignSuggestions');
    sessionStorage.removeItem('campaignData');
    sessionStorage.removeItem('selectedChannels');
    
    navigate("/dashboard");
  };

  const handleBackToSuggestions = () => {
    // Get suggestions from sessionStorage as fallback
    const storedSuggestions = sessionStorage.getItem('campaignSuggestions');
    const storedCampaignData = sessionStorage.getItem('campaignData');
    
    const suggestionsToPass = location.state?.suggestions || 
      (storedSuggestions ? JSON.parse(storedSuggestions) : []);
    const campaignDataToPass = campaignData || 
      (storedCampaignData ? JSON.parse(storedCampaignData) : {});
    
    navigate("/campaign-suggestions", {
      state: {
        campaignData: campaignDataToPass,
        suggestions: suggestionsToPass,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <span className="text-white text-3xl">🤖</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Generating Your Campaign Assets
            </h2>
            <p className="text-gray-600 mb-8">
              Our AI is creating QR codes, social media posts, and pamphlets...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div
          className="absolute top-40 left-10 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute -bottom-8 right-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div
            className={`mb-8 transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleBackToSuggestions}
                className="flex items-center text-purple-600 hover:text-purple-800 group transition-colors duration-300"
              >
                <svg
                  className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Suggestions
              </button>

              {/* Progress Indicator */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    ✓
                  </div>
                  <span className="ml-2 text-sm font-medium text-green-600">
                    Details
                  </span>
                </div>
                <div className="w-8 h-0.5 bg-green-500"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    ✓
                  </div>
                  <span className="ml-2 text-sm font-medium text-green-600">
                    Suggestions
                  </span>
                </div>
                <div className="w-8 h-0.5 bg-purple-500"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium text-purple-600">
                    Assets
                  </span>
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              Campaign Assets Ready! 🎉
            </h1>
            <p className="text-xl text-gray-600">
              Your QR codes, social media posts, and pamphlets are ready to
              download and share
            </p>
          </div>

          {/* Campaign Analytics Summary */}
          {assets.campaignAnalytics && (
            <div
              className={`mb-8 transform transition-all duration-1000 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
              style={{ transitionDelay: "150ms" }}
            >
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/20">
                <div className="px-8 py-6 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                      <span className="text-white text-lg">📊</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Campaign Analytics</h2>
                  </div>
                </div>
                <div className="p-8">
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {assets.campaignAnalytics.totalVisits}
                      </div>
                      <div className="text-blue-800 font-medium">Total Visits</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {assets.campaignAnalytics.totalConversions}
                      </div>
                      <div className="text-green-800 font-medium">Total Conversions</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {assets.campaignAnalytics.totalVisits > 0 
                          ? ((assets.campaignAnalytics.totalConversions / assets.campaignAnalytics.totalVisits) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <div className="text-purple-800 font-medium">Conversion Rate</div>
                    </div>
                  </div>
                  
                  {/* Channel Performance */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Channel Performance</h3>
                    <div className="space-y-3">
                      {assets.campaignAnalytics.channelPerformance.map((channel, index) => (
                        <div key={index} className="flex items-center justify-between bg-white rounded-xl p-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></div>
                            <span className="font-medium text-gray-900">{channel.channel}</span>
                          </div>
                          <div className="flex items-center space-x-6 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-blue-600">{channel.visits}</div>
                              <div className="text-gray-500 text-xs">Visits</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-green-600">{channel.conversions}</div>
                              <div className="text-gray-500 text-xs">Conversions</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-purple-600">{channel.conversionRate}%</div>
                              <div className="text-gray-500 text-xs">Rate</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QR Codes Section */}
          <div
            className={`mb-8 transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/20">
              <div className="px-8 py-6 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-white text-lg">📱</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">QR Codes</h2>
                </div>
              </div>
              <div className="p-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assets.qrCodes.map((qr) => (
                    <div
                      key={qr.id}
                      className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="text-center mb-4">
                        <img
                          src={qr.url}
                          alt={qr.name}
                          className="w-40 h-40 mx-auto rounded-2xl shadow-lg"
                        />
                      </div>
                      
                      {/* Channel Badge */}
                      <div className="flex items-center justify-center mb-3">
                        <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {qr.channelType || 'general'} • {qr.codePrefix || 'CODE'}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-2 text-center">
                        {qr.name}
                      </h3>
                      
                      {/* Analytics */}
                      <div className="bg-white rounded-xl p-3 mb-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-blue-600">{qr.scans || 0}</div>
                            <div className="text-gray-500 text-xs">Visits</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-green-600">{qr.conversions || 0}</div>
                            <div className="text-gray-500 text-xs">Conversions</div>
                          </div>
                        </div>
                        {qr.conversionRate && (
                          <div className="text-center mt-2 pt-2 border-t border-gray-100">
                            <div className="text-xs text-gray-600">
                              Conversion Rate: <span className="font-semibold text-purple-600">{qr.conversionRate}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => handleDownload(qr, "QR Code")}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl transition-colors duration-300 text-sm font-medium"
                        >
                          Download QR Code
                        </button>
                        <button
                          onClick={() => handleCopyText(qr.trackingUrl)}
                          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-xl transition-colors duration-300 text-sm font-medium"
                        >
                          Copy Tracking Link
                        </button>
                        {qr.trackingUrl && (
                          <a
                            href={qr.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded-xl transition-colors duration-300 text-sm font-medium text-center block"
                          >
                            Test Landing Page
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Demo Section */}
          <div
            className={`mb-8 transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
            style={{ transitionDelay: "350ms" }}
          >
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/20 p-8">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Test QR Code Demo</h2>
                </div>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  See how your customers will experience your campaigns! Test these demo QR codes to preview the customer landing pages.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Demo QR Code 1 */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Demo Campaign QR</h3>
                    <div className="mb-4">
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=http://localhost:5173/track/demo"
                        alt="Demo QR Code"
                        className="w-32 h-32 mx-auto rounded-xl shadow-lg"
                      />
                    </div>
                    <p className="text-gray-600 text-sm mb-4">Scan with your phone or click below</p>
                    <a
                      href="http://localhost:5173/track/demo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg group"
                    >
                      View Demo Page
                      <svg
                        className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Demo QR Code 2 */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Test Campaign QR</h3>
                    <div className="mb-4">
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=http://localhost:5173/track/test123"
                        alt="Test QR Code"
                        className="w-32 h-32 mx-auto rounded-xl shadow-lg"
                      />
                    </div>
                    <p className="text-gray-600 text-sm mb-4">Experience a different demo</p>
                    <a
                      href="http://localhost:5173/track/test123"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg group"
                    >
                      View Test Page
                      <svg
                        className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              <div className="text-center mt-8">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 max-w-2xl mx-auto">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">What You'll See:</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="text-left">
                      <p>✅ Shop name and campaign details</p>
                      <p>✅ Special offer information</p>
                      <p>✅ Unique discount code</p>
                    </div>
                    <div className="text-left">
                      <p>✅ Shop address and contact</p>
                      <p>✅ Validity period</p>
                      <p>✅ Terms and conditions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Posts Section */}
          <div
            className={`mb-8 transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/20">
              <div className="px-8 py-6 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-white text-lg">📱</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Social Media Posts
                  </h2>
                </div>
              </div>
              <div className="p-8">
                <div className="grid lg:grid-cols-3 gap-6">
                  {assets.socialMediaPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-6 border border-pink-200 hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="mb-4">
                        <img
                          src={post.imageUrl}
                          alt={`${post.platform} post`}
                          className="w-full h-40 object-cover rounded-xl"
                        />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">
                        {post.platform} Post
                      </h3>
                      <div className="bg-white rounded-xl p-4 mb-4 text-sm">
                        <p className="text-gray-700 whitespace-pre-line">
                          {post.content}
                        </p>
                      </div>
                      
                      {/* QR Code for this channel */}
                      {post.qrCode && (
                        <div className="bg-white rounded-xl p-3 mb-4 text-center">
                          <p className="text-xs text-gray-600 mb-2">Channel QR Code:</p>
                          <img
                            src={post.qrCode}
                            alt={`${post.platform} QR Code`}
                            className="w-16 h-16 mx-auto rounded-lg"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <button
                          onClick={() =>
                            handleDownload(post, "Social Media Post")
                          }
                          className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-xl transition-colors duration-300 text-sm font-medium"
                        >
                          Download Image
                        </button>
                        <button
                          onClick={() => handleCopyText(post.content)}
                          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-xl transition-colors duration-300 text-sm font-medium"
                        >
                          Copy Text
                        </button>
                        {post.trackingUrl && (
                          <button
                            onClick={() => handleCopyText(post.trackingUrl)}
                            className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-xl transition-colors duration-300 text-sm font-medium"
                          >
                            Copy Tracking Link
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pamphlets Section */}
          <div
            className={`mb-8 transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/20">
              <div className="px-8 py-6 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-white text-lg">📄</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Print Materials
                  </h2>
                </div>
              </div>
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {assets.pamphlets.map((pamphlet) => (
                    <div
                      key={pamphlet.id}
                      className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 border border-green-200 hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="mb-4">
                        <img
                          src={pamphlet.previewUrl}
                          alt={pamphlet.name}
                          className="w-full h-48 object-cover rounded-xl"
                        />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">
                        {pamphlet.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {pamphlet.description}
                      </p>
                      
                      {/* QR Code for this pamphlet */}
                      {pamphlet.qrCode && (
                        <div className="bg-white rounded-xl p-4 mb-4 text-center">
                          <p className="text-sm font-medium text-gray-700 mb-2">Embedded QR Code:</p>
                          <img
                            src={pamphlet.qrCode}
                            alt={`${pamphlet.name} QR Code`}
                            className="w-20 h-20 mx-auto rounded-lg shadow-sm"
                          />
                          <p className="text-xs text-gray-500 mt-2">This QR code will be included in the design</p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => handleDownload(pamphlet, "Pamphlet")}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl transition-colors duration-300 font-medium"
                        >
                          Download {pamphlet.format}
                        </button>
                        {pamphlet.trackingUrl && (
                          <button
                            onClick={() => handleCopyText(pamphlet.trackingUrl)}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-xl transition-colors duration-300 text-sm font-medium"
                          >
                            Copy Tracking Link
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-between transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
            style={{ transitionDelay: "800ms" }}
          >
            <button
              onClick={handleBackToSuggestions}
              className="flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Suggestions
            </button>

            <button
              onClick={handleFinishCampaign}
              className="group flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span className="text-xl mr-2">🎉</span>
              Finish & Go to Dashboard
              <svg
                className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignAssetsPage;
