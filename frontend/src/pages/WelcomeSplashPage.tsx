import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './welcome-splash.css';

const WelcomeSplashPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [fadeOut, setFadeOut] = useState(false);

  // Extract destination passed via state (from LoginPage), fallback to /home
  const destination =
    (location.state as { from?: string } | null)?.from || '/home';

  // Extract first name from full name
  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    // Start fade-out at 3.8s, navigate at 4.3s (smooth transition, 4s total duration)
    const fadeTimer = setTimeout(() => setFadeOut(true), 3800);
    const navTimer  = setTimeout(() => navigate(destination, { replace: true }), 4300);
    return () => { clearTimeout(fadeTimer); clearTimeout(navTimer); };
  }, [navigate, destination]);

  return (
    <div
      className={`welcome-splash${fadeOut ? ' welcome-splash--out' : ''}`}
      data-theme={isDark ? 'dark' : 'light'}
    >
      {/* Subtle ambient orb */}
      <div className="welcome-splash__orb" />

      <div className="welcome-splash__card">
        {/* Animation */}
        <div className="welcome-splash__gif-wrap">
          <img
            src={`${process.env.PUBLIC_URL}/navigate_to_home.gif`}
            alt="Welcome animation"
            className="welcome-splash__gif"
          />
        </div>

        {/* Text */}
        <div className="welcome-splash__text">
          <h1 className="welcome-splash__title">
            Welcome to{' '}
            <span className="welcome-splash__brand">Emolit</span>
          </h1>
          <p className="welcome-splash__name">Hey, {firstName} 👋</p>
          <p className="welcome-splash__tagline">
            Your emotions, your story — always safe with us.
          </p>
        </div>

        {/* Subtle progress bar */}
        <div className="welcome-splash__progress">
          <div className="welcome-splash__progress-bar" />
        </div>
      </div>
    </div>
  );
};

export default WelcomeSplashPage;
