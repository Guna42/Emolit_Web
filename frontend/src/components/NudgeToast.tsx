import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Bell, Check, Frown, Send, ArrowLeft, Sparkles } from 'lucide-react';
import { ScheduledReminder } from '../hooks/useNotification';
import { useTheme } from '../contexts/ThemeContext';

interface NudgeToastProps {
  reminder: ScheduledReminder;
  onDismiss: () => void;
  onComplete: (id: string) => void;
  onFailed:  (id: string, reason: string) => void;
}

const DURATION = 14_000;

function toRgb(hex: string) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

const KF = `
  @keyframes nt-in  { 0%{transform:translateX(calc(100% + 40px)) scale(.92);opacity:0} 60%{transform:translateX(-5px) scale(1.01);opacity:1} 100%{transform:translateX(0) scale(1);opacity:1} }
  @keyframes nt-out { 0%{transform:translateX(0) scale(1);opacity:1} 100%{transform:translateX(calc(100% + 40px)) scale(.94);opacity:0} }
  @keyframes nt-ring { 0%,100%{transform:rotate(0) scale(1)} 12%{transform:rotate(-22deg) scale(1.14)} 28%{transform:rotate(18deg) scale(1.14)} 44%{transform:rotate(-11deg) scale(1.07)} 60%{transform:rotate(7deg) scale(1.04)} 75%{transform:rotate(-3deg)} }
  @keyframes nt-outer-ring { 0%{transform:scale(.88);opacity:.6} 65%{transform:scale(2);opacity:0} 100%{transform:scale(.88);opacity:0} }
  @keyframes nt-inner-ring { 0%{transform:scale(.92);opacity:.4} 65%{transform:scale(1.55);opacity:0} 100%{transform:scale(.92);opacity:0} }
  @keyframes nt-bar { from{width:100%} to{width:0%} }
  @keyframes nt-row-in { from{transform:translateY(8px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes nt-swap { from{transform:translateX(14px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes nt-glow { 0%,100%{opacity:.4} 50%{opacity:.85} }
  .nt-x:hover { background:rgba(255,255,255,.14) !important; transform:rotate(90deg) scale(1.1); }
  .nt-x { transition:all .18s; }
  .nt-b { transition:all .2s cubic-bezier(.16,1,.3,1); border:none; cursor:pointer; }
  .nt-b:hover { transform:translateY(-2px) scale(1.04); }
  .nt-b:active { transform:scale(.96); }
  .nt-ghost { transition:all .18s; background:none; border:none; cursor:pointer; }
  .nt-ghost:hover { opacity:.75; }
  .nt-ta { transition:border-color .15s; }
  .nt-ta:focus { outline:none; }
`;

