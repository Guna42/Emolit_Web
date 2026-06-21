import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { emotionAPI, WordDetail } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, RefreshCw, Zap, BookOpen, Brain, Sparkles, Activity } from 'lucide-react';
import { ReminderButton } from '../components/ReminderButton';

// ── Accent colours per core emotion ──────────────────────────────────────────
const THEME_COLORS: Record<string, string> = {
  'Joy':          '#f59e0b',
  'Sadness':      '#6366f1',
  'Anger':        '#ef4444',
  'Fear':         '#8b5cf6',
  'Disgust':      '#10b981',
  'Surprise':     '#06b6d4',
  'Love':         '#ec4899',
  'Trust':        '#14b8a6',
  'Anticipation': '#f97316',
};

// Text version for Tailwind classes (kept for h1 styling)
const TAILWIND_COLORS: Record<string, string> = {
  'Joy':          'text-amber-500',
  'Sadness':      'text-indigo-600',
  'Anger':        'text-rose-600',
  'Fear':         'text-violet-600',
  'Disgust':      'text-emerald-600',
  'Surprise':     'text-cyan-600',
  'Love':         'text-pink-600',
  'Trust':        'text-teal-600',
  'Anticipation': 'text-orange-600',
};

const WordDetailPage: React.FC = () => {
  const { isDark } = useTheme();
  const { wordName } = useParams<{ wordName: string }>();
  const [word, setWord] = useState<WordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWord = async () => {
      if (!wordName) return;
      try {
        const wordData = await emotionAPI.getWordDetails(wordName);
        setWord(wordData);
      } catch {
        setError('Word not found');
      } finally {
        setLoading(false);
      }
    };
    fetchWord();
  }, [wordName]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  if (error || !word) return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center transition-colors duration-500"
      style={{
        background: isDark
          ? 'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(82,183,136,0.06) 0%, transparent 60%), #010202'
          : '#ffffff',
      }}
    >
      <div
        className="relative z-10 mb-6"
        style={{ animation: 'wd-float 3.5s ease-in-out infinite' }}
      >
        <img
          src={`${process.env.PUBLIC_URL}/notfound.gif`}
          alt="Word not found"
          style={{ width: 'min(16rem, 60vw)', height: 'min(16rem, 60vw)', objectFit: 'contain' }}
        />
      </div>

      <div className="relative z-10">
        <h2
          className="font-black tracking-tight leading-tight mb-2"
          style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
            color: isDark ? '#f0fdf4' : '#064e3b',
          }}
        >
          Word Not Found
        </h2>
        <p
          className="text-sm font-medium mb-8 max-w-sm mx-auto leading-relaxed"
          style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280' }}
        >
          We couldn't find any emotional records for "{wordName}". Let's search for another one.
        </p>

        <div className="flex justify-center">
          <Link
            to="/search"
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 shadow-lg hover:-translate-y-0.5 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
            }}
          >
            <ArrowLeft size={16} />
            Back to Spectrum
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes wd-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );

  const accentHex   = THEME_COLORS[word.core]   || '#52b788';
  const twColor     = TAILWIND_COLORS[word.core] || 'text-slate-900';
  const intensityMap = [1, 2, 3, 4, 5];

  // ── Shared reminder-button helper ─────────────────────────────────────────
  const Remind = ({ idx, text, label }: { idx: number; text: string; label: string }) => (
    <ReminderButton
      stepIndex={idx}
      stepText={text}
      stepLabel={label}
      accentColor={accentHex}
      isDark={isDark}
      wordName={word.word}
    />
  );

  return (
    <div className="min-h-screen pb-32 pt-20 transition-colors duration-500">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 mb-12">
        <Link
          to="/search"
          className="inline-flex items-center text-slate-400 hover:text-slate-900 transition-colors font-bold text-sm uppercase tracking-widest mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Spectrum
        </Link>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-5xl sm:text-6xl md:text-6xl font-black tracking-tight mb-4 break-words ${isDark ? 'text-white' : twColor}`}>
              {word.word}
            </h1>

            <div className="flex flex-wrap items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                <div className="flex gap-1">
                  {intensityMap.map(i => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full`}
                      style={{
                        background: i <= word.metadata.intensity ? accentHex : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
                      }}
                    />
                  ))}
                </div>
              </div>
              <span className={`font-bold uppercase tracking-wider text-xs md:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {word.category}
              </span>
            </div>
          </div>

          <button className={`hidden md:block p-4 rounded-full border transition-all ${isDark ? 'bg-[#111a14] border-white/10 text-slate-400 hover:text-white hover:border-white/30' : 'bg-white border-slate-200 shadow-sm hover:shadow-md text-slate-400 hover:text-slate-900'}`}>
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* ── CARDS ──────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">

        {/* DEFINITION */}
        <div className={`rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 border transition-all duration-500 ${isDark ? 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]' : 'bg-white border-slate-200 shadow-sm hover:shadow-lg'}`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <BookOpen className="w-4 h-4" /> Definition
            </h3>
            <Remind idx={0} text={word.metadata.definition} label="Definition" />
          </div>
          <p className={`text-xl md:text-2xl font-medium leading-relaxed ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {word.metadata.definition}
          </p>
        </div>

        {/* EXAMPLE */}
        <div className={`rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 border relative overflow-hidden group ${isDark ? 'bg-gradient-to-r from-emerald-950/20 to-[#111a14] border-white/10' : 'bg-gradient-to-r from-slate-50 to-white border-slate-200'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-50 -mr-10 -mt-10" style={{ backgroundColor: isDark ? '#52b78820' : '#f1f5f9' }} />
          <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Example
            </h3>
            <Remind idx={1} text={word.metadata.example} label="Example" />
          </div>
          <p className={`text-lg md:text-xl font-serif italic leading-relaxed relative z-10 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            "{word.metadata.example}"
          </p>
        </div>

        {/* REFLECTION + GROWTH TIP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {word.metadata.reflection_prompt && (
            <div className={`rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border transition-colors ${isDark ? 'bg-white/[0.02] border-white/10 hover:border-indigo-500/30' : 'bg-white border-slate-200 shadow-sm hover:border-emerald-100'}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Brain className="w-4 h-4 text-indigo-400" /> Reflection
                </h3>
                <Remind idx={2} text={word.metadata.reflection_prompt} label="Reflection" />
              </div>
              <p className={`text-sm md:text-base leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {word.metadata.reflection_prompt}
              </p>
            </div>
          )}

          {word.metadata.growth_tip && (
            <div className={`rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border transition-colors ${isDark ? 'bg-white/[0.02] border-white/10 hover:border-amber-500/30' : 'bg-white border-slate-200 shadow-sm hover:border-amber-100'}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Sparkles className="w-4 h-4 text-amber-500" /> Growth Tip
                </h3>
                <Remind idx={3} text={word.metadata.growth_tip} label="Growth Tip" />
              </div>
              <p className={`text-sm md:text-base leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {word.metadata.growth_tip}
              </p>
            </div>
          )}
        </div>

        {/* BODY SIGNALS */}
        {word.metadata.body_signal && (
          <div className="rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
            <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 ${isDark ? 'opacity-100' : ''}`} />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" /> Body Signals
                </h3>
                <Remind idx={4} text={word.metadata.body_signal} label="Body Signal" />
              </div>
              <p className="text-lg md:text-xl text-slate-200 leading-relaxed">
                {word.metadata.body_signal}
              </p>
            </div>
          </div>
        )}

        {/* SYNONYMS */}
        {word.metadata.synonyms.length > 0 && (
          <div className="pt-8 flex flex-wrap gap-3 justify-center">
            {word.metadata.synonyms.map((syn, i) => (
              <span
                key={i}
                className={`px-6 py-3 rounded-full border font-bold transition-colors cursor-default ${isDark
                  ? 'bg-[#111a14] border-white/10 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                }`}
              >
                {syn}
              </span>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default WordDetailPage;
