import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import AnimeDetail from './pages/AnimeDetail';
import VideoPlayer from './pages/VideoPlayer';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Watchlist from './pages/Watchlist';
import Favorites from './pages/Favorites';
import Pricing from './pages/Pricing';
import Admin from './pages/Admin';
import './App.css';

function AppRouter() {
  const location = useLocation();

  // Handle OAuth callback synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  // Hide navbar on auth pages
  const hideNavbar = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="App min-h-screen bg-gray-900 text-white">
      {!hideNavbar && <Navbar />}
      <div className={hideNavbar ? '' : 'pt-16'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/anime/:id" element={<AnimeDetail />} />
          <Route path="/watch/:episodeId" element={<VideoPlayer />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteSettingsProvider>
          <AppRouter />
        </SiteSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
