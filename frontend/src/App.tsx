import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import { NudgeToast } from './components/NudgeToast';
import { useNotification } from './hooks/useNotification';
import HomePage from './pages/HomePage';
import WordDetailPage from './pages/WordDetailPage';
import SearchPage from './pages/SearchPage';
import JournalPage from './pages/JournalPage';
import JournalHistoryPage from './pages/JournalHistoryPage';
import CalendarPage from './pages/CalendarPage';
import RemindersPage from './pages/RemindersPage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import EmailVerifiedPage from './pages/EmailVerifiedPage';
import WelcomeSplashPage from './pages/WelcomeSplashPage';
import NotFoundPage from './pages/NotFoundPage';
import './index.css';
import './dark-theme.css';

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <div className="min-h-screen mirror-bg">
      <Navbar />
      <main className="relative z-10">{children}</main>
    </div>
  </ProtectedRoute>
);

/**
 * This is the SOLE consumer of useNotification that drives toasts.
 * It must mount BEFORE any other component that calls useNotification
 * (Navbar, RemindersPage) so it claims instanceId=1 (the "owner").
 *
 * It is placed as the very first child inside <Router> so React renders
 * it before the <Routes> subtree (which contains Navbar and the pages).
 */
function NotificationPortal() {
  const { activeToast, dismissToast, markComplete, markFailed } = useNotification();
  if (!activeToast) return null;
  return (
    <NudgeToast
      reminder={activeToast}
      onDismiss={dismissToast}
      onComplete={markComplete}
      onFailed={markFailed}
    />
  );
}

function AppContent() {
  return (
    <Router basename="/emolit">
      {/* 
        NotificationPortal MUST be first — it claims the "owner" slot in 
        useNotification so only it fires toasts. Do not move this below <Routes>.
      */}
      <NotificationPortal />

      <Routes>
        {/* Public */}
        <Route path="/"               element={<LandingPage />} />
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/email-verified" element={<EmailVerifiedPage />} />
        <Route path="/welcome"        element={<ProtectedRoute><WelcomeSplashPage /></ProtectedRoute>} />

        {/* Protected */}
        <Route path="/home"           element={<Protected><HomePage /></Protected>} />
        <Route path="/calendar"       element={<Protected><CalendarPage /></Protected>} />
        <Route path="/word/:wordName" element={<Protected><WordDetailPage /></Protected>} />
        <Route path="/search"         element={<Protected><SearchPage /></Protected>} />
        <Route path="/journal"        element={<Protected><JournalPage /></Protected>} />
        <Route path="/journal/history" element={<Protected><JournalHistoryPage /></Protected>} />
        <Route path="/reminders"      element={<Protected><RemindersPage /></Protected>} />
        <Route path="/explore"        element={<Navigate to="/search" replace />} />
        <Route path="*"               element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
