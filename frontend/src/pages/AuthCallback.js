import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_id from hash
        const hash = location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          navigate('/login');
          return;
        }

        // Exchange session_id for session token
        const response = await axios.post(
          `${API_URL}/api/auth/google/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        // Navigate to dashboard with user data
        navigate('/', { state: { user: response.data }, replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login', { state: { error: 'Authentication failed' } });
      }
    };

    processSession();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
