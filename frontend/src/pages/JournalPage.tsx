import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Zap, Calendar, Clock,
  Mic, Square, CheckCircle2, Plus
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { emotionAPI, JournalResponse, DetectedEmotion } from '../services/api';
import { ReminderButton } from '../components/ReminderButton';
import { useNotification } from '../hooks/useNotification';

const MOODS = [
  {
    label: 'Radiant',
    img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Grinning%20Face%20with%20Smiling%20Eyes.png',
    color: 'text-amber-600', bg: 'bg-orange-50',
    gradient: 'from-amber-200 to-yellow-50', accent: 'bg-amber-400', border: 'border-amber-100/50',
    raw: '#d97706',
  },
  {
    label: 'Peaceful',
    img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Relieved%20Face.png',
    color: 'text-emerald-600', bg: 'bg-emerald-50',
    gradient: 'from-emerald-200 to-teal-100', accent: 'bg-emerald-400', border: 'border-emerald-100/50',
    raw: '#059669',
  },
  {
    label: 'Centered',
    img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Neutral%20Face.png',
    color: 'text-slate-600', bg: 'bg-slate-100',
    gradient: 'from-slate-300 to-gray-50', accent: 'bg-slate-400', border: 'border-slate-300/50',
    raw: '#475569',
  },
  {
    label: 'Melancholy',
    img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Frowning%20Face.png',
    color: 'text-indigo-600', bg: 'bg-indigo-50',
    gradient: 'from-indigo-200 to-blue-50', accent: 'bg-indigo-400', border: 'border-indigo-200/50',
    raw: '#4f46e5',
  },
  {
    label: 'Intense',
    img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Loudly%20Crying%20Face.png',
    color: 'text-rose-600', bg: 'bg-rose-50',
    gradient: 'from-rose-200 to-red-50', accent: 'bg-rose-400', border: 'border-rose-200/50',
    raw: '#e11d48',
  },
];

