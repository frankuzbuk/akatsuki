import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getSiteSettings } from '../lib/api';

const SiteSettingsContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSiteSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load site settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Get full image URL
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_URL}${path}`;
  };

  // Get background image for a page
  const getBgImage = (page) => {
    if (!settings?.background_images?.[page]) return null;
    return getImageUrl(settings.background_images[page]);
  };

  const value = {
    settings,
    loading,
    loadSettings,
    getImageUrl,
    getBgImage
  };

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  }
  return context;
};
