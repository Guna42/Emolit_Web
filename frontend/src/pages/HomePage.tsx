import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BookOpen, ArrowUpRight, Feather, Zap, Activity, Brain, Loader2, PenLine, Bookmark, Check } from 'lucide-react';
import { emotionAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import './home-page-dark.css';

interface DailyWord {
    word: string;
    core: string;
    category: string;
    metadata: {
        intensity: number;
        definition: string;
        synonyms: string[];
        example: string;
        reflection_prompt: string;
        growth_tip: string;
        body_signal: string;
    };
}

const HomePage: React.FC = () => {
    const { isDark } = useTheme();
    const [dailyWord, setDailyWord] = useState<DailyWord | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const hasTracked = useRef(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cursorGlowRef = useRef<HTMLDivElement>(null);
    const particleRafRef = useRef(0);

    useEffect(() => {
        const fetchDailyWord = async () => {
            try {
                const [word, historyData] = await Promise.all([
                    emotionAPI.getDailyWord(),
                    emotionAPI.getJournalHistory()
                ]);
                setDailyWord(word);
                
                // Check if this daily word is already saved in history
                const saved = historyData.entries.some(
                    e => e.type === 'learned_word' && 
                    ((e.data as any).word_details?.word === word.word || (e.data as any).word === word.word)
                );
                setIsSaved(saved);
            } catch (error) {
                console.error('Failed to fetch daily word:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDailyWord();
    }, []);

    const handleSaveManually = async () => {
        if (!dailyWord || isSaved) return;
        setIsSaved(true);
        hasTracked.current = true;
        try {
            await emotionAPI.trackWordLearned(dailyWord);
            console.log("✅ Tracker: Word saved manually to timeline.");
        } catch (e) {
            console.error(e);
            setIsSaved(false);
            hasTracked.current = false;
        }
    };

    /* Landing-style particles + cursor glow (dark only) */
    useEffect(() => {
        if (!isDark || loading) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let W = (canvas.width = window.innerWidth);
        let H = (canvas.height = window.innerHeight);
        const onResize = () => {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', onResize);
        const particles = Array.from({ length: 58 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.26,
            vy: (Math.random() - 0.5) * 0.26,
            r: 1.1 + Math.random() * 1.35,
            opacity: 0.1 + Math.random() * 0.36,
        }));
        const pColor = '82,183,136';
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > W) p.vx *= -1;
                if (p.y < 0 || p.y > H) p.vy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${pColor},${p.opacity})`;
                ctx.fill();
            });
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 96) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(${pColor},${0.065 * (1 - d / 96)})`;
                        ctx.lineWidth = 0.45;
                        ctx.stroke();
                    }
                }
            }
            particleRafRef.current = requestAnimationFrame(draw);
        };
        particleRafRef.current = requestAnimationFrame(draw);
        return () => {
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(particleRafRef.current);
        };
    }, [isDark, loading]);

    useEffect(() => {
        if (!isDark || loading) return;
        const el = cursorGlowRef.current;
        if (!el) return;
        const move = (e: MouseEvent) => {
            el.style.left = `${e.clientX}px`;
            el.style.top = `${e.clientY}px`;
        };
        window.addEventListener('mousemove', move);
        return () => window.removeEventListener('mousemove', move);
    }, [isDark, loading]);

    if (loading) {
        return (
            <div className="home-page min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                    <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading Daily Insight...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="home-page relative min-h-screen pb-20 pt-24 overflow-x-hidden transition-colors duration-500">
            {isDark && (
                <>
                    <div ref={cursorGlowRef} className="home-fx-cursor" aria-hidden />
                    <canvas ref={canvasRef} className="home-fx-canvas" aria-hidden />
                </>
            )}
            <div className="relative z-[1]">
            {/* HERO HEADER */}
            <div className="relative pt-12 md:pb-16 px-6 max-w-[1400px] mx-auto text-center">
                <h1 className={`text-5xl sm:text-6xl md:text-8xl font-black mb-6 tracking-tight leading-[0.9] transition-colors duration-1000 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Emo<span className="text-emerald-600">Lit</span>
                </h1>
                <p className={`text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed mb-8 md:mb-10 px-4 transition-colors duration-1000 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Master the nuance of human feeling. A daily journey into your inner landscape.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
                    <Link to="/search" className={`group px-8 py-4 rounded-full font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-xl hover:-translate-y-1 active:scale-95 ${isDark ? 'bg-emerald-500 text-[#0a0f0d] hover:bg-emerald-400 shadow-emerald-500/10' : 'bg-slate-900 text-white hover:bg-black shadow-slate-200'}`}>
                        Explore Compass
                        <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                    </Link>
                    <Link to="/journal" className={`px-8 py-4 rounded-full font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 ${isDark ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10' : 'bg-white text-slate-900 border border-slate-200 hover:border-slate-300'}`}>
                        <PenLine className="w-5 h-5 text-emerald-600" />
                        Daily Journal
                    </Link>
                </div>
            </div>

            {/* BENTO GRID */}
            {dailyWord && (
                <div className="max-w-[1280px] mx-auto px-4 md:px-6">
                    <div className="flex items-end justify-between mb-6 px-2">
                        <div>
                            <h2 className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Daily Insight</h2>
                            <p className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Word of the Day</p>
                        </div>
                        <div className="hidden md:block text-right">
                            <div className="h-px w-24 bg-slate-200 mb-2 ml-auto"></div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 auto-rows-[minmax(180px,auto)]">
                        {/* MAIN WORD */}
                        <div className={`md:col-span-8 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden group flex flex-col justify-between min-h-[420px] shadow-2xl transition-all duration-1000 ${isDark ? 'bg-emerald-500 text-[#0a0f0d] shadow-emerald-500/10' : 'bg-emerald-600 shadow-emerald-900/20'}`}>
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>
                            <div className="relative z-10 flex items-start justify-between">
                                <div className="flex gap-2">
                                    <span className={`px-3 py-1 backdrop-blur-md rounded-lg text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-black/10' : 'bg-white/10'}`}>{dailyWord.core}</span>
                                    <span className={`px-3 py-1 backdrop-blur-md rounded-lg text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-black/10 text-emerald-950' : 'bg-white/10 text-emerald-100'}`}>{dailyWord.category}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isSaved ? (
                                        <div className={`px-3 py-1.5 backdrop-blur-md rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all duration-500 ${isDark ? 'bg-black/20 text-[#0a0f0d]' : 'bg-white/20 text-white'}`}>
                                            <Check size={14} /> Saved
                                        </div>
                                    ) : (
                                        <button onClick={handleSaveManually} className={`px-3 py-1.5 backdrop-blur-md rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-all cursor-pointer ${isDark ? 'bg-black/10 text-[#0a0f0d]' : 'bg-white/10 text-emerald-50'}`}>
                                            <Bookmark size={14} /> Save
                                        </button>
                                    )}
                                    <Sparkles className={`w-8 h-8 opacity-80 ${isDark ? 'text-emerald-700' : 'text-emerald-300'}`} />
                                </div>
                            </div>
                            <div className="relative z-10 mt-auto">
                                <h2 className={`text-6xl md:text-9xl font-black tracking-tight mb-6 leading-[1.1] drop-shadow-sm ${isDark ? 'text-[#0a0f0d]' : 'text-white'}`}>
                                    {dailyWord.word}
                                </h2>
                                <div className={`border-l-4 pl-6 ${isDark ? 'border-emerald-700/30' : 'border-emerald-400/30'}`}>
                                    <p className={`text-lg md:text-2xl font-medium leading-relaxed max-w-2xl ${isDark ? 'text-emerald-900' : 'text-emerald-50'}`}>
                                        {dailyWord.metadata.definition}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* INTENSITY */}
                        <div className={`md:col-span-4 rounded-[2.5rem] p-8 border shadow-sm flex flex-col justify-between group transition-all duration-1000 h-full ${
                            isDark ? 'bg-[#111a14]/60 border-white/5 hover:bg-[#111a14]' : 'bg-white border-slate-100 hover:border-emerald-200'
                        }`}>
                            <div className="flex items-center justify-between">
                                <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                    <Activity className="w-4 h-4" /> Intensity
                                </h3>
                                <div className={`text-3xl font-black transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{dailyWord.metadata.intensity}<span className={`text-lg font-medium ${isDark ? 'text-slate-700' : 'text-slate-400'}`}>/5</span></div>
                            </div>
                            <div className="mt-8 relative flex-1 flex flex-col justify-end">
                                <div className="flex items-end gap-2 h-40 w-full">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div key={level} className={`flex-1 rounded-t-xl transition-all duration-700 ${level <= dailyWord.metadata.intensity ? (isDark ? 'bg-emerald-500' : 'bg-slate-900 group-hover:bg-emerald-600') : (isDark ? 'bg-white/5' : 'bg-slate-100')}`} style={{ height: `${level * 20}%` }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* REFLECTION */}
                        <div className={`md:col-span-7 rounded-[2.5rem] p-10 border flex flex-col justify-center relative overflow-hidden min-h-[240px] transition-all duration-1000 ${
                            isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-[#F0FDF4] border-emerald-100'
                        }`}>
                            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? 'text-emerald-500' : 'text-emerald-700'}`}>
                                <Brain className="w-4 h-4" /> Daily Reflection
                            </h3>
                            <p className={`text-xl md:text-3xl font-serif leading-relaxed max-w-2xl ${isDark ? 'text-slate-200' : 'text-emerald-950'}`}>
                                {dailyWord.metadata.reflection_prompt}
                            </p>
                        </div>

                        {/* BODY SIGNALS */}
                        <div className={`md:col-span-5 rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[240px] transition-all duration-1000 shadow-xl ${
                            isDark ? 'bg-teal-950/60 border border-white/5 shadow-black/50' : 'bg-teal-900 text-white'
                        }`}>
                            <Zap className={`w-8 h-8 mb-6 ${isDark ? 'text-emerald-500' : 'text-teal-300'}`} />
                            <h3 className={`text-2xl font-bold leading-tight mb-2 ${isDark ? 'text-white' : 'text-white'}`}>Body Signals</h3>
                            <p className={`text-lg leading-relaxed border-t pt-4 mt-4 font-medium ${isDark ? 'text-slate-400 border-white/5' : 'text-teal-100/90 border-white/10'}`}>
                                {dailyWord.metadata.body_signal}
                            </p>
                        </div>

                        {/* EXAMPLE */}
                        <div className={`md:col-span-6 rounded-[2.5rem] p-10 flex flex-col justify-center min-h-[200px] transition-all duration-1000 ${
                            isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-900 text-white'
                        }`}>
                            <Feather className={`w-6 h-6 mb-6 ${isDark ? 'text-emerald-500' : 'text-slate-400'}`} />
                            <p className={`text-lg md:text-2xl font-serif italic leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-200'}`}>
                                "{dailyWord.metadata.example}"
                            </p>
                        </div>

                        {/* GROWTH TIP */}
                        <div className={`md:col-span-6 rounded-[2.5rem] p-10 border shadow-sm flex flex-col justify-center min-h-[200px] group transition-all duration-1000 ${
                            isDark ? 'bg-[#111a14]/60 border-white/5 hover:bg-[#111a14]' : 'bg-white border-slate-100 hover:border-emerald-200'
                        }`}>
                            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors ${isDark ? 'text-slate-600' : 'text-slate-400 group-hover:text-emerald-600'}`}>
                                <BookOpen className="w-4 h-4" /> Growth Tip
                            </h3>
                            <p className={`text-lg md:text-2xl font-bold leading-tight transition-colors ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {dailyWord.metadata.growth_tip}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            </div>
        </div>
    );
};

export default HomePage;
