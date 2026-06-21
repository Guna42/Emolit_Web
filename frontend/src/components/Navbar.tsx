import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, BookOpen, LogOut, User, Menu, X, ChevronRight, Sparkles, Calendar, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../hooks/useNotification';
import ThemeToggle from './ThemeToggle';
import './app-navbar.css';

const NAV_ITEMS = [
  { id: 'home',      label: 'Home',      path: '/home',      icon: Home },
  { id: 'search',    label: 'Search',    path: '/search',    icon: Search },
  { id: 'journal',   label: 'Journal',   path: '/journal',   icon: BookOpen },
  { id: 'calendar',  label: 'Calendar',  path: '/calendar',  icon: Calendar },
  { id: 'reminders', label: 'Reminders', path: '/reminders', icon: Bell },
];

const Navbar: React.FC = () => {
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { dueCount } = useNotification();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`app-navbar transition-all duration-500 ${scrolled ? 'app-navbar--scrolled' : ''}`}
        aria-label="Main navigation"
      >
        <div className="app-navbar__backdrop" aria-hidden />
        <div className="app-navbar__inner max-w-[1600px] mx-auto">
          <Link
            to="/"
            className="pointer-events-auto block transition-transform duration-500 hover:scale-105 active:scale-95 relative group/logo -ml-2 md:-ml-4"
          >
            <div className="hidden md:block absolute -inset-10 bg-indigo-500/10 blur-3xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity duration-700" />
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="EmoLit"
              className="relative h-14 md:h-16 w-auto object-contain drop-shadow-xl filter hover:brightness-110 transition-all"
            />
          </Link>

          <div className="flex items-center pointer-events-auto gap-2 md:gap-0">
            <div
              className={`app-navbar__pill hidden md:flex items-center gap-5 px-5 py-2 mr-3 rounded-full border backdrop-blur-xl transition-all duration-500 ring-1 ${
                isDark ? 'bg-[#111a14]/60 border-white/5 ring-white/5' : 'border-slate-100 ring-slate-200'
              }`}
            >
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`app-navbar__navlink relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-400 group border-2 ${
                      isActive
                        ? (isDark ? 'app-navbar__navlink--active border-emerald-500/50 bg-emerald-500 text-[#0a0f0d] shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-110 ring-1 ring-emerald-400' : 'app-navbar__navlink--active border-white bg-slate-900 text-white shadow-2xl scale-110 ring-1 ring-indigo-500')
                        : (isDark ? 'border-transparent bg-white/5 text-slate-500 hover:text-emerald-400 hover:bg-white/10 ring-1 ring-white/5' : 'border-white bg-slate-50 text-slate-400 hover:text-indigo-600 hover:border-white hover:shadow-lg hover:-translate-y-0.5 ring-1 ring-slate-300 hover:ring-indigo-300')
                    }`}
                    aria-label={item.label}
                  >
                    <Icon className={`w-5 h-5 transition-all duration-400 ${isActive ? 'stroke-[2.5px]' : 'stroke-2 group-hover:stroke-[2.5px]'}`} />
                    {item.id === 'reminders' && dueCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 text-white text-[8px] font-black flex items-center justify-center leading-none shadow-md z-10">
                        {dueCount > 9 ? '9+' : dueCount}
                      </span>
                    )}
                    {!isActive && (
                      <span className={`app-navbar__navtip absolute -bottom-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap px-2 py-1 rounded-md shadow-sm border transition-colors ${
                        isDark ? 'text-slate-400 bg-[#111a14] border-white/5' : 'text-slate-400 bg-white border-slate-100'
                      }`}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {user && (
              <div className="hidden md:block relative group ml-0.5">
                <button
                  type="button"
                  className={`app-navbar__avatar w-12 h-12 rounded-full border-2 shadow-md flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl ring-1 transition-colors ${
                    isDark ? 'bg-[#111a14] border-white/5 ring-white/5 hover:ring-emerald-400/50' : 'bg-white border-white ring-slate-300 hover:ring-emerald-400/50'
                  }`}
                  aria-haspopup="true"
                >
                  <User className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`} />
                </button>
                <div className={`app-navbar__dropdown absolute right-0 top-full mt-4 w-60 p-4 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100 z-[70] ${
                  isDark ? 'bg-[#0a0f0d]/95 border-white/5' : 'bg-white/95 border-white/60'
                }`}>
                  <div className={`px-5 py-4 border-b mb-2 transition-colors ${isDark ? 'border-white/5' : 'border-slate-100/50'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Signed in as</p>
                    <p className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.full_name || 'Explorer'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold text-rose-500 transition-colors flex items-center gap-3 group/logout ${isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'}`}
                  >
                    <LogOut className="w-5 h-5 group-hover/logout:-translate-x-1 transition-transform" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            <div className={`app-navbar__theme-slot hidden md:flex items-center ml-3 pl-3 border-l transition-colors ${isDark ? 'border-white/5' : 'border-slate-200/80'}`}>
              <ThemeToggle />
            </div>

            <button
              type="button"
              className={`app-navbar__burger md:hidden w-12 h-12 rounded-full backdrop-blur-md shadow-md border flex items-center justify-center active:scale-95 transition-all z-50 ${
                isDark ? 'bg-[#111a14]/90 border-white/5 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
              }`}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 stroke-[2.5px]" />
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`app-navbar__sheet fixed inset-0 z-[60] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
        } ${isDark ? 'bg-[#0a0f0d]' : 'bg-white'}`}
      >
        <div className="absolute top-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full px-6 py-6 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${isDark ? 'bg-emerald-500 text-[#0a0f0d]' : 'bg-slate-900 text-white'}`}>
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <span className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>EmoLit</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all ${isDark ? 'bg-white/5 text-white' : 'bg-slate-50 text-slate-900 hover:bg-slate-100'}`}
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 space-y-2 relative z-10">
          {NAV_ITEMS.map((item, idx) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center justify-between p-4 rounded-3xl transition-all duration-300 ${
                  isActive
                    ? (isDark ? 'bg-emerald-500 text-[#0a0f0d] shadow-xl shadow-emerald-500/20' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 ring-1 ring-white/10')
                    : (isDark ? 'bg-transparent text-slate-600 hover:bg-white/5 hover:text-white' : 'bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-900')
                }`}
                style={{ transitionDelay: `${mobileMenuOpen ? idx * 80 : 0}ms` }}
              >
                <div className="flex items-center gap-4">
                  <Icon className={`w-8 h-8 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  <span className="text-3xl font-bold tracking-tight">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-6 h-6 text-emerald-400" />}
              </Link>
            );
          })}
        </div>

        {user ? (
          <div className="p-8 relative z-10">
            <div className={`app-navbar__usercard p-6 rounded-[2rem] border flex items-center justify-between gap-3 flex-wrap transition-colors ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm shrink-0 border transition-colors ${isDark ? 'bg-[#0a0f0d] border-white/10' : 'bg-white border-slate-200'}`}>
                  <User className={`w-6 h-6 ${isDark ? 'text-slate-500' : 'text-slate-700'}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-700' : 'text-slate-400'}`}>Signed in as</p>
                  <p className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.full_name || 'Explorer'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'}`}
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 relative z-10">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-4 rounded-[2rem] bg-gradient-to-br from-emerald-600 to-emerald-800 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-emerald-900/25"
            >
              Sign In / Register
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;
