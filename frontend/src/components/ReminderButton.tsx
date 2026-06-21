import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Bell, BellOff, Check, ChevronDown, Clock, Zap, Coffee, Moon } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';

interface ReminderButtonProps {
  stepIndex:   number;
  stepText:    string;
  stepLabel:   string;
  accentColor: string;
  isDark:      boolean;
  wordName?:   string;
  entryId?:    string;
}

interface DelayOption {
  label:    string;
  sublabel: string;
  ms:       number;
  icon:     React.ReactNode;
  isTest?:  boolean;
}

function tonight8PMMs(): number {
  const now  = new Date();
  const t8pm = new Date(now);
  t8pm.setHours(20, 0, 0, 0);
  if (t8pm <= now) t8pm.setDate(t8pm.getDate() + 1);
  return t8pm.getTime() - now.getTime();
}

const DELAYS: DelayOption[] = [
  { label:'In 5 min',  sublabel:'Quick nudge',   ms:5 * 60_000,     icon:<Zap size={14}/>          },
  { label:'In 30 min', sublabel:'Short break',   ms:30 * 60_000,    icon:<Coffee size={14}/>        },
  { label:'In 1 hour', sublabel:'Later today',   ms:60 * 60_000,    icon:<Clock size={14}/>         },
  { label:'Tonight',   sublabel:'8 PM reminder', ms:tonight8PMMs(), icon:<Moon size={14}/>          },
];

const STYLES = `
  @keyframes rb-drop-in {
    0%   { transform:scale(.82) translateY(6px); opacity:0; }
    55%  { transform:scale(1.025) translateY(-2px); opacity:1; }
    100% { transform:scale(1) translateY(0); opacity:1; }
  }
  @keyframes rb-drop-out {
    0%   { transform:scale(1) translateY(0); opacity:1; }
    100% { transform:scale(.86) translateY(5px); opacity:0; }
  }
  @keyframes rb-tick {
    0%   { transform:scale(0) rotate(-40deg); opacity:0; }
    65%  { transform:scale(1.28) rotate(8deg); opacity:1; }
    100% { transform:scale(1) rotate(0); opacity:1; }
  }
  @keyframes rb-badge-in {
    0%   { transform:scale(.65) rotate(-12deg); opacity:0; }
    70%  { transform:scale(1.08) rotate(2deg); opacity:1; }
    100% { transform:scale(1) rotate(0); opacity:1; }
  }
  @keyframes rb-pulse-ring {
    0%   { transform:scale(.88); opacity:.55; }
    65%  { transform:scale(1.65); opacity:0; }
    100% { transform:scale(.88); opacity:0; }
  }
  @keyframes rb-shimmer {
    0%   { background-position:-200% center; }
    100% { background-position:200% center; }
  }
  @keyframes rb-opt-in {
    0%   { transform:translateX(-10px); opacity:0; }
    100% { transform:translateX(0); opacity:1; }
  }
  @keyframes rb-breathe {
    0%,100% { box-shadow:0 0 0 0 transparent; }
    50%      { box-shadow:0 0 0 3px var(--rb-accent-glow); }
  }
  @keyframes rb-selected-flash {
    0%   { transform:scale(1); }
    30%  { transform:scale(.95); }
    65%  { transform:scale(1.04); }
    100% { transform:scale(1); }
  }
  @keyframes rb-confirm-in {
    0%   { transform:scale(.8) translateY(4px); opacity:0; }
    60%  { transform:scale(1.06) translateY(-1px); opacity:1; }
    100% { transform:scale(1) translateY(0); opacity:1; }
  }
  .rb-main  { transition:all .22s cubic-bezier(.16,1,.3,1); }
  .rb-main:hover { transform:translateY(-2px); }
  .rb-main:active { transform:scale(.94) translateY(0); }
  .rb-opt   { transition:background .14s, transform .16s; }
  .rb-opt:active { transform:scale(.96); }
  .rb-x { transition:all .18s cubic-bezier(.16,1,.3,1); border-radius:50%; padding:3px; }
  .rb-x:hover { transform:rotate(18deg) scale(1.2); }
`;

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

