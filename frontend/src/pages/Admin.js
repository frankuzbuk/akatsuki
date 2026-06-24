import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAnalytics,
  getUsers,
  banUser,
  unbanUser,
  createAdmin,
  createAnime,
  createEpisode,
  uploadEpisodeVideo,
  uploadEpisodeThumbnail,
  getAnimeList,
  getAnimeEpisodes,
  deleteAnime,
  deleteEpisode
} from '../lib/api';
import { Users, Film, Video, BarChart3, Plus, UserPlus, Ban, Upload, Trash2 } from 'lucide-react';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.role !== 'admin' && user.role !== 'super_admin') {
        navigate('/');
      } else {
        loadData();
      }
    }
  }, [user, authLoading, navigate, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        const data = await getAnalytics();
        setAnalytics(data);
      } else if (activeTab === 'users') {
        const data = await getUsers();
        setUsers(data.users || []);
      } else if (activeTab === 'anime') {
        const data = await getAnimeList({ limit: 50 });
        setAnimeList(data.anime || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 font-semibold transition ${activeTab === 'analytics' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}
            data-testid="tab-analytics"
          >
            <BarChart3 className="h-5 w-5 inline mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-semibold transition ${activeTab === 'users' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}
            data-testid="tab-users"
          >
            <Users className="h-5 w-5 inline mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('anime')}
            className={`px-4 py-2 font-semibold transition ${activeTab === 'anime' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}
            data-testid="tab-anime"
          >
            <Film className="h-5 w-5 inline mr-2" />
            Anime
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 font-semibold transition ${activeTab === 'upload' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}
            data-testid="tab-upload"
          >
            <Upload className="h-5 w-5 inline mr-2" />
            Upload
          </button>
          {user.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-4 py-2 font-semibold transition ${activeTab === 'admins' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}
              data-testid="tab-admins"
            >
              <UserPlus className="h-5 w-5 inline mr-2" />
              Admins
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'analytics' && <AnalyticsTab analytics={analytics} />}
            {activeTab === 'users' && <UsersTab users={users} reload={loadData} />}
            {activeTab === 'anime' && <AnimeTab animeList={animeList} reload={loadData} />}
            {activeTab === 'upload' && <UploadTab />}
            {activeTab === 'admins' && user.role === 'super_admin' && <AdminsTab />}
          </>
        )}
      </div>
    </div>
  );
};

const AnalyticsTab = ({ analytics }) => {
  if (!analytics) return null;

  const stats = [
    { label: 'Total Users', value: analytics.total_users, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Anime', value: analytics.total_anime, icon: Film, color: 'from-purple-500 to-pink-500' },
    { label: 'Total Episodes', value: analytics.total_episodes, icon: Video, color: 'from-green-500 to-emerald-500' },
    { label: 'Total Comments', value: analytics.total_comments, icon: BarChart3, color: 'from-orange-500 to-red-500' },
    { label: 'Premium Users', value: analytics.premium_users, icon: Users, color: 'from-yellow-500 to-orange-500' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700">
            <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${stat.color} mb-4`}>
              <Icon className="h-6 w-6" />
            </div>
            <p className="text-gray-400 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
};

const UsersTab = ({ users, reload }) => {
  const handleBan = async (userId) => {
    const reason = prompt('Enter ban reason:');
    if (!reason) return;
    try {
      await banUser(userId, reason);
      alert('User banned successfully');
      reload();
    } catch (error) {
      alert('Failed to ban user: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUnban = async (userId) => {
    try {
      await unbanUser(userId);
      alert('User unbanned successfully');
      reload();
    } catch (error) {
      alert('Failed to unban user: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-900/50">
          <tr>
            <th className="text-left p-4">Name</th>
            <th className="text-left p-4">Email</th>
            <th className="text-left p-4">Role</th>
            <th className="text-left p-4">Status</th>
            <th className="text-left p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-gray-700" data-testid={`user-row-${user.id}`}>
              <td className="p-4">{user.name}</td>
              <td className="p-4">{user.email}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded text-xs ${
                  user.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400' :
                  user.role === 'admin' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {user.role}
                </span>
              </td>
              <td className="p-4">
                {user.is_banned ? (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">Banned</span>
                ) : (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Active</span>
                )}
                {user.is_premium && (
                  <span className="ml-2 px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">Premium</span>
                )}
              </td>
              <td className="p-4">
                {user.role !== 'admin' && user.role !== 'super_admin' && (
                  user.is_banned ? (
                    <button onClick={() => handleUnban(user.id)} className="px-3 py-1 bg-green-500 rounded hover:bg-green-600 text-sm" data-testid={`unban-${user.id}`}>
                      Unban
                    </button>
                  ) : (
                    <button onClick={() => handleBan(user.id)} className="px-3 py-1 bg-red-500 rounded hover:bg-red-600 text-sm flex items-center space-x-1" data-testid={`ban-${user.id}`}>
                      <Ban className="h-4 w-4" />
                      <span>Ban</span>
                    </button>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AnimeTab = ({ animeList, reload }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    title_english: '',
    description: '',
    genres: '',
    year: new Date().getFullYear(),
    status: 'ongoing',
    rating: 0,
    cover_image: '',
    banner_image: '',
    trailer_url: '',
    total_episodes: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAnime({
        ...formData,
        genres: formData.genres.split(',').map(g => g.trim()),
        year: parseInt(formData.year),
        rating: parseFloat(formData.rating),
        total_episodes: formData.total_episodes ? parseInt(formData.total_episodes) : null
      });
      alert('Anime created successfully');
      setShowForm(false);
      setFormData({ title: '', title_english: '', description: '', genres: '', year: new Date().getFullYear(), status: 'ongoing', rating: 0, cover_image: '', banner_image: '', trailer_url: '', total_episodes: 0 });
      reload();
    } catch (error) {
      alert('Failed to create anime: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this anime?')) return;
    try {
      await deleteAnime(id);
      alert('Anime deleted successfully');
      reload();
    } catch (error) {
      alert('Failed to delete anime: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600 flex items-center space-x-2" data-testid="add-anime-button">
          <Plus className="h-5 w-5" />
          <span>{showForm ? 'Cancel' : 'Add New Anime'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur rounded-lg p-6 mb-6 space-y-4">
          <h3 className="text-xl font-bold mb-4">Create New Anime</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" required placeholder="Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="anime-title-input" />
            <input type="text" placeholder="English Title" value={formData.title_english} onChange={(e) => setFormData({...formData, title_english: e.target.value})} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="anime-english-title-input" />
            <input type="text" required placeholder="Genres (comma separated)" value={formData.genres} onChange={(e) => setFormData({...formData, genres: e.target.value})} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="anime-genres-input" />
            <input type="number" required placeholder="Year" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="anime-year-input" />
            <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="anime-status-input">
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
            <input type="number" step="0.1" min="0" max="10" placeholder="Rating (0-10)" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="anime-rating-input" />
            <input type="url" required placeholder="Cover Image URL" value={formData.cover_image} onChange={(e) => setFormData({...formData, cover_image: e.target.value})} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="anime-cover-input" />
            <input type="url" placeholder="Banner Image URL" value={formData.banner_image} onChange={(e) => setFormData({...formData, banner_image: e.target.value})} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="anime-banner-input" />
            <input type="url" placeholder="Trailer URL" value={formData.trailer_url} onChange={(e) => setFormData({...formData, trailer_url: e.target.value})} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="anime-trailer-input" />
            <input type="number" placeholder="Total Episodes" value={formData.total_episodes} onChange={(e) => setFormData({...formData, total_episodes: e.target.value})} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="anime-episodes-input" />
          </div>
          <textarea required placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" rows="4" data-testid="anime-description-input" />
          <button type="submit" className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:from-orange-600 hover:to-red-600" data-testid="anime-submit-button">Create Anime</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {animeList.map((anime) => (
          <div key={anime.id} className="bg-gray-800/50 backdrop-blur rounded-lg p-4 flex space-x-4" data-testid={`anime-row-${anime.id}`}>
            <img src={anime.cover_image} alt={anime.title} className="w-16 h-24 object-cover rounded" />
            <div className="flex-1">
              <h3 className="font-bold">{anime.title}</h3>
              <p className="text-sm text-gray-400">{anime.year} • {anime.status}</p>
              <button onClick={() => handleDelete(anime.id)} className="mt-2 px-3 py-1 bg-red-500 rounded hover:bg-red-600 text-sm flex items-center space-x-1" data-testid={`delete-anime-${anime.id}`}>
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UploadTab = () => {
  const [animeList, setAnimeList] = useState([]);
  const [selectedAnime, setSelectedAnime] = useState('');
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [newEpisode, setNewEpisode] = useState({ episode_number: 1, title: '', description: '' });
  const [creatingEpisode, setCreatingEpisode] = useState(false);

  useEffect(() => {
    loadAnime();
  }, []);

  const loadAnime = async () => {
    try {
      const data = await getAnimeList({ limit: 100 });
      setAnimeList(data.anime || []);
    } catch (error) {
      console.error('Failed to load anime:', error);
    }
  };

  const handleAnimeSelect = async (animeId) => {
    setSelectedAnime(animeId);
    setSelectedEpisode('');
    if (animeId) {
      try {
        const data = await getAnimeEpisodes(animeId);
        setEpisodes(data);
      } catch (error) {
        console.error('Failed to load episodes:', error);
      }
    } else {
      setEpisodes([]);
    }
  };

  const handleCreateEpisode = async () => {
    if (!selectedAnime) return;
    try {
      const data = await createEpisode({
        anime_id: selectedAnime,
        episode_number: parseInt(newEpisode.episode_number),
        title: newEpisode.title,
        description: newEpisode.description
      });
      alert('Episode created successfully');
      setNewEpisode({ episode_number: newEpisode.episode_number + 1, title: '', description: '' });
      setCreatingEpisode(false);
      handleAnimeSelect(selectedAnime);
    } catch (error) {
      alert('Failed to create episode: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpload = async () => {
    if (!selectedEpisode || !videoFile) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      await uploadEpisodeVideo(selectedEpisode, videoFile, (progress) => {
        setUploadProgress(progress);
      });

      if (thumbnailFile) {
        await uploadEpisodeThumbnail(selectedEpisode, thumbnailFile);
      }

      alert('Video uploaded successfully');
      setVideoFile(null);
      setThumbnailFile(null);
      setUploadProgress(0);
    } catch (error) {
      alert('Upload failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Upload Video</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Anime</label>
            <select value={selectedAnime} onChange={(e) => handleAnimeSelect(e.target.value)} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="upload-anime-select">
              <option value="">Select an anime...</option>
              {animeList.map(anime => (
                <option key={anime.id} value={anime.id}>{anime.title}</option>
              ))}
            </select>
          </div>

          {selectedAnime && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Select Episode</label>
                <button onClick={() => setCreatingEpisode(!creatingEpisode)} className="text-sm text-orange-500 hover:text-orange-400" data-testid="create-episode-toggle">
                  {creatingEpisode ? 'Cancel' : '+ Create New Episode'}
                </button>
              </div>

              {creatingEpisode ? (
                <div className="bg-gray-900/50 rounded-lg p-4 space-y-2">
                  <input type="number" placeholder="Episode Number" value={newEpisode.episode_number} onChange={(e) => setNewEpisode({...newEpisode, episode_number: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg" data-testid="new-episode-number" />
                  <input type="text" placeholder="Episode Title" value={newEpisode.title} onChange={(e) => setNewEpisode({...newEpisode, title: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg" data-testid="new-episode-title" />
                  <textarea placeholder="Description" value={newEpisode.description} onChange={(e) => setNewEpisode({...newEpisode, description: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg" rows="2" data-testid="new-episode-description" />
                  <button onClick={handleCreateEpisode} className="px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600" data-testid="create-episode-button">Create Episode</button>
                </div>
              ) : (
                <select value={selectedEpisode} onChange={(e) => setSelectedEpisode(e.target.value)} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="upload-episode-select">
                  <option value="">Select an episode...</option>
                  {episodes.map(ep => (
                    <option key={ep.id} value={ep.id}>Episode {ep.episode_number}: {ep.title}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {selectedEpisode && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Video File</label>
                <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg" data-testid="video-file-input" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Thumbnail (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files[0])} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg" data-testid="thumbnail-file-input" />
              </div>

              {uploading && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Uploading...</span>
                    <span className="text-sm">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <button onClick={handleUpload} disabled={uploading || !videoFile} className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2" data-testid="upload-button">
                <Upload className="h-5 w-5" />
                <span>{uploading ? 'Uploading...' : 'Upload Video'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminsTab = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'admin' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAdmin(formData);
      alert('Admin created successfully');
      setShowForm(false);
      setFormData({ name: '', email: '', password: '', role: 'admin' });
    } catch (error) {
      alert('Failed to create admin: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div>
      <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600 flex items-center space-x-2 mb-6" data-testid="add-admin-button">
        <UserPlus className="h-5 w-5" />
        <span>{showForm ? 'Cancel' : 'Create New Admin'}</span>
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur rounded-lg p-6 space-y-4 max-w-2xl">
          <h3 className="text-xl font-bold">Create New Admin</h3>
          <input type="text" required placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="admin-name-input" />
          <input type="email" required placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="admin-email-input" />
          <input type="password" required placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="admin-password-input" />
          <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" data-testid="admin-role-input">
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <button type="submit" className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:from-orange-600 hover:to-red-600" data-testid="admin-submit-button">Create Admin</button>
        </form>
      )}
    </div>
  );
};

export default Admin;
