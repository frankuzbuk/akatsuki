import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEpisodeById, getAnimeEpisodes, getAnimeById, addWatchHistory } from '../lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const VideoPlayer = () => {
  const { episodeId } = useParams();
  const [episode, setEpisode] = useState(null);
  const [anime, setAnime] = useState(null);
  const [allEpisodes, setAllEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEpisode();
  }, [episodeId]);

  const loadEpisode = async () => {
    try {
      const episodeData = await getEpisodeById(episodeId);
      setEpisode(episodeData);

      // Load anime and episodes
      const [animeData, episodes] = await Promise.all([
        getAnimeById(episodeData.anime_id),
        getAnimeEpisodes(episodeData.anime_id)
      ]);
      setAnime(animeData);
      setAllEpisodes(episodes);

      // Track watch history
      try {
        await addWatchHistory(episodeData.anime_id, episodeId, 0);
      } catch (error) {
        console.error('Failed to add watch history:', error);
      }
    } catch (error) {
      console.error('Failed to load episode:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-300">Episode not found</h2>
          <Link to="/" className="text-orange-500 hover:text-orange-400 mt-4 inline-block">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = allEpisodes.findIndex(ep => ep.id === episodeId);
  const prevEpisode = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-black">
      {/* Video Player */}
      <div className="bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="aspect-video bg-gray-900 flex items-center justify-center relative" data-testid="video-player">
            {episode.video_url ? (
              <video
                controls
                autoPlay
                className="w-full h-full"
                poster={episode.thumbnail}
              >
                <source src={episode.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="text-center">
                <p className="text-2xl text-gray-400 mb-4">Video not available</p>
                <p className="text-gray-500">This episode has not been uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Episode Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        {anime && (
          <Link
            to={`/anime/${anime.id}`}
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-orange-500 transition mb-6"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to {anime.title}</span>
          </Link>
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2" data-testid="episode-title">
          Episode {episode.episode_number}: {episode.title}
        </h1>
        
        {episode.description && (
          <p className="text-gray-400 mb-6">{episode.description}</p>
        )}

        {/* Episode Navigation */}
        <div className="flex space-x-4 mb-8">
          {prevEpisode ? (
            <Link
              to={`/watch/${prevEpisode.id}`}
              className="px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition flex items-center space-x-2"
              data-testid="prev-episode-button"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Previous Episode</span>
            </Link>
          ) : (
            <button
              disabled
              className="px-6 py-3 bg-gray-800/50 rounded-lg text-gray-600 cursor-not-allowed flex items-center space-x-2"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Previous Episode</span>
            </button>
          )}

          {nextEpisode ? (
            <Link
              to={`/watch/${nextEpisode.id}`}
              className="px-6 py-3 bg-orange-500 rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
              data-testid="next-episode-button"
            >
              <span>Next Episode</span>
              <ChevronRight className="h-5 w-5" />
            </Link>
          ) : (
            <button
              disabled
              className="px-6 py-3 bg-gray-800/50 rounded-lg text-gray-600 cursor-not-allowed flex items-center space-x-2"
            >
              <span>Next Episode</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* All Episodes */}
        <h2 className="text-2xl font-bold mb-4">All Episodes</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {allEpisodes.map((ep) => (
            <Link
              key={ep.id}
              to={`/watch/${ep.id}`}
              className={`p-4 rounded-lg text-center transition ${
                ep.id === episodeId
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
              data-testid={`episode-nav-${ep.episode_number}`}
            >
              <div className="text-lg font-bold">EP {ep.episode_number}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