export const ReminderButton: React.FC<ReminderButtonProps> = ({
  stepIndex, stepText, stepLabel, accentColor, isDark, wordName, entryId,
}) => {
  const { schedule, cancel, getReminder } = useNotification();
  const [open,    setOpen]    = useState(false);
  const [justSet, setJustSet] = useState(false);
  const [closing, setClosing] = useState(false);
  const [hovOpt,  setHovOpt]  = useState<number | null>(null);
  const [_tick,   setTick]    = useState(0);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number } | null>(null);

  const active    = getReminder(stepIndex, stepText, entryId);
  const scheduled = !!active;

  useEffect(() => {
    if (!scheduled) return;
    const id = setInterval(() => setTick(t => t + 1), 15_000);
    return () => clearInterval(id);
  }, [scheduled]);

  useEffect(() => {
    if (!open) return;
    const close = () => { setOpen(false); setClosing(false); };
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [open]);

  const openDropdown = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom + 8, left: rect.right - 222 });
    setOpen(true);
    setClosing(false);
  }, []);

  const closeDropdown = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); }, 200);
  }, []);

  const handleSelect = useCallback((opt: DelayOption) => {
    schedule(stepIndex, stepText, stepLabel, accentColor, opt.ms, wordName, entryId);
    closeDropdown();
    setJustSet(true);
    setTimeout(() => setJustSet(false), 2800);
  }, [schedule, stepIndex, stepText, stepLabel, accentColor, wordName, entryId, closeDropdown]);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    cancel(stepIndex, stepText, entryId);
  }, [cancel, stepIndex, stepText, entryId]);


  const minutesLeft = active
    ? Math.max(0, Math.round((active.remindAt - Date.now()) / 60_000))
    : 0;

  const timeLabel = minutesLeft === 0   ? 'Any moment…'
    : minutesLeft < 60 ? `${minutesLeft}m`
    : `${Math.round(minutesLeft / 60)}h`;

  const rgb = hexToRgb(accentColor);

  const base: React.CSSProperties = {
    display:'inline-flex', alignItems:'center', gap:'6px',
    padding:'5px 12px 5px 9px',
    borderRadius:'100px',
    cursor:'pointer', outline:'none',
    fontFamily:"'Outfit','Inter',sans-serif",
    fontSize:'10px', fontWeight:700, letterSpacing:'.08em',
    textTransform:'uppercase', whiteSpace:'nowrap',
    border:'none',
  };

  const dropdown = open && dropPos ? ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{ position:'fixed', inset:0, zIndex:9998 }}
        onClick={closeDropdown}
      />

      {/* Panel */}
      <div style={{
        position:'fixed',
        top:  dropPos.top,
        left: Math.max(8, dropPos.left),
        width:'222px',
        zIndex:9999,
        background: isDark ? 'rgba(7,11,20,.98)' : 'rgba(255,255,255,.99)',
        border: isDark ? '1px solid rgba(255,255,255,.09)' : '1px solid rgba(0,0,0,.09)',
        borderRadius:'20px',
        boxShadow: isDark
          ? `0 28px 72px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.04), 0 0 40px rgba(${rgb},.1)`
          : `0 20px 56px rgba(0,0,0,.14), 0 0 0 1px rgba(0,0,0,.04), 0 0 28px rgba(${rgb},.06)`,
        backdropFilter:'blur(36px)',
        WebkitBackdropFilter:'blur(36px)',
        overflow:'hidden',
        padding:'8px',
        animation: closing
          ? 'rb-drop-out .2s cubic-bezier(.4,0,1,1) forwards'
          : 'rb-drop-in .3s cubic-bezier(.16,1,.3,1) forwards',
        transformOrigin:'top right',
      }}>

        {/* Header */}
        <div style={{
          padding:'5px 11px 9px',
          fontSize:'8px', fontWeight:800, letterSpacing:'.24em',
          textTransform:'uppercase', fontFamily:"'Outfit',sans-serif",
          color: isDark ? '#334155' : '#94a3b8',
          display:'flex', alignItems:'center', gap:'6px',
          borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)',
          marginBottom:'4px',
        }}>
          <Bell size={9}/>
          Remind me…
        </div>

        {/* Options */}
        {DELAYS.map((opt, i) => (
          <button
            key={opt.label}
            className="rb-opt"
            onClick={() => handleSelect(opt)}
            onMouseEnter={() => setHovOpt(i)}
            onMouseLeave={() => setHovOpt(null)}
            style={{
              display:'flex', alignItems:'center', gap:'11px',
              width:'100%', padding:'9px 10px',
              background: hovOpt === i
                ? opt.isTest
                  ? 'rgba(168,85,247,.12)'
                  : `rgba(${rgb},.12)`
                : 'transparent',
              border:'none', borderRadius:'11px', cursor:'pointer',
              textAlign:'left',
              animation:`rb-opt-in .24s cubic-bezier(.16,1,.3,1) ${i * 38}ms both`,
              opacity: opt.isTest ? 0.7 : 1,
            }}
          >
            {/* Icon box */}
            <div style={{
              width:'32px', height:'32px', borderRadius:'9px', flexShrink:0,
              background: opt.isTest
                ? (hovOpt === i ? 'rgba(168,85,247,.18)' : 'rgba(168,85,247,.1)')
                : hovOpt === i
                  ? `rgba(${rgb},.2)`
                  : isDark ? `rgba(${rgb},.12)` : `rgba(${rgb},.09)`,
              border:`1px solid ${opt.isTest ? 'rgba(168,85,247,.25)' : `rgba(${rgb},.22)`}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              color: opt.isTest ? '#a855f7' : accentColor,
              transition:'all .14s',
            }}>
              {opt.icon}
            </div>

            <div>
              <div style={{
                fontSize:'12.5px', fontWeight:700, lineHeight:1.2,
                color: isDark ? '#e2e8f0' : '#1e293b',
                fontFamily:"'Outfit',sans-serif",
              }}>
                {opt.label}
              </div>
              <div style={{
                fontSize:'10px', fontWeight:500, marginTop:'2px',
                color: opt.isTest ? '#a855f7' : (isDark ? '#475569' : '#94a3b8'),
                fontFamily:"'Outfit',sans-serif",
              }}>
                {opt.sublabel}
              </div>
            </div>
          </button>
        ))}

        {/* Bottom accent line */}
        <div style={{
          margin:'6px 10px 3px', height:'1.5px', borderRadius:'2px',
          background:`linear-gradient(90deg, rgba(${rgb},.5), transparent)`,
        }}/>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div style={{ position:'relative', display:'inline-flex', alignItems:'center', flexShrink:0 }}>
      <style>{STYLES}</style>

      {/* ── Scheduled badge ──────────────────────────────────────── */}
      {scheduled ? (
        <div style={{
          ...base,
          background:`rgba(${rgb},.12)`,
          border:`1px solid rgba(${rgb},.28)`,
          color:accentColor,
          animation:'rb-badge-in .45s cubic-bezier(.16,1,.3,1)',
          cursor:'default', position:'relative',
        }}>
          {/* Pulse ring */}
          <div style={{
            position:'absolute', inset:'-4px', borderRadius:'100px',
            border:`1.5px solid rgba(${rgb},.42)`,
            animation:'rb-pulse-ring 2.6s ease-out infinite',
            pointerEvents:'none',
          }}/>
          {/* Dot with check */}
          <div style={{
            width:'19px', height:'19px', borderRadius:'50%',
            background:accentColor,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <Check size={10} color="#fff" strokeWidth={3}
              style={{ animation:'rb-tick .38s cubic-bezier(.16,1,.3,1)' }}/>
          </div>
          <span style={{ fontSize:'10.5px' }}>{timeLabel}</span>
          {/* Cancel */}
          <button
            className="rb-x"
            onClick={handleCancel}
            title="Cancel reminder"
            style={{
              background:'none', border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', color:`rgba(${rgb},.5)`,
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = accentColor)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = `rgba(${rgb},.5)`)}
          >
            <BellOff size={11}/>
          </button>
        </div>

      ) : justSet ? (

        /* ── Just-set state ────────────────────────────────────── */
        <div style={{
          ...base,
          background:`rgba(${rgb},.1)`,
          border:`1px solid rgba(${rgb},.24)`,
          color:accentColor,
          backgroundImage:`linear-gradient(90deg, transparent 0%, rgba(${rgb},.18) 50%, transparent 100%)`,
          backgroundSize:'200% auto',
          animation:'rb-confirm-in .42s cubic-bezier(.16,1,.3,1), rb-shimmer 1.5s .1s linear infinite',
        }}>
          <Check size={11} style={{ animation:'rb-tick .4s cubic-bezier(.16,1,.3,1)', flexShrink:0 }} strokeWidth={2.5}/>
          <span>Reminder set!</span>
        </div>

      ) : (

        /* ── Idle button ────────────────────────────────────────── */
        <button
          ref={btnRef}
          className="rb-main"
          onClick={() => open ? closeDropdown() : openDropdown()}
          style={{
            ...base,
            background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)',
            border: isDark ? '1px solid rgba(255,255,255,.25)' : '1px solid rgba(0,0,0,.15)',
            color: isDark ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.55)',
            // CSS variable for breathe animation
            ['--rb-accent-glow' as string]: `rgba(${rgb},.18)`,
          }}
          title={`Set a reminder for: ${stepLabel}`}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background    = `rgba(${rgb},.12)`;
            el.style.borderColor   = `rgba(${rgb},.45)`;
            el.style.color         = isDark ? '#ffffff' : 'rgba(0,0,0,.85)';
            el.style.boxShadow     = `0 4px 16px rgba(${rgb},.2)`;
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background  = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)';
            el.style.borderColor = isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.15)';
            el.style.color       = isDark ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.55)';
            el.style.boxShadow   = 'none';
          }}
        >
          <Bell size={11}/>
          <span>Remind me</span>
          <ChevronDown
            size={9}
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition:'transform .25s cubic-bezier(.16,1,.3,1)',
              marginLeft:'-2px',
            }}
          />
        </button>
      )}

      {dropdown}
    </div>
  );
};
