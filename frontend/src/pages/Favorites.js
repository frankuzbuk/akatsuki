import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFavorites } from '../lib/api';
import { Star, Heart } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [anime, setAnime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      loadFavorites();
    }
  }, [user, authLoading, navigate]);

  const loadFavorites = async () => {
    try {
      const data = await getFavorites();
      setAnime(data);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1668293750324-bd77c1f08ca9';

  return (
    <PageWrapper pageName="favorites">
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center space-x-2">
          <Heart className="h-8 w-8 text-red-500 fill-red-500" />
          <span>My Favorites</span>
        </h1>
        {anime.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {anime.map((item) => (
              <Link key={item.id} to={`/anime/${item.id}`} className="group relative overflow-hidden rounded-lg bg-gray-800 hover:ring-2 hover:ring-orange-500 transition" data-testid={`favorite-anime-${item.id}`}>
                <div className="aspect-[2/3] relative overflow-hidden">
                  <img src={item.cover_image || DEFAULT_IMAGE} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" onError={(e) => { e.target.src = DEFAULT_IMAGE; }} />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2">{item.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span>{item.rating ? item.rating.toFixed(1) : 'N/A'}</span>
                    </div>
                    <span className="text-xs text-gray-400">{item.year}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-2xl text-gray-400 mb-4">No favorites yet</p>
            <Link to="/" className="text-orange-500 hover:text-orange-400">Browse anime to add to your favorites</Link>
          </div>
        )}
      </div>
    </div>
    </PageWrapper>
  );
};

export default Favorites;