const UNIVERSAL_ANALYSIS_STEPS = [
  { icon: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Thinking%20Face.png', label: 'Processing your thoughts...' },
  { icon: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20with%20Monocle.png', label: 'Finding the patterns...' },
  { icon: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20with%20Peeking%20Eye.png', label: 'Connecting the nodes...' },
  { icon: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20with%20Monocle.png', label: 'Crafting your reflection...' },
];

// ── Typewriter Hook ─────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 18, active = true) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!active || !text) { setDisplayed(text); return; }
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, active]);
  return displayed;
}

// ── RULER step metadata ───────────────────────────────────────────────────
const RULER_META: Record<string, { tagline: string; fluentUrl: string }> = {
  'What You’re Feeling':    { tagline: '', fluentUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Sparkles.png' },
  'What’s Causing It':      { tagline: '', fluentUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Crystal%20Ball.png' },
  'A Better Way to See It': { tagline: '', fluentUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Gem%20Stone.png' },
  'Try This Now':           { tagline: '', fluentUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Artist%20Palette.png' },
  'Think About Tomorrow':   { tagline: '', fluentUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Yin%20Yang.png' },
};

interface RulerCardProps {
  index: number;
  label: string;
  text: string;
  accentColor: string;
  delay: number;
  isDark: boolean;
}

const RulerCard: React.FC<RulerCardProps> = ({ index, label, text, accentColor, delay, isDark }) => {
  const [visible, setVisible] = useState(false);
  const displayed = useTypewriter(text, 12, visible);
  const meta = RULER_META[label] ?? { tagline: '', fluentUrl: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Sparkles.png' };

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        background: isDark ? 'rgba(17, 26, 20, 0.4)' : '#ffffff',
        borderRadius: '18px',
        borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.07)',
        borderRight: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.07)',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.07)',
        borderLeft: `4px solid ${accentColor}`,
        boxShadow: isDark ? `0 2px 8px rgba(0,0,0,0.4), inset 2px 0 16px ${accentColor}10` : `0 2px 8px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.04), inset 2px 0 16px ${accentColor}08`,
        padding: '22px 24px 22px 22px',
        position: 'relative',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Header: pill badge ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {/* Pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          background: `${accentColor}12`,
          border: `1px solid ${accentColor}25`,
          borderRadius: '100px',
          padding: '4px 16px',
        }}>
          <span style={{
            fontSize: '11px', fontWeight: 800,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: accentColor, fontFamily: 'Outfit, sans-serif',
          }}>{label}</span>
        </div>
      </div>

      {/* ── Body text ── */}
      <p style={{
        fontSize: '15px', fontWeight: 400, lineHeight: 1.78,
        color: isDark ? '#e2e8f0' : '#1e293b', margin: 0,
        fontFamily: '"Playfair Display", Georgia, serif',
        letterSpacing: '0.01em', position: 'relative', zIndex: 1,
      }}>
        {displayed}
        {visible && displayed.length < text.length && (
          <span style={{
            display: 'inline-block', width: '1.5px', height: '0.95em',
            background: accentColor, marginLeft: '2px',
            verticalAlign: 'middle', animation: 'blink 0.9s step-start infinite',
          }} />
        )}
      </p>
    </div>
  );
};




const ActionPlan: React.FC<{ text: string; accentColor: string; gradient: string; isDark?: boolean; entryId?: string }> = ({ text, accentColor, gradient, isDark = true, entryId }) => {
  const steps = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => /^\d+\./.test(l))
    .map(l => l.replace(/^\d+\.\s*/, ''));



  return (
    <div className="grid gap-3">
      {steps.map((step, i) => (
        <div
          key={i}
          className={`flex items-start gap-4 p-4 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${isDark ? 'bg-white/5 border-white/10' : 'bg-emerald-50/60 border-emerald-100/60 shadow-sm'}`}
          style={{ animationDelay: `${i * 150}ms`, animation: 'slideInRight 0.5s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
            style={{ background: accentColor }}
          >
            {i + 1}
          </div>
          <p className={`font-light leading-relaxed pt-1 text-sm md:text-base tracking-wide flex-1 transition-colors duration-300 ${isDark ? 'text-white' : 'text-emerald-950'}`}>{step}</p>
          {/* 🔔 Remind Me — only on first two steps */}
          {i < 2 && (
            <div className="flex-shrink-0 self-center ml-2">
              <ReminderButton
                stepIndex={i + 10}  // offset to avoid colliding with WordDetailPage indices
                stepText={step}
                stepLabel={`Action Step ${i + 1}`}
                accentColor={accentColor}
                isDark={isDark}
                entryId={entryId}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Main Loading Overlay Inside Textarea ────────────────────────────────────
const AnalyzingOverlay: React.FC<{ active: boolean; accentColor: string; gradient: string; isDark: boolean; steps: { icon: string; label: string }[] }> = ({ active, accentColor, gradient, isDark, steps }) => {
  const [step, setStep] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!active) { setStep(0); return; }
    const stepTimer = setInterval(() => setStep(s => (s + 1) % steps.length), 1100);
    const dotTimer = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => { clearInterval(stepTimer); clearInterval(dotTimer); };
  }, [active, steps.length]);

  if (!active) return null;

  return (
    <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-md rounded-[2rem] md:rounded-[2.5rem] ${isDark ? 'bg-[#111a14]/90' : 'bg-white/80'}`}>
      
      {/* Loading animation container around the emoji */}
      <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
        {/* Glow Aura */}
        <div 
          className="absolute w-24 h-24 rounded-full blur-2xl opacity-20 transition-all duration-1000 animate-pulse-soft"
          style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
        />
        
        {/* Slowly spinning dashed outer ring */}
        <div 
          className="absolute inset-2 rounded-full border-2 border-dashed animate-spin-slow pointer-events-none"
          style={{ borderColor: `${accentColor}30` }}
        />
        
        {/* Faster reverse-spinning dotted inner ring */}
        <div 
          className="absolute w-28 h-28 rounded-full border border-dotted animate-spin-reverse-slow pointer-events-none"
          style={{ borderColor: `${accentColor}60`, borderWidth: '2px' }}
        />

        {/* Expanding sonar waves */}
        <div 
          className="absolute w-20 h-20 rounded-full pointer-events-none"
          style={{ 
            border: `2px solid ${accentColor}40`,
            animation: 'sonar-pulse 2.2s cubic-bezier(0.215, 0.610, 0.355, 1) infinite'
          }}
        />
        <div 
          className="absolute w-20 h-20 rounded-full pointer-events-none"
          style={{ 
            border: `2px solid ${accentColor}20`,
            animation: 'sonar-pulse 2.2s cubic-bezier(0.215, 0.610, 0.355, 1) infinite',
            animationDelay: '1.1s'
          }}
        />

        {/* Emoji element */}
        <img 
          src={steps[step].icon} 
          alt="" 
          className="relative z-10 w-20 h-20 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)] animate-pulse-scale" 
        />
      </div>

      {/* Step text */}
      <p className={`text-sm font-semibold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        {steps[step].label}
      </p>
      <p className={`text-xs mt-1 tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        AI is thinking{dots}
      </p>

      {/* Progress bar */}
      <div className="mt-6 w-40 h-0.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${((step + 1) / steps.length) * 100}%`,
            background: `linear-gradient(90deg, ${accentColor}80, ${accentColor})`,
          }}
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const JournalPage: React.FC = () => {
  const { isDark } = useTheme();
  // Toast is handled globally in App.tsx — just need the hook for other features
  useNotification();
  const [entry, setEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState<number>(2);
  const [result, setResult] = useState<JournalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingChunks, setRecordingChunks] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);       // stable ref to avoid stale closures
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const CHUNK_MS = 20_000; // 20 seconds — safely within Sarvam AI's limit

  const activeMood = MOODS[selectedMood];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleNewEntry = () => {
    setEntry('');
    setResult(null);
    setSelectedMood(2);
    textareaRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Returns the best supported MIME type for the current browser
  const getSupportedMimeType = (): string => {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
    return types.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
  };

  // ── CHUNK RECORDER ─────────────────────────────────────────────────────────
  // Records for CHUNK_MS milliseconds, sends the blob to backend for STT,
  // appends the returned transcript, then restarts automatically while the
  // user is still recording. No 30-second limits!
  const startChunk = (stream: MediaStream) => {
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

    recorder.onstop = async () => {
      if (audioChunksRef.current.length === 0) return;
      const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
      audioChunksRef.current = [];

      setIsTranscribing(true);
      try {
        const result = await emotionAPI.transcribeVoice(blob);
        if (result.transcript) {
          setEntry(prev => prev ? prev + ' ' + result.transcript : result.transcript);
          setRecordingChunks(c => c + 1);
        }
      } catch (err: any) {
        console.error('Chunk transcription error:', err?.response?.data?.detail ?? err?.message ?? err);
      } finally {
        setIsTranscribing(false);
      }

      // Restart the next chunk only if the user is still recording
      if (isRecordingRef.current) startChunk(stream);
    };

    recorder.start();
    // Auto-stop after CHUNK_MS → triggers onstop → transcribes → restarts
    chunkTimerRef.current = setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, CHUNK_MS);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      streamRef.current = stream;
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingChunks(0);
      startChunk(stream);
    } catch {
      alert('Please allow microphone access for Voice Protocol.');
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false; // prevents startChunk from restarting
    setIsRecording(false);
    if (chunkTimerRef.current) { clearTimeout(chunkTimerRef.current); chunkTimerRef.current = null; }
    // Stop recorder → fires onstop → transcribes final chunk (no restart this time)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    // Release the mic
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await emotionAPI.submitJournal(entry);
      if ('error' in response) { console.error(response.error); }
      else {
        setResult(response as JournalResponse);
        setTimeout(() => document.getElementById('analysis-dashboard')?.scrollIntoView({ behavior: 'smooth' }), 600);
      }
    } catch (error: any) {
      const detail = error.response?.data?.detail || error.message;
      console.error('Failed to submit journal:', detail);
      alert(`Submission failed: ${detail}`);
    } finally { setLoading(false); }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const RULER_CARDS = result?.ruler ? [
    { label: 'What You’re Feeling',    text: result.ruler.section_1 || '' },
    { label: 'What’s Causing It',      text: result.ruler.section_2 || '' },
    { label: 'A Better Way to See It', text: result.ruler.section_3 || '' },
    { label: 'Try This Now',           text: result.ruler.section_4 || '' },
    { label: 'Think About Tomorrow',   text: result.ruler.section_5 || '' },
  ] : [];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0f0d]' : activeMood.bg} transition-colors duration-1000 pb-20 pt-24 md:pt-32 px-4 md:px-8`}>

      {/* ── ENTRY SECTION ── */}
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 min-h-[auto] lg:min-h-[650px] lg:h-[calc(100vh-160px)]">

        {/* LEFT: MOOD CANVAS */}
        <div className={`rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden transition-all duration-1000 p-8 md:p-10 flex flex-col justify-between border min-h-[400px] lg:h-auto ${isDark ? 'bg-[#111a14]/60 border-white/5' : `bg-white/40 ${activeMood.border}`}`}>
          <div className={`absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-gradient-to-br ${activeMood.gradient} ${isDark ? 'opacity-10' : 'opacity-40'} blur-[80px] md:blur-[120px] rounded-full -mr-20 -mt-20 md:-mr-32 md:-mt-32 transition-all duration-1000 animate-pulse`} />

          <div className="relative z-10">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-md border shadow-sm mb-6 md:mb-8 ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white/70 border-white/80'}`}>
              <Sparkles className={`w-3.5 h-3.5 md:w-4 md:h-4 ${activeMood.color}`} />
              <span className={`text-[10px] md:text-xs font-bold tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Daily Reflection</span>
            </div>
            <h1 className={`text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Describe your <br />
              <span className={`font-black drop-shadow-sm ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>inner landscape</span>
            </h1>
          </div>

          {/* MOOD BAR */}
          <div className="relative z-10 my-8">
            <div className={`flex justify-between items-center backdrop-blur-xl px-10 py-[19px] rounded-full border shadow-lg max-w-xl mx-auto transition-all duration-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/60'}`}>
              {MOODS.map((m, idx) => {
                const isActive = selectedMood === idx;
                return (
                  <button key={idx} onClick={() => setSelectedMood(idx)} className="relative flex items-center justify-center transition-all duration-300">
                    {isActive && <div className={`absolute inset-0 blur-2xl opacity-30 ${m.accent} rounded-full scale-125`} />}
                    <div className={`relative z-10 w-12 h-12 md:w-16 md:h-16 transition-all duration-500 ${isActive ? 'scale-150 drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)] animate-wiggle' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-110'}`}>
                      <img src={m.img} alt={m.label} className="w-full h-full object-contain" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUESTION BOX */}
          <div className={`backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 border shadow-xl relative z-10 ${isDark ? 'bg-[#111a14]/80 border-white/10' : 'bg-white/60 border-white/80'}`}>
            <span className={`text-[10px] md:text-xs font-black uppercase tracking-[0.4em] block mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Current Inquiry</span>
            <p className={`text-xl md:text-2xl font-medium leading-snug tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>"How are you feeling today?"</p>
          </div>
        </div>

        {/* RIGHT: ZEN WRITER */}
        <div className={`flex flex-col h-full rounded-[2rem] md:rounded-[2.5rem] border p-6 md:p-10 relative overflow-hidden min-h-[500px] ${isDark ? 'bg-[#111a14] border-white/10 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-100 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.04)]'}`}>

          <div className={`flex items-center justify-between mb-8 md:mb-10 pb-6 md:pb-8 border-b ${isDark ? 'border-white/5' : 'border-slate-50'}`}>
            <div className={`flex items-center gap-3 md:gap-4 font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Calendar className={`w-5 h-5 md:w-6 md:h-6 ${activeMood.color}`} />
              <span className="text-base md:text-xl">{currentDate}</span>
            </div>
            <div className={`flex items-center gap-2 md:gap-3 font-black font-sans text-xs md:text-sm uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
              <span>{currentTime}</span>
            </div>
          </div>

          {/* ── THE KEY PART: Textarea + Analyzing Overlay ── */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                id="journal-entry"
                name="journal-entry"
                aria-label="Journal entry text"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder={isRecording ? 'Listening to your neural frequency...' : 'Start anchoring your thoughts...'}
                className={`w-full h-full min-h-[200px] bg-transparent border-none resize-none text-xl md:text-2xl focus:ring-0 leading-relaxed font-serif p-0 selection:bg-emerald-50 focus:outline-none transition-all duration-500 ${isDark ? 'text-slate-200 placeholder:text-slate-700' : 'text-slate-800 placeholder:text-slate-200'} ${(loading || isRecording) ? 'opacity-0' : 'opacity-100'}`}
              />

              {/* ANALYZING OVERLAY */}
              <AnalyzingOverlay 
                active={loading} 
                accentColor={activeMood.raw} 
                gradient={activeMood.gradient} 
                isDark={isDark} 
                steps={UNIVERSAL_ANALYSIS_STEPS}
              />

              {/* RECORDING OVERLAY */}
              {isRecording && !loading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div key={i} className={`w-1.5 h-12 bg-gradient-to-t ${activeMood.gradient} rounded-full animate-waveform`} style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                  <span className={`text-xs font-black uppercase tracking-[0.4em] ${activeMood.color} animate-pulse`}>
                    {isTranscribing ? '✨ Processing part...' : '🎤 Listening...'}
                  </span>
                  {recordingChunks > 0 && (
                    <span className={`text-[10px] mt-2 font-bold tracking-widest uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {recordingChunks} {recordingChunks === 1 ? 'segment' : 'segments'} captured
                    </span>
                  )}
                  <span className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
                    Auto-splits every 20s — speak freely
                  </span>
                </div>
              )}
            </div>

            <div className="mt-8 md:mt-10 flex items-center justify-between gap-4">
              {/* COMPACT WORD COUNT */}
              <div className="flex items-baseline gap-2">
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Words</span>
                <span className={`text-xl md:text-2xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {entry.trim().split(/\s+/).filter((w: string) => w.length > 0).length}
                </span>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                {/* COMPACT VOICE BUTTON */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={loading}
                  className={`group relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${isRecording ? 'bg-rose-500 text-white scale-110' : (isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10' : 'bg-white text-slate-400 hover:text-slate-900 border border-slate-100')}`}
                >
                  {isRecording && <div className="absolute inset-0 bg-rose-400 animate-ping opacity-20" />}
                  <div className="relative z-10">
                    {isRecording ? <Square size={18} className="fill-current" /> : <Mic size={22} />}
                  </div>
                </button>

                {/* SUBTLE NEW ENTRY BUTTON */}
                {result && (
                  <button
                    type="button"
                    onClick={handleNewEntry}
                    disabled={loading || isRecording}
                    title="New Entry"
                    className={`group relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-500 border shadow-sm hover:-translate-y-1 active:scale-95 ${isDark ? 'bg-white/5 border-white/10 text-slate-500 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-900'}`}
                  >
                    <Plus size={20} />
                  </button>
                )}

                {/* PRIMARY ACTION BUTTON */}
                <button
                  type="submit"
                  disabled={loading || !entry.trim() || isRecording}
                  className={`group relative px-6 py-3 md:px-10 md:py-4 rounded-full font-black uppercase tracking-[0.2em] text-[10px] md:text-xs shadow-xl transition-all duration-500 overflow-hidden flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 active:scale-95 ${entry.trim() ? (isDark ? 'bg-emerald-500 text-[#0a0f0d] shadow-emerald-500/20' : 'bg-slate-950 text-white') : (isDark ? 'bg-white/5 text-slate-500 border border-white/5' : 'bg-slate-50 text-slate-300')}`}
                >
                  {entry.trim() && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  )}
                  <div className="relative z-10 flex items-center gap-3">
                    <Zap size={18} className="fill-current" />
                    <span>{loading ? 'Analyzing...' : (result ? 'Update' : 'Journal It')}</span>
                  </div>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* RESULTS DASHBOARD                                              */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {result && (
        <div id="analysis-dashboard" className="max-w-[1100px] mx-auto mt-12 pt-4 pb-10">

          {/* HEADER */}
          <div className="flex items-end justify-between mb-10 px-1">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className={`w-4 h-4 ${activeMood.color}`} />
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${activeMood.color}`}>Analysis Complete</span>
              </div>
              <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>The Mirror</h2>
              <p className={`text-base md:text-lg font-light mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Your reflection, decoded by Emolit Framework</p>
            </div>
          </div>

          {result.ruler ? (
            <div className="space-y-5">

              {/* EMOTION TAGS ROW */}
              <div
                className={`rounded-[2rem] p-6 md:p-8 border backdrop-blur-xl shadow-sm flex flex-col md:flex-row md:items-center gap-5 justify-between ${isDark ? 'bg-white/[0.02] border-white/5' : `bg-white/60 ${activeMood.border}`}`}
                style={{ animation: 'fadeSlideUp 0.5s ease both' }}
              >
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-[0.3em] block mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Emotional Signature</span>
                  <div className="flex flex-wrap gap-2">
                    {result.detected_emotions.map((e: DetectedEmotion, i: number) => (
                      <span
                        key={i}
                        className={`px-4 py-2 rounded-xl text-sm border shadow-sm font-semibold tracking-wide ${isDark ? 'bg-[#111a14]' : 'bg-white'}`}
                        style={{ color: activeMood.raw, borderColor: isDark ? 'rgba(255,255,255,0.1)' : activeMood.raw + '30' }}
                      >
                        {e.word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* RULER Pill-Badge Cards Stack */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}>
                {RULER_CARDS.map((card, i) => (
                  <RulerCard
                    key={card.label}
                    index={i + 1}
                    label={card.label}
                    text={card.text}
                    accentColor={activeMood.raw}
                    delay={i * 150}
                    isDark={isDark}
                  />
                ))}
              </div>

              {/* ACTION PLAN — FULL WIDTH CARD */}
              <div
                className="rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 border-2 relative overflow-hidden transition-all duration-500 bg-gradient-to-br from-[#489d74] to-[#367a5a] border-[#316e50] shadow-[0_15px_40px_-10px_rgba(72,157,116,0.25)] text-white"
                style={{ animation: 'fadeSlideUp 0.6s 0.9s ease both' }}
              >
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                  <div className="md:col-span-1">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 size={24} style={{ color: '#ffffff' }} />
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">What can be done</h3>
                    </div>
                    <p className="font-light leading-relaxed text-sm text-emerald-50/80">
                      A few gentle steps to help your heart feel lighter. Try them one by one, at your own pace.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <ActionPlan text={result.ruler['What can be done']} accentColor={activeMood.raw} gradient={activeMood.gradient} isDark={true} entryId={result.entry_id} />
                  </div>
                </div>
              </div>

            </div>
          ) : (
            // ── FALLBACK (no ruler) ──
            <div className="flex flex-col gap-6">
              {/* Emotional Signature */}
              <div className={`rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 border shadow-xl relative overflow-hidden backdrop-blur-xl ${isDark ? 'bg-white/[0.02] border-white/5' : `${activeMood.bg} ${activeMood.border}`}`}>
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] block mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Emotional Signature</span>
                <div className="flex flex-wrap gap-2 mb-6">
                  {result.detected_emotions.map((e: DetectedEmotion, i: number) => (
                    <span key={i} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${isDark ? 'bg-[#111a14]' : 'bg-white/60'}`} style={{ color: activeMood.raw, borderColor: isDark ? 'rgba(255,255,255,0.1)' : activeMood.raw + '30' }}>{e.word}</span>
                  ))}
                </div>
                <p className={`text-xl font-serif font-light leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>"{result.emotional_observation}"</p>
              </div>

              {/* Strategic Insight */}
              <div className={`rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 border shadow-xl relative overflow-hidden ${isDark ? 'bg-white/[0.02] border-white/5' : `${activeMood.bg} ${activeMood.border}`}`}>
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] block mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Strategic Insight</span>
                <p className={`text-2xl md:text-3xl font-serif font-light leading-snug ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>"{result.pattern_insight}"</p>
              </div>

              {/* Reflection Guidance */}
              <div className={`rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 border shadow-xl relative overflow-hidden ${isDark ? 'bg-white/[0.02] border-white/5' : `${activeMood.bg} ${activeMood.border}`}`}>
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] block mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Reflection Guidance</span>
                <p className={`text-2xl md:text-3xl font-serif font-light leading-snug ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>"{result.regulation_suggestion}"</p>
              </div>

              {/* Final Question */}
              <div className={`rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 border shadow-xl text-center relative overflow-hidden ${isDark ? 'bg-white/[0.02] border-white/5' : `${activeMood.bg} ${activeMood.border}`}`}>
                <Sparkles className={`w-7 h-7 mx-auto mb-5 ${activeMood.color}`} />
                <p className={`text-xl font-serif font-light leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>"{result.reflection_question}"</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── GLOBAL ANIMATIONS / NudgeToast handled globally in App.tsx ── */}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg) scale(1.5); }
          50% { transform: rotate(3deg) scale(1.5); }
        }
        .animate-wiggle { animation: wiggle 1s ease-in-out infinite; }

        @keyframes waveform {
          0%, 100% { height: 1.5rem; }
          50% { height: 3.5rem; }
        }
        .animate-waveform { animation: waveform 1s ease-in-out infinite; }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink { animation: blink 0.9s step-start infinite; }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }

        @keyframes spin-reverse-slow {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse-slow { animation: spin-reverse-slow 3s linear infinite; }

        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .animate-pulse-scale { animation: pulse-scale 1.5s ease-in-out infinite; }

        @keyframes brainwave {
          0% { transform: scaleY(0.4); opacity: 0.4; }
          100% { transform: scaleY(1); opacity: 1; }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes sonar-pulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        .ruler-card:hover {
          box-shadow: 0 8px 40px -8px rgba(0,0,0,0.08);
          transform: translateY(-3px);
        }
        ` }} />
    </div>
  );
};

export default JournalPage;
