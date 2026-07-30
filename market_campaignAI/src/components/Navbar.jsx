import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const shopName = localStorage.getItem('shopName') || 'Shop Owner';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('shopName');
    navigate('/login');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center group cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Market-AI
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Dashboard</button>
            <button onClick={() => navigate('/profile')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Business Profile</button>
            {/* Welcome Message */}
            <div className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-2xl">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-semibold">
                  {shopName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-gray-700 font-medium">
                Welcome, <span className="text-blue-600 font-semibold">{shopName}</span>
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="group flex items-center bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-2 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <svg className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 animate-fadeInUp">
            <div className="flex flex-col space-y-4 px-2">
              <button onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }} className="text-left text-gray-700 hover:text-blue-600 font-semibold py-2 px-3 hover:bg-slate-100 rounded-xl transition-all">Dashboard</button>
              <button onClick={() => { navigate('/profile'); setIsMenuOpen(false); }} className="text-left text-gray-700 hover:text-blue-600 font-semibold py-2 px-3 hover:bg-slate-100 rounded-xl transition-all">Business Profile</button>
              {/* Welcome Message Mobile */}
              <div className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 rounded-2xl">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">
                    {shopName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Welcome back</p>
                  <p className="text-blue-600 font-semibold">{shopName}</p>
                </div>
              </div>

              {/* Logout Button Mobile */}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-300 shadow-lg"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;