import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { emotionAPI, WordDetail } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { Search, ArrowRight, X, Sparkles, Command, History, TrendingUp, Bookmark, Trash2 } from 'lucide-react';

const SUGGESTIONS = [
  "Overwhelmed", "Peaceful", "Betrayed", "Hopeful", "Exhausted", "Grateful"
];

// 🎨 THE EMOTIONAL SPECTRUM: SPECIFIC HUES & SATURATIONS
const MOOD_CONFIG: Record<string, { hue: number, sat: number, lit: number, label: string }> = {
  'Joy': { hue: 48, sat: 90, lit: 60, label: 'text-amber-700' },
  'Sadness': { hue: 210, sat: 15, lit: 50, label: 'text-slate-600' }, // Grayish-blue
  'Anger': { hue: 0, sat: 85, lit: 55, label: 'text-rose-700' },     // Pure Red
  'Fear': { hue: 270, sat: 70, lit: 60, label: 'text-violet-700' },
  'Disgust': { hue: 142, sat: 70, lit: 45, label: 'text-emerald-800' },
  'Surprise': { hue: 190, sat: 80, lit: 55, label: 'text-cyan-700' },
  'Love': { hue: 330, sat: 85, lit: 65, label: 'text-pink-700' },
  'Trust': { hue: 170, sat: 75, lit: 45, label: 'text-teal-800' },
  'Anticipation': { hue: 28, sat: 90, lit: 55, label: 'text-orange-700' },
};

const getMoodStyles = (core: string, intensity: number = 5, isDark: boolean = false) => {
  const config = MOOD_CONFIG[core] || { hue: 200, sat: 20, lit: 50 };
  const s = config.sat;
  const h = config.hue;

  const finalSat = Math.min(100, s + (intensity * 2));
  
  if (isDark) {
    const lightBg = `hsla(${h}, ${finalSat}%, ${config.lit}%, 0.08)`; // dark translucent
    const border = `hsla(${h}, ${finalSat}%, ${config.lit}%, 0.15)`;
    const solid = `hsl(${h}, ${finalSat}%, ${config.lit}%)`;
    const text = `hsl(${h}, 40%, 90%)`; 
    return { bg: lightBg, border, solid, text, hue: h };
  } else {
    const lightBg = `hsl(${h}, ${finalSat}%, 97%)`; // Slightly lighter
    const border = `hsl(${h}, ${finalSat}%, 92%)`;
    const solid = `hsl(${h}, ${finalSat}%, ${config.lit}%)`;
    const text = `hsl(${h}, 40%, 20%)`; // Higher contrast text
    return { bg: lightBg, border, solid, text, hue: h };
  }
};

