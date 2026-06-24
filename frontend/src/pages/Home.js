import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrendingAnime, getLatestAnime } from '../lib/api';
import { Play, Star, ChevronLeft, ChevronRight, TrendingUp, Clock } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1581436670376-f152b9e3b5ec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHw0fHxhbmltZSUyMGNpbmVtYXRpY3xlbnwwfHx8fDE3ODIyNDIzNDR8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1677143016687-8dbb7e71db08?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwyfHxhbmltZSUyMGNpbmVtYXRpY3xlbnwwfHx8fDE3ODIyNDIzNDR8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1708034677699-6f39d9c59f6e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHw0fHxhbmltZSUyMGNoYXJhY3RlcnxlbnwwfHx8fDE3ODIyNDIzNDh8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1766043650776-e71079fd4d3f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHwzfHxhbmltZSUyMGFydHxlbnwwfHx8fDE3ODIyNDIzNTd8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1755973707174-47be69f3d037?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHw0fHxhbmltZSUyMGFydHxlbnwwfHx8fDE3ODIyNDIzNTd8MA&ixlib=rb-4.1.0&q=85'
];

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [trending, setTrending] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [trendingData, latestData] = await Promise.all([
        getTrendingAnime(10),
        getLatestAnime(10)
      ]);
      setTrending(trendingData);
      setLatest(latestData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
  };

  return (
    <PageWrapper pageName="home" overlayOpacity={0.6}>
    <div className="min-h-screen">
      {/* Hero Slider */}
      <div className="relative h-[70vh] overflow-hidden" data-testid="hero-slider">
        {HERO_IMAGES.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          </div>
        ))}

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Unlimited Anime
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl">
              Watch thousands of anime series and movies. New episodes added daily.
            </p>
            <div className="flex space-x-4">
              <Link
                to="/search"
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition flex items-center space-x-2"
                data-testid="hero-browse-button"
              >
                <Play className="h-5 w-5" />
                <span>Browse Anime</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Slider Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition"
          data-testid="slider-prev"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition"
          data-testid="slider-next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slider Dots */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex space-x-2">
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition ${
                index === currentSlide ? 'bg-orange-500 w-8' : 'bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Trending Anime */}
        <section data-testid="trending-section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <span>Trending Now</span>
            </h2>
            <Link to="/search?sort=trending" className="text-orange-500 hover:text-orange-400">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-800 rounded-lg h-64" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {trending.length > 0 ? (
                trending.map((anime) => <AnimeCard key={anime.id} anime={anime} />)
              ) : (
                <p className="text-gray-400 col-span-full text-center py-8">No trending anime available</p>
              )}
            </div>
          )}
        </section>

        {/* Latest Episodes */}
        <section data-testid="latest-section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <span>Latest Releases</span>
            </h2>
            <Link to="/search?sort=latest" className="text-orange-500 hover:text-orange-400">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-800 rounded-lg h-64" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {latest.length > 0 ? (
                latest.map((anime) => <AnimeCard key={anime.id} anime={anime} />)
              ) : (
                <p className="text-gray-400 col-span-full text-center py-8">No latest anime available</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
    </PageWrapper>
  );
};

const AnimeCard = ({ anime }) => {
  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1668293750324-bd77c1f08ca9';

  return (
    <Link
      to={`/anime/${anime.id}`}
      className="group relative overflow-hidden rounded-lg bg-gray-800 hover:ring-2 hover:ring-orange-500 transition"
      data-testid={`anime-card-${anime.id}`}
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={anime.cover_image || DEFAULT_IMAGE}
          alt={anime.title}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
          onError={(e) => {
            e.target.src = DEFAULT_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <div className="bg-orange-500 rounded-full p-3">
            <Play className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-orange-500 transition">
          {anime.title}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span>{anime.rating ? anime.rating.toFixed(1) : 'N/A'}</span>
          </div>
          <span className="text-xs text-gray-400">{anime.year}</span>
        </div>
      </div>
    </Link>
  );
};

export default Home;
