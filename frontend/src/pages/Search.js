import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getAnimeList } from '../lib/api';
import { Play, Star, Filter } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
];

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [anime, setAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('q') || '',
    genre: searchParams.get('genre') || '',
    year: searchParams.get('year') || '',
    status: searchParams.get('status') || '',
    sort_by: searchParams.get('sort') || 'created_at'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAnime();
  }, [filters]);

  const loadAnime = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.genre) params.genre = filters.genre;
      if (filters.year) params.year = parseInt(filters.year);
      if (filters.status) params.status = filters.status;
      if (filters.sort_by) params.sort_by = filters.sort_by;

      const data = await getAnimeList(params);
      setAnime(data.anime || []);
    } catch (error) {
      console.error('Failed to load anime:', error);
      setAnime([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <PageWrapper pageName="search">
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Search Anime</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition flex items-center space-x-2"
            data-testid="filter-toggle"
          >
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 mb-8 space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search anime..."
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                data-testid="search-filter-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Genre */}
              <div>
                <label className="block text-sm font-medium mb-2">Genre</label>
                <select
                  value={filters.genre}
                  onChange={(e) => handleFilterChange('genre', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  data-testid="genre-filter"
                >
                  <option value="">All Genres</option>
                  {GENRES.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium mb-2">Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  data-testid="year-filter"
                >
                  <option value="">All Years</option>
                  {YEARS.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  data-testid="status-filter"
                >
                  <option value="">All Status</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                data-testid="sort-filter"
              >
                <option value="created_at">Latest</option>
                <option value="rating">Rating</option>
                <option value="view_count">Most Viewed</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-800 rounded-lg h-64" />
              </div>
            ))}
          </div>
        ) : anime.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6" data-testid="anime-results">
            {anime.map((item) => <AnimeCard key={item.id} anime={item} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-2xl text-gray-400">No anime found</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters</p>
          </div>
        )}
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

export default Search;