const SearchPage: React.FC = () => {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('query') || '';

  const [query, setQuery] = useState(urlQuery);
  const [allWords, setAllWords] = useState<WordDetail[]>([]);
  const [cores, setCores] = useState<string[]>([]);
  const [savedWords, setSavedWords] = useState<any[]>([]);
  const [selectedCore, setSelectedCore] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [coresData, wordsData, historyData] = await Promise.all([
          emotionAPI.getCores(),
          emotionAPI.getWords(),
          emotionAPI.getJournalHistory()
        ]);
        setCores(coresData);
        setAllWords(wordsData as any);
        setSavedWords(historyData.entries.filter(e => e.type === 'learned_word').slice(0, 16));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    init();
    searchInputRef.current?.focus();
  }, []);

  const handleRemoveSavedWord = async (e: React.MouseEvent, entryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await emotionAPI.removeWordLearned(entryId);
      setSavedWords(prev => prev.filter(w => w.data?.entry_id !== entryId));
    } catch (err) {
      console.error("Failed to remove word:", err);
    }
  };

  // Sync state if URL changes
  useEffect(() => {
    if (urlQuery) setQuery(urlQuery);
  }, [urlQuery]);

  const results = useMemo(() => {
    const searchLow = query.toLowerCase().trim();
    if (!searchLow && !selectedCore) return [];

    return allWords.filter(word => {
      const matchesSearch = !searchLow || word.word.toLowerCase().startsWith(searchLow) || word.word.toLowerCase().includes(' ' + searchLow);
      const matchesCore = !selectedCore || word.core === selectedCore;
      return matchesSearch && matchesCore;
    }).slice(0, 32);
  }, [query, selectedCore, allWords]);

  const recentSearches: string[] = JSON.parse(localStorage.getItem('recent_searches') || '[]').slice(0, 4);
  const isBrowsing = !query && !selectedCore;

  return (
    <div className="min-h-screen pb-32 selection:bg-emerald-500/20 transition-colors duration-500">

      {/* 🏔️ THE PRECISION HEADER */}
      <div className="pt-40 md:pt-48 pb-20 px-6 max-w-[1400px] mx-auto text-center">
        {/* THE MASTER TITLE */}
        <h1 className={`text-6xl md:text-[8rem] font-black tracking-tighter leading-[0.8] mb-16 animate-reveal ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Explore <span className="text-emerald-600">Spectrum</span>
        </h1>

        {/* HIGH CONTRAST PLACEHOLDER & TEXT */}
        <div className="max-w-3xl mx-auto relative group">
          <div className={`relative flex items-center border rounded-[2rem] p-1.5 transition-all duration-500 ring-[8px] ${
            isDark 
              ? 'bg-[#111a14] border-white/10 ring-white/5 focus-within:border-emerald-500/50 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.6)]'
              : 'bg-white border-slate-200 ring-slate-50 focus-within:border-emerald-500/40 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.08)]'
          }`}>
            <div className="pl-8">
              <Search className={`w-7 h-7 transition-all duration-500 ${query ? 'text-emerald-500' : 'text-slate-400'}`} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedCore) setSelectedCore('');
              }}
              placeholder="Describe your current state..."
              className="w-full bg-transparent border-none py-8 px-8 text-2xl md:text-3xl font-bold text-slate-900 placeholder:text-slate-300 focus:ring-0 focus:outline-none tracking-tight"
              spellCheck={false}
            />
            <div className="pr-8 flex items-center gap-6">
              {query && (
                <button onClick={() => setQuery('')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isDark ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'bg-slate-50 text-slate-400 hover:text-slate-950 hover:bg-slate-100'
                }`}>
                  <X className="w-6 h-6" />
                </button>
              )}
              <div className={`hidden md:flex items-center gap-2 px-3.5 py-2.5 border rounded-xl font-mono text-[10px] font-black shadow-inner ${
                isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-500'
              }`}>
                <Command className="w-4 h-4" />
                <span>K</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🚥 RAINBOW SPECTRUM NAV */}
      <div className="max-w-[1400px] mx-auto px-6 mb-24">
        <div className="flex items-center gap-4 mb-12">
          <div className="h-px w-14 bg-emerald-600/30"></div>
          <h3 className="text-[11px] font-black tracking-[0.5em] uppercase text-slate-800">Spectrum Filter</h3>
          <div className="h-px flex-1 bg-slate-100"></div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 overflow-visible">
          <button
            onClick={() => { setSelectedCore(''); setQuery(''); }}
            className={`px-10 py-5 rounded-2xl text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-500 border-2 ${!selectedCore && !query
              ? (isDark ? 'bg-white text-slate-900 border-white shadow-2xl scale-105' : 'bg-slate-950 text-white border-slate-950 shadow-2xl scale-105')
              : (isDark ? 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20 hover:text-white' : 'bg-white text-slate-400 border-slate-50 hover:border-slate-200')
              }`}
          >
            Clear
          </button>
          {cores.map(core => {
            const isSelected = selectedCore === core;
            const mood = getMoodStyles(core, 6, isDark);
            return (
              <button
                key={core}
                onClick={() => { setSelectedCore(core); setQuery(''); }}
                className={`px-10 py-5 rounded-2xl text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-500 border-2 ${isSelected
                  ? `text-white shadow-xl scale-110 border-transparent`
                  : (isDark ? 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:border-white/20' : 'bg-white text-slate-400 border-slate-50 hover:text-slate-900 hover:border-slate-200')
                  }`}
                style={{
                  backgroundColor: isSelected ? mood.solid : (isDark ? 'rgba(255,255,255,0.03)' : 'white'),
                }}
              >
                {core}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🎞️ DISCOVERY FEED */}
      <div className="max-w-[1500px] mx-auto px-6 relative">

        {isBrowsing ? (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 animate-reveal-up">
            {/* RECENT SEARCH */}
            <div className={`rounded-[3rem] p-12 border group relative overflow-hidden ${
              isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/50 border-slate-100'
            }`}>
              <h3 className={`text-[11px] font-black tracking-[0.6em] uppercase mb-12 flex items-center gap-4 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                <History className="w-5 h-5 text-emerald-600" /> Moments
              </h3>
              <div className="grid grid-cols-1 gap-5 relative z-10">
                {recentSearches.length > 0 ? recentSearches.map((term: string) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className={`group p-8 rounded-[2rem] border transition-all flex justify-between items-center ${
                      isDark ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:shadow-2xl' : 'bg-white border-slate-200 hover:shadow-xl'
                    }`}
                  >
                    <span className={`text-2xl font-black transition-colors ${isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-950'}`}>{term}</span>
                    <ArrowRight className={`w-6 h-6 transition-transform ${isDark ? 'text-slate-500 group-hover:text-emerald-400' : 'text-slate-200 group-hover:text-emerald-500'}`} />
                  </button>
                )) : (
                  <div className={`py-16 text-center border-2 border-dashed rounded-[2rem] ${isDark ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-300'}`}>No History</div>
                )}
              </div>
            </div>

            {/* DISCOVERY */}
            <div className={`rounded-[3rem] p-12 border group relative overflow-hidden ${
              isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/50 border-slate-100'
            }`}>
              <h3 className={`text-[11px] font-black tracking-[0.6em] uppercase mb-12 flex items-center gap-4 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                <TrendingUp className="w-5 h-5 text-emerald-600" /> Explore
              </h3>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                {SUGGESTIONS.map(term => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className={`p-6 rounded-[1.5rem] border font-black transition-all text-[11px] uppercase tracking-widest text-center ${
                      isDark ? 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-reveal-up pb-20">
            <div className="mb-20 px-4">
              <h2 className={`text-4xl md:text-6xl font-black tracking-tighter mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {query ? `Nuances of "${query}"` : `${selectedCore} Spectrum`}
              </h2>
              <p className="text-slate-500 font-black text-xs uppercase tracking-[0.4em]">Identified {results.length} States</p>
            </div>

            {/* 🛠️ ADJUSTED GRID: WIDER & SHORTER CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {results.map((word, idx) => {
                const intensityValue = (word as any).metadata?.intensity ?? 5;
                const mood = getMoodStyles(word.core, intensityValue, isDark);

                return (
                  <Link
                    key={word.word}
                    to={`/word/${word.word}`}
                    className={`group relative rounded-[3rem] p-10 flex flex-col justify-between h-[340px] transition-all duration-700 hover:-translate-y-5 overflow-hidden stagger-card border ${
                      isDark ? 'shadow-[0_15px_40px_-20px_rgba(0,0,0,0.4)] hover:shadow-[0_60px_100px_-30px_rgba(0,0,0,0.6)]' : 'shadow-[0_15px_40px_-20px_rgba(0,0,0,0.06)] hover:shadow-[0_60px_100px_-30px_rgba(0,0,0,0.1)]'
                    }`}
                    style={{
                      '--idx': idx,
                      backgroundColor: mood.bg,
                      borderColor: mood.border
                    } as any}
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-0 group-hover:opacity-40 transition-all duration-1000 -mr-20 -mt-20" style={{ backgroundColor: mood.solid }}></div>

                    <div className="relative z-10 flex justify-between items-start">
                      <span className={`px-5 py-2.5 rounded-2xl shadow-sm text-[11px] font-black tracking-widest uppercase ${isDark ? 'bg-[#111a14]' : 'bg-white'}`} style={{ color: mood.solid }}>
                        {word.category}
                      </span>
                      <Sparkles className="w-7 h-7 opacity-20 group-hover:opacity-100 transition-all duration-700" style={{ color: mood.solid }} />
                    </div>

                    <div className="relative z-10 mt-4">
                      <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-[0.9] group-hover:scale-[1.02] origin-left transition-transform duration-500">
                        {word.word}
                      </h3>
                    </div>

                    <div className="relative z-10 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: mood.solid }}></div>
                        <span className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{word.core}</span>
                      </div>
                      {/* 🏹 REFINED ARROW: Smaller & Themed */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center opacity-0 translate-x-12 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 shadow-xl border ${
                        isDark ? 'bg-[#111a14] border-white/5 text-white' : 'bg-white border-slate-100 text-slate-900'
                      }`}>
                        <ArrowRight className="w-6 h-6" style={{ color: mood.solid }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 📖 SAVED ARCHIVE (Only shows if browsing) */}
      {isBrowsing && savedWords.length > 0 && (
          <div className="max-w-[1500px] mx-auto px-6 mt-32 mb-10 relative animate-reveal-up" style={{animationDelay: '0.2s'}}>
            <div className="mb-12 px-2 flex justify-between items-end">
                <div>
                    <h2 className={`text-xs font-black uppercase tracking-[0.4em] mb-2 ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>Your Archive</h2>
                    <p className={`text-4xl md:text-5xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Linguistic Library</p>
                </div>
                <Link to="/calendar" className={`text-sm font-bold flex items-center gap-2 hover:underline ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    View All in Calendar <ArrowRight size={14} />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {savedWords.map((item, i) => (
                    <Link to={`/word/${item.data.word_details?.word || item.data.word}`} key={i} className={`p-8 rounded-[3rem] border transition-all duration-500 hover:-translate-y-2 ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10 shadow-2xl shadow-black/50' : 'bg-white border-slate-200 hover:shadow-xl hover:border-emerald-200'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 ${isDark ? 'bg-black/30' : 'bg-slate-100'}`}>{item.data.core || item.data.word_details?.core || "Emotion"}</span>
                            <button onClick={(e) => handleRemoveSavedWord(e, item.data.entry_id)} className={`p-2 rounded-xl transition-all opacity-40 hover:opacity-100 ${isDark ? 'text-slate-300 hover:bg-rose-500 hover:text-white' : 'text-slate-500 hover:bg-rose-100 hover:text-rose-600'}`}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <h4 className={`text-3xl font-black tracking-tighter mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.data.word_details?.word || item.data.word || "Reflective"}</h4>
                        <p className={`text-sm italic leading-relaxed line-clamp-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {item.data.word_details?.metadata?.definition || item.data.metadata?.definition || "A nuanced experience within the spectrum of emotional intelligence."}
                        </p>
                    </Link>
                ))}
            </div>
          </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes reveal {
          from { opacity: 0; transform: translateY(-20px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes reveal-up {
          from { opacity: 0; transform: translateY(60px); filter: blur(20px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-reveal { animation: reveal 1s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .animate-reveal-up { animation: reveal-up 1s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .stagger-card {
          opacity: 0;
          animation: reveal-up 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          animation-delay: calc(var(--idx) * 40ms);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input::placeholder { color: #cbd5e1 !important; }
      `}} />
    </div>
  );
};

export default SearchPage;
