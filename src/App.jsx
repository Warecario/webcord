import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  clearDiscordToken,
  createDiscordOAuthUrl,
  exchangeDiscordCode,
  getDiscordCallbackData,
  loadDiscordToken,
  saveDiscordToken
} from './discordAuth.js';
import { fetchCurrentUser } from './api/discordApi.js';
import DiscordClient from './DiscordClient.jsx';
import LoginPage from './LoginPage.jsx';

export default function App() {
  const [token, setToken] = useState(loadDiscordToken());
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { code, state, error } = getDiscordCallbackData(window.location.href);
    if (!code && !error) {
      return;
    }

    const codeVerifier = localStorage.getItem('webcord_discord_code_verifier');
    const storedState = localStorage.getItem('webcord_discord_state');

    if (error) {
      setAuthError(error);
      localStorage.removeItem('webcord_discord_code_verifier');
      localStorage.removeItem('webcord_discord_state');
      navigate('/login', { replace: true });
      return;
    }

    if (state !== storedState) {
      setAuthError('Discord state mismatch. Please try again.');
      localStorage.removeItem('webcord_discord_code_verifier');
      localStorage.removeItem('webcord_discord_state');
      navigate('/login', { replace: true });
      return;
    }

    if (!codeVerifier) {
      setAuthError('Missing OAuth verifier. Please try again.');
      localStorage.removeItem('webcord_discord_state');
      navigate('/login', { replace: true });
      return;
    }

    exchangeDiscordCode(code, codeVerifier)
      .then((payload) => {
        saveDiscordToken(payload);
        setToken(payload);
        localStorage.removeItem('webcord_discord_code_verifier');
        localStorage.removeItem('webcord_discord_state');
        const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.hash.split('?')[0]}`;
        window.history.replaceState({}, document.title, cleanUrl);
        navigate('/', { replace: true });
      })
      .catch((exchangeError) => {
        setAuthError(exchangeError.message || 'Discord login failed');
        localStorage.removeItem('webcord_discord_code_verifier');
        localStorage.removeItem('webcord_discord_state');
        navigate('/login', { replace: true });
      });
  }, [location.key, navigate]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;
    fetchCurrentUser(token)
      .then((data) => {
        if (active) {
          setUser(data);
          setAuthError('');
        }
      })
      .catch(() => {
        if (active) {
          clearDiscordToken();
          setToken(null);
          setUser(null);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleLogin = async () => {
    setAuthError('');
    try {
      const authUrl = await createDiscordOAuthUrl();
      window.location.href = authUrl;
    } catch (loginError) {
      setAuthError(loginError.message || 'Unable to start Discord login.');
    }
  };

  const handleLogout = () => {
    clearDiscordToken();
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} error={authError} />} />
      <Route path="/*" element={token ? <DiscordClient token={token} user={user} logout={handleLogout} /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
