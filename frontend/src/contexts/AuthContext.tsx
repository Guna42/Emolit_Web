import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase';


const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:8005';

/**
 * Calls our backend which:
 * 1. Uses firebase-admin to generate the verification link
 * 2. Sends the beautiful branded Gmail email with that link
 *
 * We do NOT call Firebase's sendEmailVerification() at all anymore —
 * that's what was sending the ugly spam email from firebaseapp.com.
 */
async function sendBrandedVerificationEmail(user: FirebaseUser): Promise<void> {
  const continueUrl = `${window.location.origin}/emolit/email-verified`;

  const res = await fetch(`${API_BASE}/api/auth/generate-and-send-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      continue_url: continueUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('❌ Backend verification email failed:', err);
    throw new Error('Backend email failed');
  } else {
    const data = await res.json().catch(() => ({}));
    if (!data.sent) {
      throw new Error('SMTP not configured');
    }
    console.log('✅ Beautiful branded verification email sent!');
  }
}


// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  email: string;
  full_name?: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;   // kept for backward compat with any UI reading it
  isAuthenticated: boolean;
  isLoading: boolean;
  // auth state only set AFTER email is verified:
  pendingVerification: boolean;
  pendingEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<void>;
  // Forgot-password OTP flow:
  sendPasswordResetOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<string>;
  resetPassword: (resetToken: string, email: string, newPassword: string) => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

// ── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken]               = useState<string | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  // "pending" state: user registered but hasn't verified email yet
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingEmail, setPendingEmail]               = useState<string | null>(null);

  // ── Listen to Firebase auth state ─────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.emailVerified) {
        // Get fresh ID token — Firebase auto-refreshes if expired
        const idToken = await fbUser.getIdToken();
        setFirebaseUser(fbUser);
        setToken(idToken);
        localStorage.setItem('auth_token', idToken);
        localStorage.setItem('auth_user', JSON.stringify({
          email: fbUser.email,
          full_name: fbUser.displayName ?? null,
          emailVerified: true,
        }));
      } else {
        // Not verified or logged out — clear everything
        setFirebaseUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      setIsLoading(false);
    });

    // Refresh ID token every 55 min (Firebase tokens expire at 60 min)
    const refreshInterval = setInterval(async () => {
      const u = auth.currentUser;
      if (u) {
        const freshToken = await u.getIdToken(true);
        setToken(freshToken);
        localStorage.setItem('auth_token', freshToken);
      }
    }, 55 * 60 * 1000);

    return () => { unsub(); clearInterval(refreshInterval); };
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!cred.user.emailVerified) {
      // Sign out so they can't use the app; show verification prompt
      await signOut(auth);
      setPendingEmail(email);
      setPendingVerification(true);
      throw new Error('EMAIL_NOT_VERIFIED');
    }
    // onAuthStateChanged fires and sets everything else
  };

  // ── Register ─────────────────────────────────────────────────────────────
  const register = async (email: string, password: string, _fullName?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // STEP 1: Always send Firebase's built-in verification email first (guaranteed delivery)
    // This ensures at least one email arrives even if our SMTP is down.
    try {
      await sendEmailVerification(cred.user, {
        url: `${window.location.origin}/emolit/email-verified`,
      });
      console.log('✅ Firebase verification email sent (guaranteed delivery)');
    } catch (e) {
      console.error('Firebase sendEmailVerification failed:', e);
    }

    // STEP 2: Also try our beautiful branded email (non-blocking, best-effort)
    sendBrandedVerificationEmail(cred.user).catch(e =>
      console.log('ℹ️ Branded email skipped (Firebase email already sent):', e)
    );

    // Sign out immediately — they must verify first
    await signOut(auth);
    setPendingEmail(email);
    setPendingVerification(true);
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setPendingVerification(false);
    setPendingEmail(null);
  };

  // ── Resend verification email ─────────────────────────────────────────────
  // Works after signOut by using pendingEmail with the backend (firebase-admin
  // generates the link server-side, no client session needed).
  const resendVerification = async () => {
    const emailToUse = pendingEmail || auth.currentUser?.email;
    if (!emailToUse) throw new Error('No email available for resend');

    const continueUrl = `${window.location.origin}/emolit/email-verified`;

    const res = await fetch(`${API_BASE}/api/auth/generate-and-send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailToUse, continue_url: continueUrl }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.sent) {
      throw new Error('Failed to resend verification email. Please try again later.');
    }
  };

  // ── Forgot Password: Send OTP ─────────────────────────────────────────────
  const sendPasswordResetOtp = async (email: string) => {
    const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Failed to send reset code');
  };

  // ── Forgot Password: Verify OTP → returns reset token ────────────────────
  const verifyOtp = async (email: string, otp: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Invalid code');
    return data.reset_token as string;
  };

  // ── Forgot Password: Reset with token ────────────────────────────────────
  const resetPassword = async (resetToken: string, email: string, newPassword: string) => {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset_token: resetToken, email, new_password: newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Password reset failed');
  };

  // ── Derived user object ───────────────────────────────────────────────────
  const user: AuthUser | null = firebaseUser
    ? { email: firebaseUser.email!, full_name: firebaseUser.displayName ?? null, emailVerified: true }
    : null;

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      token,
      isAuthenticated: !!firebaseUser && firebaseUser.emailVerified,
      isLoading,
      pendingVerification,
      pendingEmail,
      login,
      register,
      logout,
      resendVerification,
      sendPasswordResetOtp,
      verifyOtp,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
