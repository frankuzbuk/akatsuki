import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true
});

// Anime APIs
export const getAnimeList = async (params = {}) => {
  const response = await api.get('/anime', { params });
  return response.data;
};

export const getTrendingAnime = async (limit = 10) => {
  const response = await api.get('/anime/trending', { params: { limit } });
  return response.data;
};

export const getLatestAnime = async (limit = 10) => {
  const response = await api.get('/anime/latest', { params: { limit } });
  return response.data;
};

export const getAnimeById = async (id) => {
  const response = await api.get(`/anime/${id}`);
  return response.data;
};

export const createAnime = async (data) => {
  const response = await api.post('/anime', data);
  return response.data;
};

export const updateAnime = async (id, data) => {
  const response = await api.put(`/anime/${id}`, data);
  return response.data;
};

export const deleteAnime = async (id) => {
  const response = await api.delete(`/anime/${id}`);
  return response.data;
};

// Episode APIs
export const getAnimeEpisodes = async (animeId) => {
  const response = await api.get(`/anime/${animeId}/episodes`);
  return response.data;
};

export const getEpisodeById = async (id) => {
  const response = await api.get(`/episodes/${id}`);
  return response.data;
};

export const createEpisode = async (data) => {
  const response = await api.post('/episodes', data);
  return response.data;
};

export const uploadEpisodeVideo = async (episodeId, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/episodes/${episodeId}/upload-video`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  });
  return response.data;
};

export const uploadEpisodeThumbnail = async (episodeId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/episodes/${episodeId}/upload-thumbnail`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Comment APIs
export const getComments = async (animeId, episodeId = null) => {
  const response = await api.get(`/comments/${animeId}`, {
    params: episodeId ? { episode_id: episodeId } : {}
  });
  return response.data;
};

export const createComment = async (data) => {
  const response = await api.post('/comments', data);
  return response.data;
};

export const deleteComment = async (id) => {
  const response = await api.delete(`/comments/${id}`);
  return response.data;
};

// Watchlist APIs
export const getWatchlist = async () => {
  const response = await api.get('/user/watchlist');
  return response.data;
};

export const addToWatchlist = async (animeId) => {
  const response = await api.post('/user/watchlist', { anime_id: animeId });
  return response.data;
};

export const removeFromWatchlist = async (animeId) => {
  const response = await api.delete(`/user/watchlist/${animeId}`);
  return response.data;
};

// Favorites APIs
export const getFavorites = async () => {
  const response = await api.get('/user/favorites');
  return response.data;
};

export const addToFavorites = async (animeId) => {
  const response = await api.post('/user/favorites', { anime_id: animeId });
  return response.data;
};

export const removeFromFavorites = async (animeId) => {
  const response = await api.delete(`/user/favorites/${animeId}`);
  return response.data;
};

// Watch History APIs
export const addWatchHistory = async (animeId, episodeId, progress) => {
  const response = await api.post('/user/watch-history', {
    anime_id: animeId,
    episode_id: episodeId,
    progress
  });
  return response.data;
};

export const getWatchHistory = async () => {
  const response = await api.get('/user/watch-history');
  return response.data;
};

// Admin APIs
export const createAdmin = async (data) => {
  const response = await api.post('/admin/create', data);
  return response.data;
};

export const banUser = async (userId, reason, duration = null) => {
  const response = await api.post('/admin/ban-user', {
    user_id: userId,
    reason,
    duration
  });
  return response.data;
};

export const unbanUser = async (userId) => {
  const response = await api.post('/admin/unban-user', { user_id: userId });
  return response.data;
};

export const getUsers = async (page = 1, limit = 20) => {
  const response = await api.get('/admin/users', { params: { page, limit } });
  return response.data;
};

export const getAnalytics = async () => {
  const response = await api.get('/admin/analytics');
  return response.data;
};

// Payment APIs
export const createCheckout = async (packageId) => {
  const originUrl = window.location.origin;
  const response = await api.post('/payments/checkout', {
    package_id: packageId,
    origin_url: originUrl
  });
  return response.data;
};

export const getPaymentStatus = async (sessionId) => {
  const response = await api.get(`/payments/status/${sessionId}`);
  return response.data;
};

// Site Settings APIs
export const getSiteSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSiteSettings = async (data) => {
  const response = await api.put('/admin/settings', data);
  return response.data;
};

export const uploadBgImage = async (page, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/admin/settings/upload-bg-image?page=${page}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const uploadLogo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/admin/settings/upload-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const removeBgImage = async (page) => {
  const response = await api.delete(`/admin/settings/bg-image/${page}`);
  return response.data;
};

export default api;
