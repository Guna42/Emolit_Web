import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/home';
  };

  public render() {
    if (this.state.hasError) {
      // Read isDark from localStorage or defaults
      const isDark = localStorage.getItem('theme') !== 'light'; 

      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center px-6 text-center transition-colors duration-500"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(239,68,68,0.08) 0%, transparent 55%), linear-gradient(170deg, #010202 0%, #080303 40%, #0d0505 100%)'
              : '#ffffff',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {/* Ambient orb */}
          <div
            className="absolute w-[36rem] h-[36rem] rounded-full pointer-events-none"
            style={{
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: isDark
                ? 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(239,68,68,0.04) 0%, transparent 70%)',
              animation: 'eb-orb 3s ease-in-out infinite',
            }}
          />

          {/* GIF */}
          <div
            className="relative z-10 mb-8"
            style={{ animation: 'eb-float 3.5s ease-in-out infinite' }}
          >
            <img
              src={`${process.env.PUBLIC_URL}/notfound.gif`}
              alt="System error"
              style={{ width: 'min(20rem, 75vw)', height: 'min(20rem, 75vw)', objectFit: 'contain' }}
            />
          </div>

          {/* Text */}
          <div className="relative z-10">
            <p
              className="text-[11px] font-black tracking-[0.5em] uppercase mb-3 text-red-500"
            >
              System Error
            </p>
            <h1
              className="font-black tracking-tighter leading-[1.1] mb-4 text-3xl sm:text-4xl"
              style={{
                color: isDark ? '#fef2f2' : '#7f1d1d',
              }}
            >
              Something Went Wrong
            </h1>
            <p
              className="text-base font-medium mb-10 max-w-sm mx-auto leading-relaxed"
              style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280' }}
            >
              The app encountered an unexpected error. Let's restart the system.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm transition-all duration-300 shadow-xl hover:-translate-y-1 active:scale-95 text-white"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  boxShadow: isDark ? '0 20px 40px -10px rgba(239,68,68,0.3)' : '0 20px 40px -10px rgba(239,68,68,0.2)',
                }}
              >
                <RefreshCw size={16} className="animate-spin-slow" />
                Reload Application
              </button>
            </div>
          </div>

          <style>{`
            @keyframes eb-float {
              0%, 100% { transform: translateY(0px); }
              50%       { transform: translateY(-12px); }
            }
            @keyframes eb-orb {
              0%, 100% { transform: translate(-50%, -50%) scale(1);   opacity: 0.8; }
              50%       { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
            }
            .animate-spin-slow {
              animation: spin 8s linear infinite;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
