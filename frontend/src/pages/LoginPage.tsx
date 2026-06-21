import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Mail, Lock, User, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import './login-page.css';

type PageMode = 'login' | 'register' | 'forgot' | 'otp' | 'reset';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login, register, isAuthenticated, isLoading,
    pendingEmail,
    resendVerification,
    sendPasswordResetOtp,
    verifyOtp,
    resetPassword,
  } = useAuth();
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorGlowRef = useRef<HTMLDivElement>(null);
  const particleRafRef = useRef(0);
  const justLoggedIn = useRef(false);

  // ── Page mode & form state ─────────────────────────────────────────────────
  const [mode, setMode] = useState<PageMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verification pending (after login with unverified email)
  const [verifyPending, setVerifyPending] = useState(false);
  const [verifyPendingEmail, setVerifyPendingEmail] = useState('');

  // Forgot password flow state
  const [resetEmail, setResetEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // OTP refs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Redirect if already authenticated ─────────────────────────────────────
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (justLoggedIn.current) return;
      const from = (location.state as any)?.from?.pathname || '/home';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  // ── Resend cooldown timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // ── Dark-mode particle canvas ──────────────────────────────────────────────
  useEffect(() => {
    if (!isDark) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    const particles = Array.from({ length: 64 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      r: 1.2 + Math.random() * 1.4, opacity: 0.12 + Math.random() * 0.38,
    }));
    const pColor = '82,183,136';
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pColor},${p.opacity})`; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${pColor},${0.07 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      particleRafRef.current = requestAnimationFrame(draw);
    };
    particleRafRef.current = requestAnimationFrame(draw);
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(particleRafRef.current); };
  }, [isDark]);

  useEffect(() => {
    if (!isDark) return;
    const el = cursorGlowRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => { el.style.left = `${e.clientX}px`; el.style.top = `${e.clientY}px`; };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [isDark]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const clearMessages = () => { setError(null); setMessage(null); };

  const goToLogin = () => {
    setMode('login');
    setVerifyPending(false);
    setOtpDigits(['', '', '', '', '', '']);
    setResetEmail('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    clearMessages();
  };

  const goToRegister = () => { setMode('register'); clearMessages(); };

  const goToForgot = () => { setMode('forgot'); setResetEmail(email); clearMessages(); };

  // ── OTP input handling ─────────────────────────────────────────────────────
  const handleOtpChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtpDigits(prev => {
      const next = [...prev]; next[index] = digit; return next;
    });
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }, []);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        setOtpDigits(prev => { const next = [...prev]; next[index] = ''; return next; });
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    }
  }, [otpDigits]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const digits = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtpDigits(digits);
    if (pasted.length > 0) otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }, []);

  // ── Submit handlers ────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      justLoggedIn.current = true;
      await login(email, password);
      const from = (location.state as any)?.from?.pathname || '/home';
      navigate('/welcome', { replace: true, state: { from } });
    } catch (err: any) {
      justLoggedIn.current = false;
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setVerifyPending(true);
        setVerifyPendingEmail(email);
        setResendCooldown(60);
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await register(email, password, fullName);
      setMessage('Verification email sent! Please check your inbox (and spam folder).');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await sendPasswordResetOtp(resetEmail);
      setMode('otp');
      setMessage(`A 6-digit code was sent to ${resetEmail}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) { setError('Please enter all 6 digits.'); return; }
    clearMessages();
    setLoading(true);
    try {
      const token = await verifyOtp(resetEmail, otp);
      setResetToken(token);
      setMode('reset');
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (newPassword !== confirmPassword) { setError("Passwords don't match."); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await resetPassword(resetToken, resetEmail, newPassword);
      setMode('login');
      setEmail(resetEmail);
      setPassword('');
      setMessage('Password updated! Please sign in with your new password.');
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    clearMessages();
    try {
      await resendVerification();
      setMessage('Verification email resent! Check your inbox and spam folder.');
      setResendCooldown(60);
    } catch {
      setError('Could not resend email. Please try again in a moment.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    clearMessages();
    setLoading(true);
    try {
      await sendPasswordResetOtp(resetEmail);
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      setMessage('New code sent! Check your email.');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="login-shell login-shell--loading">
        <div className="login-shell__ambient" aria-hidden />
        <Loader2 className="login-shell__spinner" aria-label="Loading" />
      </div>
    );
  }

  // ── Rail position: right for register/forgot/otp/reset, left for login ─────
  const railRight = mode === 'register' || mode === 'forgot' || mode === 'otp' || mode === 'reset';

  return (
    <div className="login-shell">
      <div className="login-shell__ambient" aria-hidden />
      <div className="login-shell__grid" aria-hidden />
      <div className="login-shell__noise" aria-hidden />
      {isDark && (
        <>
          <div className="login-fx-cursor" ref={cursorGlowRef} aria-hidden />
          <canvas className="login-fx-canvas" ref={canvasRef} />
        </>
      )}

      <div className="login-shell__toggle">
        <ThemeToggle />
      </div>

      <div className="login-card">
        <div className="login-card__inner">
          {/* Mobile tabs */}
          <div className="login-mobile-tabs">
            <button type="button" className={mode === 'login' || verifyPending ? 'is-active' : ''} onClick={goToLogin}>
              Sign in
            </button>
            <button type="button" className={mode === 'register' ? 'is-active' : ''} onClick={goToRegister}>
              Join
            </button>
          </div>

          {/* ── Register column ─────────────────────────────────────────── */}
          <div
            className={[
              'login-col login-col--register',
              mode === 'register' ? 'login-col--mobile-active' : '',
              mode === 'register' ? 'login-col--visible-md' : 'login-col--hidden-md',
            ].filter(Boolean).join(' ')}
          >
            <div className="login-head" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Emolit Logo" style={{ width: '4rem', height: '4rem', margin: '0 auto 0.75rem', display: 'block', objectFit: 'contain' }} />
              <h1 className="login-head__title">
                <span className="login-gradient-text" style={{ display: 'inline-block', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)' }}>Sign up</span>
              </h1>
              <p className="login-head__sub">A premium space to journal, map patterns, and own your inner weather.</p>
            </div>

            <form className="login-form" onSubmit={handleRegisterSubmit}>
              <div className="login-field">
                <label className="login-label" htmlFor="reg-name">Full name</label>
                <div className="login-input-wrap">
                  <User aria-hidden />
                  <input id="reg-name" className="login-input" type="text" required autoComplete="name" placeholder="Alex Morgan" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
              </div>
              <div className="login-field">
                <label className="login-label" htmlFor="reg-email">Email</label>
                <div className="login-input-wrap">
                  <Mail aria-hidden />
                  <input id="reg-email" className="login-input" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="login-field">
                <label className="login-label" htmlFor="reg-password">Password</label>
                <div className="login-input-wrap">
                  <Lock aria-hidden />
                  <input id="reg-password" className="login-input" type="password" required autoComplete="new-password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>

              {error && mode === 'register' && <div className="login-alert login-alert--error">{error}</div>}
              {message && mode === 'register' && <div className="login-alert login-alert--success">{message}</div>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <Loader2 className="login-btn__spin" aria-hidden /> : null}
                {loading ? 'Please wait…' : 'Sign up'}
              </button>
            </form>

            <div className="login-footer">
              Already have an account?{' '}
              <button type="button" className="login-link" onClick={goToLogin}>Login</button>
            </div>
          </div>

          {/* ── Forgot Password column ──────────────────────────────────── */}
          <div
            className={[
              'login-col login-col--register',
              mode === 'forgot' ? 'login-col--mobile-active' : '',
              mode === 'forgot' ? 'login-col--visible-md' : 'login-col--hidden-md',
            ].filter(Boolean).join(' ')}
          >
            <div className="login-head" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Emolit Logo" style={{ width: '4rem', height: '4rem', margin: '0 auto 0.75rem', display: 'block', objectFit: 'contain' }} />
              <h1 className="login-head__title">
                <span className="login-gradient-text" style={{ display: 'inline-block', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)' }}>Reset</span>
              </h1>
              <p className="login-head__sub">Enter your email and we'll send you a 6-digit reset code.</p>
            </div>

            <form className="login-form" onSubmit={handleForgotSubmit}>
              <div className="login-field">
                <label className="login-label" htmlFor="forgot-email">Email</label>
                <div className="login-input-wrap">
                  <Mail aria-hidden />
                  <input id="forgot-email" className="login-input" type="email" required autoComplete="email" placeholder="you@example.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                </div>
              </div>

              {error && mode === 'forgot' && <div className="login-alert login-alert--error">{error}</div>}
              {message && mode === 'forgot' && <div className="login-alert login-alert--success">{message}</div>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <Loader2 className="login-btn__spin" aria-hidden /> : null}
                {loading ? 'Sending…' : 'Send Reset Code'}
              </button>
            </form>

            <div className="login-footer">
              <button type="button" className="login-link login-back-link" onClick={goToLogin}>
                <ArrowLeft size={14} /> Back to Login
              </button>
            </div>
          </div>

          {/* ── OTP Verification column ──────────────────────────────────── */}
          <div
            className={[
              'login-col login-col--register',
              mode === 'otp' ? 'login-col--mobile-active' : '',
              mode === 'otp' ? 'login-col--visible-md' : 'login-col--hidden-md',
            ].filter(Boolean).join(' ')}
          >
            <div className="login-head" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Emolit Logo" style={{ width: '4rem', height: '4rem', margin: '0 auto 0.75rem', display: 'block', objectFit: 'contain' }} />
              <h1 className="login-head__title">
                <span className="login-gradient-text" style={{ display: 'inline-block', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)' }}>Enter Code</span>
              </h1>
              <p className="login-head__sub">We sent a 6-digit code to <strong>{resetEmail}</strong></p>
            </div>

            <form className="login-form" onSubmit={handleOtpSubmit}>
              <div className="login-otp-wrap">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    id={`otp-box-${i}`}
                    className="login-otp-box"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    autoFocus={i === 0}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              {error && mode === 'otp' && <div className="login-alert login-alert--error">{error}</div>}
              {message && mode === 'otp' && <div className="login-alert login-alert--success">{message}</div>}

              <button type="submit" className="login-btn" disabled={loading || otpDigits.join('').length < 6}>
                {loading ? <Loader2 className="login-btn__spin" aria-hidden /> : null}
                {loading ? 'Verifying…' : 'Verify Code'}
              </button>
            </form>

            <div className="login-footer" style={{ flexDirection: 'column', gap: '0.5rem' }}>
              <span>
                Didn't get the code?{' '}
                <button type="button" className="login-link" onClick={handleResendOtp} disabled={resendCooldown > 0 || loading}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                </button>
              </span>
              <button type="button" className="login-link login-back-link" onClick={goToForgot}>
                <ArrowLeft size={14} /> Change email
              </button>
            </div>
          </div>

          {/* ── New Password column ──────────────────────────────────────── */}
          <div
            className={[
              'login-col login-col--register',
              mode === 'reset' ? 'login-col--mobile-active' : '',
              mode === 'reset' ? 'login-col--visible-md' : 'login-col--hidden-md',
            ].filter(Boolean).join(' ')}
          >
            <div className="login-head" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Emolit Logo" style={{ width: '4rem', height: '4rem', margin: '0 auto 0.75rem', display: 'block', objectFit: 'contain' }} />
              <h1 className="login-head__title">
                <span className="login-gradient-text" style={{ display: 'inline-block', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)' }}>New Password</span>
              </h1>
              <p className="login-head__sub">Choose a strong password for your account.</p>
            </div>

            <form className="login-form" onSubmit={handleResetSubmit}>
              <div className="login-field">
                <label className="login-label" htmlFor="new-password">New Password</label>
                <div className="login-input-wrap">
                  <Lock aria-hidden />
                  <input id="new-password" className="login-input" type="password" required autoComplete="new-password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
              </div>
              <div className="login-field">
                <label className="login-label" htmlFor="confirm-password">Confirm Password</label>
                <div className="login-input-wrap">
                  <Lock aria-hidden />
                  <input id="confirm-password" className="login-input" type="password" required autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
              </div>

              {error && mode === 'reset' && <div className="login-alert login-alert--error">{error}</div>}
              {message && mode === 'reset' && <div className="login-alert login-alert--success">{message}</div>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <Loader2 className="login-btn__spin" aria-hidden /> : null}
                {loading ? 'Saving…' : 'Save New Password'}
              </button>
            </form>
          </div>

          {/* ── Login column ─────────────────────────────────────────────── */}
          <div
            className={[
              'login-col login-col--login',
              (mode === 'login') ? 'login-col--mobile-active' : '',
              (mode === 'login') ? 'login-col--visible-md' : 'login-col--hidden-md',
            ].filter(Boolean).join(' ')}
          >
            {/* ── Verify-Pending banner (replaces form after unverified login) ── */}
            {verifyPending ? (
              <div className="login-verify-pending">
                <div className="login-verify-pending__icon" aria-hidden>✉️</div>
                <h2 className="login-verify-pending__title">Verify your email</h2>
                <p className="login-verify-pending__sub">
                  Your account isn't verified yet. We sent a link to{' '}
                  <strong className="login-verify-pending__email">{verifyPendingEmail || pendingEmail}</strong>.
                  Check your inbox and spam folder.
                </p>

                {error && <div className="login-alert login-alert--error" style={{ marginBottom: '1rem' }}>{error}</div>}
                {message && <div className="login-alert login-alert--success" style={{ marginBottom: '1rem' }}>{message}</div>}

                <button
                  type="button"
                  className="login-btn login-resend-btn"
                  onClick={handleResendVerification}
                  disabled={resendCooldown > 0 || resendLoading}
                >
                  {resendLoading ? <Loader2 className="login-btn__spin" aria-hidden /> : null}
                  {resendLoading
                    ? 'Sending…'
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Verification Email'}
                </button>

                <button type="button" className="login-link login-back-link" style={{ marginTop: '1rem', display: 'inline-flex' }} onClick={goToLogin}>
                  <ArrowLeft size={14} /> Try a different account
                </button>
              </div>
            ) : (
              <>
                <div className="login-head" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Emolit Logo" style={{ width: '4rem', height: '4rem', margin: '0 auto 0.75rem', display: 'block', objectFit: 'contain' }} />
                  <h1 className="login-head__title">
                    <span className="login-gradient-text" style={{ display: 'inline-block', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)' }}>Login</span>
                  </h1>
                  <p className="login-head__sub">Step into your calm, data-rich sanctuary for emotional clarity.</p>
                </div>

                <form className="login-form" onSubmit={handleLoginSubmit}>
                  <div className="login-field">
                    <label className="login-label" htmlFor="in-email">Email</label>
                    <div className="login-input-wrap">
                      <Mail aria-hidden />
                      <input id="in-email" className="login-input" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="login-field">
                    <div className="login-label-row">
                      <label className="login-label" htmlFor="in-password">Password</label>
                      <button type="button" className="login-link login-forgot-link" onClick={goToForgot}>
                        Forgot password?
                      </button>
                    </div>
                    <div className="login-input-wrap">
                      <Lock aria-hidden />
                      <input id="in-password" className="login-input" type="password" required autoComplete="current-password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                  </div>

                  {error && mode === 'login' && <div className="login-alert login-alert--error">{error}</div>}
                  {message && mode === 'login' && <div className="login-alert login-alert--success">{message}</div>}

                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? <Loader2 className="login-btn__spin" aria-hidden /> : null}
                    {loading ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>

                <div className="login-footer">
                  New here?
                  <button type="button" className="login-link" onClick={goToRegister}>Create account</button>
                </div>
              </>
            )}
          </div>

          {/* ── Desktop sliding brand rail ────────────────────────────────── */}
          <div className={`login-rail ${railRight ? 'login-rail--register' : 'login-rail--login'}`}>
            <div className="login-rail__bg" />
            <div className="login-rail__orb login-rail__orb--a" />
            <div className="login-rail__orb login-rail__orb--b" />
            <div className="login-rail__mesh" />
            <div className="login-rail__content" style={{ padding: 0 }}>
              <video
                src={`${process.env.PUBLIC_URL}/verify_mail.mp4`}
                autoPlay loop muted playsInline
                className="login-rail__blend-video"
                style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
