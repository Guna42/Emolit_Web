import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center transition-colors duration-500"
      style={{
        background: isDark
          ? 'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(82,183,136,0.10) 0%, transparent 55%), linear-gradient(170deg, #010202 0%, #030806 40%, #050d0a 100%)'
          : '#ffffff',
      }}
    >
      {/* Ambient orb */}
      <div
        className="absolute w-[36rem] h-[36rem] rounded-full pointer-events-none"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: isDark
            ? 'radial-gradient(circle, rgba(82,183,136,0.08) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
          animation: 'nf-orb 3s ease-in-out infinite',
        }}
      />

      {/* GIF */}
      <div
        className="relative z-10 mb-8"
        style={{ animation: 'nf-float 3.5s ease-in-out infinite' }}
      >
        <img
          src={`${process.env.PUBLIC_URL}/notfound.gif`}
          alt="Page not found"
          style={{ width: 'min(22rem, 80vw)', height: 'min(22rem, 80vw)', objectFit: 'contain' }}
        />
      </div>

      {/* Text */}
      <div className="relative z-10" style={{ animation: 'nf-in 0.7s cubic-bezier(0.22,1,0.36,1) both' }}>
        <p
          className="text-[11px] font-black tracking-[0.5em] uppercase mb-3"
          style={{ color: isDark ? 'rgba(82,183,136,0.8)' : '#059669' }}
        >
          Error 404
        </p>
        <h1
          className="font-black tracking-tighter leading-[1.1] mb-4"
          style={{
            fontSize: 'clamp(2.4rem, 7vw, 4rem)',
            color: isDark ? '#f0fdf4' : '#064e3b',
          }}
        >
          Lost in the{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #065f46 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Spectrum
          </span>
        </h1>
        <p
          className="text-base font-medium mb-10 max-w-sm mx-auto leading-relaxed"
          style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280' }}
        >
          This page doesn't exist in our emotional landscape. Let's guide you back.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/home"
            className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm transition-all duration-300 shadow-xl hover:-translate-y-1 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              boxShadow: isDark ? '0 20px 40px -10px rgba(16,185,129,0.3)' : '0 20px 40px -10px rgba(16,185,129,0.2)',
            }}
          >
            <Home size={16} />
            Go Home
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm transition-all duration-300 border hover:-translate-y-1 active:scale-95"
            style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
              color: isDark ? 'rgba(255,255,255,0.7)' : '#374151',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
            }}
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>

      <style>{`
        @keyframes nf-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes nf-orb {
          0%, 100% { transform: translate(-50%, -50%) scale(1);   opacity: 0.8; }
          50%       { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        }
        @keyframes nf-in {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
