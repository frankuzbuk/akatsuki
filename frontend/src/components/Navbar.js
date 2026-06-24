import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, User, LogOut, Heart, List, Settings, Home } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-orange-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" data-testid="navbar-logo">
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              AnimeStream
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anime..."
                className="w-full px-4 py-2 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-400"
                data-testid="search-input"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </form>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-1 text-gray-300 hover:text-orange-500 transition"
              data-testid="nav-home"
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>

            {user ? (
              <>
                <Link
                  to="/watchlist"
                  className="flex items-center space-x-1 text-gray-300 hover:text-orange-500 transition"
                  data-testid="nav-watchlist"
                >
                  <List className="h-5 w-5" />
                  <span>Watchlist</span>
                </Link>

                <Link
                  to="/favorites"
                  className="flex items-center space-x-1 text-gray-300 hover:text-orange-500 transition"
                  data-testid="nav-favorites"
                >
                  <Heart className="h-5 w-5" />
                  <span>Favorites</span>
                </Link>

                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 text-gray-300 hover:text-orange-500 transition"
                    data-testid="nav-admin"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Admin</span>
                  </Link>
                )}

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-gray-300 hover:text-orange-500 transition"
                    data-testid="user-menu-button"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                    ) : (
                      <User className="h-8 w-8 p-1 bg-gray-800 rounded-full" />
                    )}
                    <span>{user.name}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-orange-500 transition"
                        onClick={() => setShowUserMenu(false)}
                        data-testid="menu-profile"
                      >
                        Profile
                      </Link>
                      {!user.is_premium && (
                        <Link
                          to="/pricing"
                          className="block px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-orange-500 transition"
                          onClick={() => setShowUserMenu(false)}
                          data-testid="menu-pricing"
                        >
                          Go Premium
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-red-500 transition flex items-center space-x-2"
                        data-testid="menu-logout"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-orange-500 transition"
                  data-testid="nav-login"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition"
                  data-testid="nav-register"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
