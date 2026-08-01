import { useState, useEffect, useRef, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReminderStatus = 'pending' | 'completed' | 'failed';

export interface ScheduledReminder {
  id: string;
  stepIndex: number;
  stepText: string;
  stepLabel: string;
  accentColor: string;
  remindAt: number;
  fired: boolean;
  emailSent: boolean;
  status: ReminderStatus;
  wordName?: string;
  entryId?: string;
  failReason?: string;
  completedAt?: number;
}

// ── Module-level singletons ───────────────────────────────────────────────────
// These are shared across ALL hook instances in the same browser tab.

/** Prevents the same reminder email from being sent more than once per session. */
const _emailedIds = new Set<string>();

/**
 * Only ONE hook instance should fire toasts — the NotificationPortal's instance.
 * We claim "ownership" the first time the hook mounts. All other instances
 * (Navbar, RemindersPage) are read-only for the toastQueue.
 *
 * We track this with a counter: the first instance to mount gets id=1 (owner).
 * Subsequent instances get id=2, 3, etc. and never touch toastQueue.
 */
let _instanceCounter = 0;

// ── User-scoped storage ───────────────────────────────────────────────────────

const KEY_PREFIX  = 'emolit_reminders_v2';
const SYNC_EVENT  = 'emolit:reminders_sync';

function getCurrentUserKey(): string {
  try {
    const raw = localStorage.getItem('auth_user');
    if (raw) {
      const { email } = JSON.parse(raw) as { email?: string };
      if (email) return `${KEY_PREFIX}_${email.toLowerCase()}`;
    }
  } catch {}
  return `${KEY_PREFIX}_anonymous`;
}

function loadReminders(): ScheduledReminder[] {
  try {
    const raw = JSON.parse(
      localStorage.getItem(getCurrentUserKey()) ?? '[]',
    ) as Partial<ScheduledReminder>[];
    return raw.map(r => ({ status: 'pending' as ReminderStatus, ...r } as ScheduledReminder));
  } catch {
    return [];
  }
}

function saveReminders(list: ScheduledReminder[]) {
  localStorage.setItem(getCurrentUserKey(), JSON.stringify(list));
  // Broadcast to other instances so they stay in sync (read-only reload).
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

// ── API helper ────────────────────────────────────────────────────────────────

const API_BASE = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8005' : ''
);

async function callSendEmailReminder(stepText: string, stepNumber: number): Promise<boolean> {
  // Always read the freshest token — AuthContext refreshes it every 55 min.
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.warn('📧 No auth token — skipping reminder email');
    return false;
  }
  try {
    const res = await fetch(`${API_BASE}/api/notifications/send-email-reminder`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({ step_text: stepText, step_number: stepNumber }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('📧 Email API error:', res.status, err);
      return false;
    }
    console.log(`📧 Reminder email sent for step ${stepNumber}`);
    return true;
  } catch (err) {
    console.error('📧 Reminder email network error:', err);
    return false;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotification() {
  // Claim instance ID once per mount (stable across re-renders via ref).
  const instanceIdRef = useRef<number>(0);
  if (instanceIdRef.current === 0) {
    _instanceCounter += 1;
    instanceIdRef.current = _instanceCounter;
  }
  // Only the FIRST mounted instance (id === 1) drives the toastQueue.
  // In practice this is the NotificationPortal in App.tsx which mounts first.
  const isOwner = instanceIdRef.current === 1;

  const [reminders,   setReminders]   = useState<ScheduledReminder[]>(loadReminders);
  const [toastQueue,  setToastQueue]  = useState<ScheduledReminder[]>([]);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadedKeyRef  = useRef<string>(getCurrentUserKey());

  // ── Persist: only this instance's writes should trigger a save.
  // We use a ref flag to suppress the persist that would fire when
  // we ourselves receive a SYNC_EVENT and reload from storage — 
  // that would create a circular storm (load→save→SYNC→load→save…).
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (isSyncingRef.current) return; // skip: we just loaded from storage
    saveReminders(reminders);
  }, [reminders]);

  // ── Re-sync when another instance writes ─────────────────────────────────
  useEffect(() => {
    const sync = () => {
      isSyncingRef.current = true;
      setReminders(loadReminders());
      // Allow future local changes to persist again after this render cycle.
      setTimeout(() => { isSyncingRef.current = false; }, 0);
    };
    window.addEventListener(SYNC_EVENT, sync);
    return () => window.removeEventListener(SYNC_EVENT, sync);
  }, []);

  // ── schedule ─────────────────────────────────────────────────────────────
  const schedule = useCallback((
    stepIndex:   number,
    stepText:    string,
    stepLabel:   string,
    accentColor: string,
    delayMs:     number,
    wordName?:   string,
    entryId?:    string,
  ) => {
    const id = `emolit_r_${Date.now()}_${stepIndex}`;
    const newReminder: ScheduledReminder = {
      id, stepIndex, stepText, stepLabel, accentColor,
      remindAt:  Date.now() + delayMs,
      fired:     false,
      emailSent: false,
      status:    'pending',
      wordName,
      entryId,
    };
    setReminders(prev => {
      // Deduplicate only for the EXACT same step text and entry ID
      const filtered = prev.filter(r =>
        !(r.stepIndex === stepIndex && r.stepText === stepText && (!entryId || r.entryId === entryId) && r.status === 'pending' && !r.fired),
      );
      return [...filtered, newReminder];
    });
    return id;
  }, []);

  // ── cancel ────────────────────────────────────────────────────────────────
  const cancel = useCallback((stepIndex: number, stepText?: string, entryId?: string) => {
    setReminders(prev =>
      prev.filter(r => !(
        r.stepIndex === stepIndex &&
        (!stepText || r.stepText === stepText) &&
        (!entryId || r.entryId === entryId) &&
        !r.fired &&
        r.status === 'pending'
      )),
    );
  }, []);

  // ── markComplete ─────────────────────────────────────────────────────────
  const markComplete = useCallback((id: string) => {
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'completed', completedAt: Date.now() } : r),
    );
  }, []);

  // ── markFailed ───────────────────────────────────────────────────────────
  const markFailed = useCallback((id: string, reason: string) => {
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'failed', failReason: reason } : r),
    );
  }, []);

  // ── dismissToast ─────────────────────────────────────────────────────────
  const dismissToast = useCallback(() => {
    setToastQueue(prev => prev.slice(1));
  }, []);

  // ── Poller: check every second ────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      const now       = Date.now();
      const isVisible = document.visibilityState === 'visible';

      // Auth-change guard
      const currentKey = getCurrentUserKey();
      if (currentKey !== loadedKeyRef.current) {
        loadedKeyRef.current = currentKey;
        isSyncingRef.current = true;
        setReminders(loadReminders());
        setTimeout(() => { isSyncingRef.current = false; }, 0);
        setToastQueue([]);
        return;
      }

      // Collect what needs to fire OUTSIDE the state updater (no side-effects inside).
      const toFire:  ScheduledReminder[] = [];
      const toEmail: ScheduledReminder[] = [];

      setReminders(prev => {
        let changed = false;
        const updated = prev.map(r => {
          if (!r.fired && r.status === 'pending' && now >= r.remindAt) {
            changed = true;
            // Email: send regardless of visibility
            if (!r.emailSent && !_emailedIds.has(r.id)) {
              toEmail.push(r);
            }
            // Toast: only if tab is visible AND we are the owner instance
            if (isVisible && isOwner) {
              toFire.push(r);
            }
            return { ...r, fired: true, emailSent: true };
          }
          return r;
        });
        return changed ? updated : prev;
      });

      // Send emails — deduped via module-level Set
      for (const r of toEmail) {
        _emailedIds.add(r.id);
        callSendEmailReminder(r.stepText, r.stepIndex + 1);
      }

      // Show toasts — only the owner instance does this
      if (isOwner && toFire.length > 0) {
        setToastQueue(q => {
          const existingIds = new Set(q.map(t => t.id));
          const fresh = toFire.filter(t => !existingIds.has(t.id));
          return fresh.length > 0 ? [...q, ...fresh] : q;
        });
      }
    };

    intervalRef.current = setInterval(check, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  // ── Visibility change: email if tab hides while reminder is soon ──────────
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState !== 'hidden') return;
      const BUFFER = 5 * 60 * 1000;
      const now    = Date.now();

      const toVisibilityEmail: ScheduledReminder[] = [];

      setReminders(prev => {
        let changed = false;
        const updated = prev.map(r => {
          if (
            !r.fired && !r.emailSent && !_emailedIds.has(r.id) &&
            r.status === 'pending' && (r.remindAt - now) < BUFFER
          ) {
            toVisibilityEmail.push(r);
            changed = true;
            return { ...r, emailSent: true };
          }
          return r;
        });
        return changed ? updated : prev;
      });

      for (const r of toVisibilityEmail) {
        _emailedIds.add(r.id);
        callSendEmailReminder(r.stepText, r.stepIndex + 1);
      }
    };

    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  // stepText is required to avoid matching the same stepIndex from a DIFFERENT journal entry
  const getReminder = useCallback(
    (stepIndex: number, stepText: string, entryId?: string) =>
      reminders.find(r =>
        r.stepIndex === stepIndex &&
        r.stepText === stepText &&
        (!entryId || r.entryId === entryId) &&
        !r.fired &&
        r.status === 'pending'
      ) ?? null,
    [reminders],
  );

  // ── sendEmail (manual trigger) ────────────────────────────────────────────
  const sendEmail = useCallback(async (reminder: ScheduledReminder): Promise<boolean> => {
    const ok = await callSendEmailReminder(reminder.stepText, reminder.stepIndex + 1);
    if (ok) {
      setReminders(prev =>
        prev.map(r => r.id === reminder.id ? { ...r, emailSent: true } : r),
      );
    }
    return ok;
  }, []);

  const pendingCount = reminders.filter(r => !r.fired && r.status === 'pending').length;
  const dueCount     = reminders.filter(r =>  r.fired && r.status === 'pending').length;
  const activeToast  = toastQueue[0] ?? null;

  return {
    schedule, cancel, markComplete, markFailed, sendEmail,
    dismissToast, activeToast,
    getReminder,
    allReminders: reminders,
    pendingCount,
    dueCount,
    urgentCount: pendingCount + dueCount,
  };
}
