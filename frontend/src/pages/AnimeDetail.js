import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnimeById, getAnimeEpisodes, addToWatchlist, addToFavorites, removeFromWatchlist, removeFromFavorites, getComments, createComment } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Play, Star, Heart, List, Calendar, TrendingUp, Send } from 'lucide-react';

const AnimeDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);

  useEffect(() => {
    loadAnimeData();
  }, [id]);

  const loadAnimeData = async () => {
    try {
      const [animeData, episodesData, commentsData] = await Promise.all([
        getAnimeById(id),
        getAnimeEpisodes(id),
        getComments(id)
      ]);
      setAnime(animeData);
      setEpisodes(episodesData);
      setComments(commentsData);
    } catch (error) {
      console.error('Failed to load anime:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlist = async () => {
    if (!user) return;
    try {
      if (inWatchlist) {
        await removeFromWatchlist(id);
        setInWatchlist(false);
      } else {
        await addToWatchlist(id);
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Watchlist error:', error);
    }
  };

  const handleFavorite = async () => {
    if (!user) return;
    try {
      if (inFavorites) {
        await removeFromFavorites(id);
        setInFavorites(false);
      } else {
        await addToFavorites(id);
        setInFavorites(true);
      }
    } catch (error) {
      console.error('Favorites error:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    try {
      const newComment = await createComment({
        anime_id: id,
        text: commentText
      });
      setComments([newComment, ...comments]);
      setCommentText('');
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-300">Anime not found</h2>
          <Link to="/" className="text-orange-500 hover:text-orange-400 mt-4 inline-block">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1668293750324-bd77c1f08ca9';

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-[50vh] overflow-hidden">
        <img
          src={anime.banner_image || anime.cover_image || DEFAULT_IMAGE}
          alt={anime.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = DEFAULT_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover Image */}
          <div className="flex-shrink-0">
            <img
              src={anime.cover_image || DEFAULT_IMAGE}
              alt={anime.title}
              className="w-64 rounded-lg shadow-2xl"
              onError={(e) => {
                e.target.src = DEFAULT_IMAGE;
              }}
              data-testid="anime-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4" data-testid="anime-title">{anime.title}</h1>
            
            {anime.title_english && (
              <p className="text-xl text-gray-400 mb-2">{anime.title_english}</p>
            )}

            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-1">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{anime.rating ? anime.rating.toFixed(1) : 'N/A'}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span>{anime.year}</span>
              <span className="text-gray-400">•</span>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-500 rounded-full text-sm">
                {anime.status === 'ongoing' ? 'Ongoing' : 'Completed'}
              </span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {anime.genres?.map((genre, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-800 rounded-full text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            {user && (
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={handleWatchlist}
                  className={`px-6 py-3 rounded-lg font-semibold transition flex items-center space-x-2 ${
                    inWatchlist
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  data-testid="watchlist-button"
                >
                  <List className="h-5 w-5" />
                  <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                </button>

                <button
                  onClick={handleFavorite}
                  className={`px-6 py-3 rounded-lg font-semibold transition flex items-center space-x-2 ${
                    inFavorites
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  data-testid="favorite-button"
                >
                  <Heart className={`h-5 w-5 ${inFavorites ? 'fill-white' : ''}`} />
                  <span>{inFavorites ? 'Favorited' : 'Add to Favorites'}</span>
                </button>
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed">{anime.description}</p>
            </div>
          </div>
        </div>

        {/* Episodes */}
        <section className="mt-12">
          <h2 className="text-3xl font-bold mb-6">Episodes</h2>
          {episodes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {episodes.map((episode) => (
                <Link
                  key={episode.id}
                  to={`/watch/${episode.id}`}
                  className="bg-gray-800/50 backdrop-blur rounded-lg p-4 hover:bg-gray-800 hover:ring-2 hover:ring-orange-500 transition"
                  data-testid={`episode-${episode.episode_number}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 bg-orange-500 rounded-lg p-3">
                      <Play className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Episode {episode.episode_number}</h3>
                      <p className="text-sm text-gray-400 line-clamp-1">{episode.title}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No episodes available yet</p>
          )}
        </section>

        {/* Comments */}
        <section className="mt-12 pb-12">
          <h2 className="text-3xl font-bold mb-6">Comments</h2>

          {user && (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  data-testid="comment-input"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-6 py-3 bg-orange-500 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="comment-submit"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="bg-gray-800/50 backdrop-blur rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {comment.user_avatar ? (
                        <img src={comment.user_avatar} alt={comment.user_name} className="h-10 w-10 rounded-full" />
                      ) : (
                        <div className="h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold">{comment.user_name[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold">{comment.user_name}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AnimeDetail;