export const NudgeToast: React.FC<NudgeToastProps> = ({ reminder, onDismiss, onComplete, onFailed }) => {
  const { isDark } = useTheme();
  const navigate   = useNavigate();
  const [phase, setPhase]   = useState<'enter'|'show'|'exit'>('enter');
  const [view,  setView]    = useState<'default'|'fail'>('default');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const doneRef   = useRef(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout>|null>(null);

  const accent = reminder.accentColor || '#52b788';
  const rgb    = toRgb(accent);

  useEffect(() => { const af = requestAnimationFrame(() => setPhase('show')); return () => cancelAnimationFrame(af); }, []);

  const dismiss = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase('exit');
    setTimeout(onDismiss, 460);
  }, [onDismiss]);

  const arm = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(dismiss, DURATION);
  }, [dismiss]);

  useEffect(() => { arm(); return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, [arm]);

  const handleDone = useCallback(() => {
    onComplete(reminder.id);
    dismiss();
    setTimeout(() => navigate('/journal'), 460);
  }, [onComplete, reminder.id, dismiss, navigate]);

  const handleFailView = useCallback(() => { if (timerRef.current) clearTimeout(timerRef.current); setView('fail'); }, []);
  const handleBack     = useCallback(() => { setView('default'); arm(); }, [arm]);
  const handleSubmit   = useCallback(() => {
    if (!reason.trim()) return;
    setSaving(true);
    onFailed(reminder.id, reason.trim());
    setTimeout(dismiss, 350);
  }, [reason, onFailed, reminder.id, dismiss]);

  const anim = phase === 'exit' ? 'nt-out .46s cubic-bezier(.4,0,1,1) forwards'
             : phase === 'show' ? 'nt-in .62s cubic-bezier(.16,1,.3,1) forwards'
             : 'none';

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const bg      = isDark ? 'rgba(6,9,15,0.97)'         : 'rgba(255,255,255,0.98)';
  const border  = isDark ? `rgba(${rgb},.2)`             : `rgba(${rgb},.2)`;
  const shadow  = isDark
    ? `0 28px 72px rgba(0,0,0,.7), 0 0 0 1px rgba(${rgb},.07), 0 0 40px rgba(${rgb},.1)`
    : `0 20px 56px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06), 0 0 32px rgba(${rgb},.08)`;
  const textPrimary  = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted    = isDark ? '#94a3b8' : '#64748b';
  const textFaint    = isDark ? '#475569' : '#94a3b8';
  const subtleBg     = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)';
  const subtleBorder = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
  const taBg         = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)';
  const taBorder     = isDark ? 'rgba(255,255,255,.1)'  : 'rgba(0,0,0,.1)';
  const taColor      = isDark ? '#cbd5e1'                : '#334155';

  return ReactDOM.createPortal(
    <>
      <style>{KF}</style>
      <div
        role="alert" aria-live="polite"
        style={{
          position:'fixed', bottom:'22px', right:'18px', zIndex:999999,
          width:'360px', maxWidth:'calc(100vw - 24px)',
          animation:anim, opacity: phase==='enter' ? 0 : 1,
          fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",
          pointerEvents: phase==='exit' ? 'none' : 'auto',
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position:'absolute', inset:'-18px', borderRadius:'28px',
          background:`radial-gradient(ellipse, rgba(${rgb},.16) 0%, transparent 70%)`,
          animation:'nt-glow 3s ease-in-out infinite', pointerEvents:'none', zIndex:-1,
        }}/>

        <div style={{
          background:bg, borderRadius:'22px', overflow:'hidden',
          border:`1px solid ${border}`, borderLeft:`3px solid ${accent}`,
          boxShadow:shadow,
          backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)',
        }}>
          {/* Progress bar */}
          <div style={{ height:'2px', background: isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)', position:'relative' }}>
            {phase==='show' && view==='default' && (
              <div style={{
                position:'absolute', top:0, left:0, height:'100%',
                background:`linear-gradient(90deg,${accent},rgba(${rgb},.35))`,
                animation:`nt-bar ${DURATION}ms linear forwards`,
              }}/>
            )}
          </div>

          <div style={{ padding:'16px 17px 17px' }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'13px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'11px', animation:'nt-row-in .5s .1s both' }}>
                <div style={{ position:'relative', flexShrink:0 }}>
                  <div style={{
                    position:'absolute', inset:'-6px', borderRadius:'50%',
                    border:`1.5px solid rgba(${rgb},.5)`, animation:'nt-outer-ring 2.4s ease-out infinite',
                  }}/>
                  <div style={{
                    position:'absolute', inset:'-2px', borderRadius:'50%',
                    border:`1.5px solid rgba(${rgb},.7)`, animation:'nt-inner-ring 2.4s .35s ease-out infinite',
                  }}/>
                  <div style={{
                    width:'40px', height:'40px', borderRadius:'13px', position:'relative', zIndex:1,
                    background:`rgba(${rgb},.14)`, border:`1px solid rgba(${rgb},.28)`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <Bell size={17} style={{ color:accent, animation:'nt-ring 1.2s ease-in-out forwards' }} fill={`rgba(${rgb},.22)`}/>
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize:'7.5px', fontWeight:800, letterSpacing:'.26em',
                    textTransform:'uppercase', color:accent, marginBottom:'3px',
                    fontFamily:"'Outfit',sans-serif",
                  }}>
                    Gentle Nudge
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:textPrimary, fontFamily:"'Outfit',sans-serif", lineHeight:1.2, display:'flex', alignItems:'center', gap:'5px' }}>
                    {reminder.stepLabel || 'Time to try it'}
                    <Sparkles size={11} style={{ color:accent, opacity:.8 }}/>
                  </div>
                </div>
              </div>
              <button className="nt-x" onClick={dismiss} aria-label="Dismiss" style={{
                background:subtleBg, border:`1px solid ${subtleBorder}`,
                borderRadius:'8px', padding:'5px', cursor:'pointer', flexShrink:0,
                display:'flex', alignItems:'center', color:textFaint,
              }}>
                <X size={13}/>
              </button>
            </div>

            {/* Step text */}
            <div style={{
              background:subtleBg, border:`1px solid ${subtleBorder}`,
              borderRadius:'13px', padding:'11px 14px', marginBottom:'13px',
              animation:'nt-row-in .5s .2s both',
            }}>
              <p style={{
                margin:0, fontSize:'13px', lineHeight:1.75, color:textMuted,
                fontFamily:"'Fraunces',Georgia,serif", fontStyle:'italic',
              }}>
                "{reminder.stepText}"
              </p>
            </div>

            {/* Default footer */}
            {view === 'default' && (
              <div style={{ animation:'nt-row-in .5s .3s both' }}>
                <div style={{ fontSize:'9px', fontWeight:600, letterSpacing:'.06em', color:textFaint, fontFamily:"'Outfit',sans-serif", marginBottom:'9px' }}>
                  You set this. You've got this.
                </div>
                <div style={{ display:'flex', gap:'7px' }}>
                  <button className="nt-b" onClick={handleDone} style={{
                    flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
                    padding:'9px 12px', borderRadius:'11px',
                    background:`linear-gradient(135deg,rgba(${rgb},.26),rgba(${rgb},.1))`,
                    border:`1px solid rgba(${rgb},.32)`, color:accent,
                    fontSize:'10.5px', fontWeight:800, letterSpacing:'.09em',
                    fontFamily:"'Outfit',sans-serif", textTransform:'uppercase',
                    boxShadow:`0 2px 12px rgba(${rgb},.18)`,
                  }}>
                    <Check size={13} strokeWidth={3}/> Done → Journal
                  </button>
                  <button className="nt-b" onClick={handleFailView} style={{
                    flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
                    padding:'9px 12px', borderRadius:'11px',
                    background:subtleBg, border:`1px solid ${subtleBorder}`,
                    color:textFaint,
                    fontSize:'10.5px', fontWeight:700, letterSpacing:'.07em',
                    fontFamily:"'Outfit',sans-serif", textTransform:'uppercase',
                  }}>
                    <Frown size={12}/> Couldn't
                  </button>
                </div>
              </div>
            )}

            {/* Fail view */}
            {view === 'fail' && (
              <div style={{ animation:'nt-swap .22s cubic-bezier(.16,1,.3,1)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'9px' }}>
                  <button onClick={handleBack} style={{
                    background:subtleBg, border:`1px solid ${subtleBorder}`,
                    borderRadius:'7px', padding:'4px 6px', cursor:'pointer',
                    display:'flex', alignItems:'center', color:textFaint, transition:'color .15s',
                  }}>
                    <ArrowLeft size={12}/>
                  </button>
                  <span style={{ fontSize:'9px', fontWeight:800, letterSpacing:'.18em', textTransform:'uppercase', color:textFaint, fontFamily:"'Outfit',sans-serif" }}>
                    What got in the way?
                  </span>
                </div>
                <textarea className="nt-ta"
                  value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="It's okay — just write what happened…" rows={3}
                  style={{
                    width:'100%', resize:'none', boxSizing:'border-box',
                    background:taBg, border:`1px solid ${taBorder}`,
                    borderRadius:'12px', padding:'10px 13px',
                    color:taColor, fontSize:'13px', lineHeight:1.65,
                    fontFamily:"'Fraunces',Georgia,serif", fontStyle:'italic',
                    marginBottom:'9px',
                  } as React.CSSProperties}
                  autoFocus
                  onKeyDown={e => { if (e.key==='Enter' && (e.metaKey||e.ctrlKey)) handleSubmit(); }}
                />
                <button className="nt-b" onClick={handleSubmit} disabled={!reason.trim()||saving} style={{
                  width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
                  padding:'9px', borderRadius:'11px',
                  background: reason.trim() ? 'rgba(99,102,241,.18)' : subtleBg,
                  border:`1px solid ${reason.trim() ? 'rgba(99,102,241,.32)' : subtleBorder}`,
                  color: reason.trim() ? '#a5b4fc' : textFaint,
                  cursor: reason.trim() ? 'pointer' : 'not-allowed',
                  fontSize:'10.5px', fontWeight:800, letterSpacing:'.09em',
                  fontFamily:"'Outfit',sans-serif", textTransform:'uppercase', transition:'all .2s',
                }}>
                  {saving ? <span style={{ opacity:.6 }}>Saving…</span> : <><Send size={11}/> Save &amp; close</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
