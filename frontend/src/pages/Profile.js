import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getWatchHistory } from '../lib/api';
import { Mail, Calendar, Clock } from 'lucide-react';

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (user) {
      loadHistory();
    }
  }, [user, loading, navigate]);

  const loadHistory = async () => {
    try {
      const data = await getWatchHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-24 w-24 rounded-full ring-4 ring-orange-500" />
              ) : (
                <div className="h-24 w-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold">{user.name[0]}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2" data-testid="profile-name">{user.name}</h1>
              <div className="flex flex-col md:flex-row md:items-center md:space-x-6 text-gray-300">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {user.is_premium && (
                <span className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-semibold">
                  Premium Member
                </span>
              )}
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <span className="inline-block mt-2 ml-2 px-3 py-1 bg-purple-500 text-white rounded-full text-sm font-semibold">
                  {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/watchlist" className="bg-gray-800/50 backdrop-blur rounded-lg p-6 hover:ring-2 hover:ring-orange-500 transition">
            <h3 className="text-xl font-bold mb-2">My Watchlist</h3>
            <p className="text-gray-400">View your saved anime to watch later</p>
          </Link>
          <Link to="/favorites" className="bg-gray-800/50 backdrop-blur rounded-lg p-6 hover:ring-2 hover:ring-orange-500 transition">
            <h3 className="text-xl font-bold mb-2">My Favorites</h3>
            <p className="text-gray-400">Anime you've marked as favorites</p>
          </Link>
          {!user.is_premium && (
            <Link to="/pricing" className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-6 hover:scale-105 transition">
              <h3 className="text-xl font-bold mb-2">Upgrade to Premium</h3>
              <p className="text-orange-100">Get unlimited access to all anime</p>
            </Link>
          )}
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <Clock className="h-6 w-6 text-orange-500" />
            <span>Watch History</span>
          </h2>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item, index) => (
                <div key={index} className="bg-gray-800/50 backdrop-blur rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link to={`/watch/${item.episode_id}`} className="font-semibold hover:text-orange-500">
                        Continue watching
                      </Link>
                      <p className="text-sm text-gray-400 mt-1">
                        Watched {new Date(item.watched_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No watch history yet</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
