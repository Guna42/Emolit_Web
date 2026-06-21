import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, MessageCircle,
    Sparkles, Calendar as CalendarIcon, Clock, Activity,
    ArrowUpRight, Brain, Zap, Target, Crown,
    BookOpen, Heart, Compass, Search, Fingerprint, Layers, Quote,
    ArrowRight, Download, X, Printer, ShieldCheck,
    FileText, Award, Eye, ExternalLink, MapPin, Ribbon, Languages,
    Flame, Smile, Loader2
} from 'lucide-react';
import { emotionAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

// ── RULER metadata ───────────────────────────────────────────────────────────
const RULER_META: Record<string, { tagline: string }> = {
    Recognize:  { tagline: 'The weather in your heart' },
    Understand: { tagline: 'The roots of your state' },
    Label:      { tagline: 'Naming the experience' },
    Express:    { tagline: 'The soul\'s validation' },
    Regulate:   { tagline: 'A path to centeredness' },
};

const RulerCard: React.FC<{ index: number; label: string; text: string, isDark: boolean }> = ({ index, label, text, isDark }) => {
    const meta = RULER_META[label] || { tagline: '' };
    return (
        <div 
            className={`p-6 md:p-8 rounded-[2rem] border-l-4 transition-all duration-700 h-full ${isDark ? 'bg-[#111a14]/40 border-white/5' : 'bg-white border-slate-100'}`}
            style={{ borderLeftColor: '#10b981' }}
        >
            <div className="flex items-center gap-3 mb-4">
                <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                    style={{ background: '#10b981' }}
                >
                    {index}
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">{label}</h4>
                    <p className={`text-[10px] italic ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{meta.tagline}</p>
                </div>
            </div>
            <p className={`text-base md:text-lg font-serif leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {text}
            </p>
        </div>
    );
};

const ActionPlan: React.FC<{ text: string; isDark: boolean }> = ({ text, isDark }) => {
    const steps = text
        .split('\n')
        .map(l => l.trim())
        .filter(l => /^\d+\./.test(l))
        .map(l => l.replace(/^\d+\.\s*/, ''));

    if (steps.length === 0) return null;

    return (
        <div className={`mt-8 p-8 md:p-12 rounded-[3.5rem] bg-slate-950 text-white relative overflow-hidden break-inside-avoid shadow-2xl`}>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500 opacity-5 blur-[100px]" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="flex items-center gap-3 mb-4">
                        <Target className="text-emerald-500" size={24} />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Action Plan</h3>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                    {steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                            <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-slate-950 flex-shrink-0">{i + 1}</span>
                            <p className="text-slate-300 text-sm leading-relaxed tracking-wide font-light">{step}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface EmojiConfig {
    emoji: string;
    url: string;
    lightBg: string;
    lightBorder: string;
    darkBg: string;
    darkBorder: string;
    shadow: string;
}

const EMOTION_EMOJIS: Record<string, EmojiConfig> = {
    // Database values
    'Happy': {
        emoji: '😊',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Smiling%20Eyes.png',
        lightBg: 'bg-gradient-to-br from-amber-50 to-amber-100/50',
        lightBorder: 'border-amber-200/80',
        darkBg: 'bg-gradient-to-br from-amber-950/25 to-amber-900/10',
        darkBorder: 'border-amber-500/20',
        shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    },
    'Sad': {
        emoji: '😢',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Pensive%20Face.png',
        lightBg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50',
        lightBorder: 'border-indigo-200/80',
        darkBg: 'bg-gradient-to-br from-indigo-950/25 to-indigo-900/10',
        darkBorder: 'border-indigo-500/20',
        shadow: 'shadow-[0_0_15px_rgba(99,102,241,0.15)]',
    },
    'Angry': {
        emoji: '😡',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Pouting%20Face.png',
        lightBg: 'bg-gradient-to-br from-rose-50 to-rose-100/50',
        lightBorder: 'border-rose-200/80',
        darkBg: 'bg-gradient-to-br from-rose-950/25 to-rose-900/10',
        darkBorder: 'border-rose-500/20',
        shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    },
    'Fearful': {
        emoji: '😨',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Anxious%20Face%20with%20Sweat.png',
        lightBg: 'bg-gradient-to-br from-violet-50 to-violet-100/50',
        lightBorder: 'border-violet-200/80',
        darkBg: 'bg-gradient-to-br from-violet-950/25 to-violet-900/10',
        darkBorder: 'border-violet-500/20',
        shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]',
    },
    'Disgusted': {
        emoji: '🤢',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Nauseated%20Face.png',
        lightBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
        lightBorder: 'border-emerald-200/80',
        darkBg: 'bg-gradient-to-br from-emerald-950/25 to-emerald-900/10',
        darkBorder: 'border-emerald-500/20',
        shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    },
    'Surprised': {
        emoji: '😲',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Astonished%20Face.png',
        lightBg: 'bg-gradient-to-br from-cyan-50 to-cyan-100/50',
        lightBorder: 'border-cyan-200/80',
        darkBg: 'bg-gradient-to-br from-cyan-950/25 to-cyan-900/10',
        darkBorder: 'border-cyan-500/20',
        shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    },

    // UI Fallbacks
    'Joy': {
        emoji: '😊',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Smiling%20Eyes.png',
        lightBg: 'bg-gradient-to-br from-amber-50 to-amber-100/50',
        lightBorder: 'border-amber-200/80',
        darkBg: 'bg-gradient-to-br from-amber-950/25 to-amber-900/10',
        darkBorder: 'border-amber-500/20',
        shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    },
    'Sadness': {
        emoji: '😢',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Pensive%20Face.png',
        lightBg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50',
        lightBorder: 'border-indigo-200/80',
        darkBg: 'bg-gradient-to-br from-indigo-950/25 to-indigo-900/10',
        darkBorder: 'border-indigo-500/20',
        shadow: 'shadow-[0_0_15px_rgba(99,102,241,0.15)]',
    },
    'Anger': {
        emoji: '😡',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Pouting%20Face.png',
        lightBg: 'bg-gradient-to-br from-rose-50 to-rose-100/50',
        lightBorder: 'border-rose-200/80',
        darkBg: 'bg-gradient-to-br from-rose-950/25 to-rose-900/10',
        darkBorder: 'border-rose-500/20',
        shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    },
    'Fear': {
        emoji: '😨',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Anxious%20Face%20with%20Sweat.png',
        lightBg: 'bg-gradient-to-br from-violet-50 to-violet-100/50',
        lightBorder: 'border-violet-200/80',
        darkBg: 'bg-gradient-to-br from-violet-950/25 to-violet-900/10',
        darkBorder: 'border-violet-500/20',
        shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]',
    },
    'Disgust': {
        emoji: '🤢',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Nauseated%20Face.png',
        lightBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
        lightBorder: 'border-emerald-200/80',
        darkBg: 'bg-gradient-to-br from-emerald-950/25 to-emerald-900/10',
        darkBorder: 'border-emerald-500/20',
        shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    },
    'Surprise': {
        emoji: '😲',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Astonished%20Face.png',
        lightBg: 'bg-gradient-to-br from-cyan-50 to-cyan-100/50',
        lightBorder: 'border-cyan-200/80',
        darkBg: 'bg-gradient-to-br from-cyan-950/25 to-cyan-900/10',
        darkBorder: 'border-cyan-500/20',
        shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    },
    'Love': {
        emoji: '❤️',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Hearts.png',
        lightBg: 'bg-gradient-to-br from-pink-50 to-pink-100/50',
        lightBorder: 'border-pink-200/80',
        darkBg: 'bg-gradient-to-br from-pink-950/25 to-pink-900/10',
        darkBorder: 'border-pink-500/20',
        shadow: 'shadow-[0_0_15px_rgba(236,72,153,0.15)]',
    },
    'Trust': {
        emoji: '🤝',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Hugging%20Face.png',
        lightBg: 'bg-gradient-to-br from-teal-50 to-teal-100/50',
        lightBorder: 'border-teal-200/80',
        darkBg: 'bg-gradient-to-br from-teal-950/25 to-teal-900/10',
        darkBorder: 'border-teal-500/20',
        shadow: 'shadow-[0_0_15px_rgba(20,184,166,0.15)]',
    },
    'Anticipation': {
        emoji: '🤩',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Thinking%20Face.png',
        lightBg: 'bg-gradient-to-br from-orange-50 to-orange-100/50',
        lightBorder: 'border-orange-200/80',
        darkBg: 'bg-gradient-to-br from-orange-950/25 to-orange-900/10',
        darkBorder: 'border-orange-500/20',
        shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]',
    },
};

const CalendarPage: React.FC = () => {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const formatDate = useCallback((date: any) => {
        try {
            const d_obj = (date instanceof Date) ? date : new Date(date);
            if (isNaN(d_obj.getTime())) return "invalid-date";
            const y = d_obj.getFullYear();
            const m = String(d_obj.getMonth() + 1).padStart(2, '0');
            const d = String(d_obj.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        } catch (e) {
            return "invalid-date";
        }
    }, []);

    // Parse a YYYY-MM-DD string as LOCAL midnight (not UTC) to avoid timezone shift
    const parseLocalDate = (dateStr: string): Date => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const [viewDate, setViewDate] = useState(new Date());
    const [history, setHistory] = useState<any[]>([]);
    const [selDay, setSelDay] = useState(formatDate(new Date()));
    const [loading, setLoading] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isPrintingWeekly, setIsPrintingWeekly] = useState(false);
    const [isAnalyzingWeekly, setIsAnalyzingWeekly] = useState(false);
    const [weeklyReport, setWeeklyReport] = useState<any>(null);
    const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await emotionAPI.getJournalHistory();
                const entries = res.entries || [];

                setHistory(entries);
            } catch (e) {
                console.error("Archive Sync Fail:", e);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, []);

    const dataMap = useMemo(() => {
        const map: Record<string, any[]> = {};
        history.forEach(item => {
            const rawCreatedAt = item.data?.created_at;
            if (!rawCreatedAt) return;
            
            // Convert UTC timestamp to user's local date YYYY-MM-DD to align calendar grid rendering
            const key = formatDate(new Date(rawCreatedAt));
            if (key === "invalid-date") return;
            
            if (!map[key]) map[key] = [];
            map[key].push(item);
        });

        Object.keys(map).forEach(key => {
            map[key].sort((a, b) => new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime());
        });
        return map;
    }, [history, formatDate]);

    // Weighted dominant emotion map per day:
    // - Primary emotion gets 1.0 weight
    // - Secondary emotions get 0.5 weight
    // - In case of tie, breaking tie by selecting the primary emotion of the latest entry
    const dayEmotionsMap = useMemo(() => {
        const map: Record<string, { coreEmotion: string; count: number } | null> = {};
        Object.keys(dataMap).forEach(key => {
            const dayItems = dataMap[key] || [];
            const journalEntries = dayItems.filter(item => item.type === 'journal');
            if (journalEntries.length === 0) {
                map[key] = null;
                return;
            }

            const scores: Record<string, number> = {};

            journalEntries.forEach(entry => {
                const emotions = entry.data?.detected_emotions || [];
                emotions.forEach((em: any, index: number) => {
                    const core = em.core;
                    if (!core) return;
                    
                    const weight = index === 0 ? 1.0 : 0.5;
                    scores[core] = (scores[core] || 0) + weight;
                });
            });

            let bestCore: string | null = null;
            let bestScore = -1;

            Object.keys(scores).forEach(core => {
                const score = scores[core];
                if (score > bestScore) {
                    bestScore = score;
                    bestCore = core;
                } else if (score === bestScore) {
                    // Tie-breaker: choose the primary emotion of the latest entry
                    const latestEntry = journalEntries[journalEntries.length - 1];
                    const latestPrimary = latestEntry?.data?.detected_emotions?.[0]?.core;
                    if (latestPrimary && core === latestPrimary) {
                        bestCore = core;
                    }
                }
            });

            if (bestCore) {
                map[key] = { coreEmotion: bestCore, count: journalEntries.length };
            } else {
                map[key] = null;
            }
        });
        return map;
    }, [dataMap]);

    // Streak Calculation — uses parseLocalDate to avoid UTC timezone shift
    const streak = useMemo(() => {
        const dates = Object.keys(dataMap).filter(d => d !== "invalid-date").sort().reverse();
        if (dates.length === 0) return 0;
        
        let count = 0;
        let curr = new Date();
        curr.setHours(0, 0, 0, 0);

        for (let i = 0; i < dates.length; i++) {
            const d = parseLocalDate(dates[i]);
            const diff = Math.round((curr.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
            if (diff === 0 || diff === 1) {
                count++;
                curr = d;
            } else if (diff > 1) {
                break;
            }
        }
        return count;
    }, [dataMap]);

    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const grid = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => formatDate(new Date(year, month, i + 1)))
    ];

    const activeItems = useMemo(() => {
        return dataMap[selDay] || [];
    }, [dataMap, selDay]);

    const journalEntries = activeItems.filter(i => i.type === 'journal');
    const learnedWords = activeItems.filter(i => i.type === 'learned_word');

    const insights = useMemo(() => {
        const journals = history.filter(i => i.type === 'journal');
        return {
            jCount: journals.length,  // total all-time journal count
            insight: journals.length > 5
                ? "Your devotion to introspection is the ultimate act of self-sovereignty; every entry you anchor today is a sanctuary for your future wisdom."
                : "Growth is often quietest before it is profound; even the smallest spark of reflection today illuminates the blueprint of your ultimate self."
        };
    }, [history]);

    const triggerPrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 800);
    };

    const handleMonthlyExport = async () => {
        setIsAnalyzingWeekly(true);
        try {
            // month is 0-indexed in state, backend expects 1-indexed
            const offset = new Date().getTimezoneOffset();
            await emotionAPI.exportReport(month + 1, year, offset);
        } catch (e) {
            console.error("Monthly Export Fail:", e);
        } finally {
            setIsAnalyzingWeekly(false);
        }
    };

    const handleDownloadWeeklyPDF = () => {
        setIsPrintingWeekly(true);
        setTimeout(() => {
            window.print();
            setIsPrintingWeekly(false);
        }, 800);
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center font-sans ${isDark ? 'bg-[#0a0f0d]' : 'bg-white'}`}>
                <div className="flex flex-col items-center gap-6">
                    <Activity className={`${isDark ? 'text-emerald-400' : 'text-emerald-500'} animate-spin w-12 h-12`} />
                    <p className={`text-[10px] font-black tracking-[0.4em] uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>SYNCHRONIZING ARCHIVE...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen selection:bg-emerald-500/10 pt-24 md:pt-32 pb-40 px-6 sm:px-12 xl:px-24 relative font-sans transition-colors duration-1000 ${isDark ? 'bg-[#0a0f0d]' : 'bg-[#FDFEFE]'}`}>

            {/* 🏰 HERO SECTION - CENTERED & SYMMETRICAL */}
            <header className="max-w-[1700px] mx-auto mb-20 no-print text-center">
                <div className="flex flex-col items-center animate-reveal">
                    <div className="flex items-center gap-3 mb-8">
                        <Fingerprint size={24} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
                        <span className={`text-[11px] font-black uppercase tracking-[0.6em] ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>Sovereign Archive // Vol. {year}</span>
                    </div>
                    <h1 className={`text-4xl md:text-[5.5rem] font-black tracking-tighter leading-none mb-10 ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Living <span className="text-emerald-600">History</span>
                    </h1>
                    <p className={`max-w-2xl text-xl md:text-2xl font-medium leading-relaxed font-serif italic mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        A curated odyssey through your subconscious evolution. Every data point is a fragment of the masterpiece that is <span className={`font-bold not-italic underline decoration-emerald-400 underline-offset-8 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>You.</span>
                    </p>
                </div>
            </header>

            <div className="max-w-[1700px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-12 md:gap-24 items-start no-print">

                {/* 🗺️ LEFT SIDEBAR: CALENDAR + LINGUISTIC EXPANSION (STACKED) */}
                <aside className="xl:col-span-4 xl:sticky xl:top-12 space-y-12 animate-reveal delay-200">
                    {/* CALENDAR BLOCK */}
                    <div className={`p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border transition-all duration-1000 ${isDark ? 'bg-[#111a14]/60 border-white/5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.03)]'}`}>
                        <header className="flex items-center justify-between mb-8">
                            <h3 className={`text-3xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                                {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(viewDate)}
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white'}`}>
                                    <ChevronLeft size={18} />
                                </button>
                                <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white'}`}>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </header>

                        <div className="grid grid-cols-7 gap-3 mb-4">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <div key={`${d}-${i}`} className={`text-center text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-700' : 'text-slate-200'}`}>{d}</div>
                            ))}
                            {grid.map((date, idx) => {
                                if (!date) return <div key={`empty-${idx}`} className={`aspect-square rounded-xl ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50/30'}`} />;
                                const dStr = date as string;
                                const isSel = selDay === dStr;
                                const dayItems = dataMap[dStr] || [];
                                const hasAct = dayItems.length > 0;

                                const dayEmotionData = dayEmotionsMap[dStr];
                                const coreEmotion = dayEmotionData?.coreEmotion;
                                const matchedKey = coreEmotion 
                                    ? Object.keys(EMOTION_EMOJIS).find(k => k.toLowerCase() === coreEmotion.toLowerCase()) 
                                    : null;
                                const emojiConfig = matchedKey ? EMOTION_EMOJIS[matchedKey] : null;

                                const tooltipText = coreEmotion
                                    ? `Dominant Emotion: ${coreEmotion}${dayEmotionData && dayEmotionData.count > 1 ? ` (based on ${dayEmotionData.count} entries)` : ''}`
                                    : hasAct
                                    ? 'Activity logged'
                                    : undefined;

                                // Custom background styling based on emotion
                                let customClasses = '';
                                if (isSel) {
                                    customClasses = isDark 
                                        ? 'bg-emerald-500 text-[#0a0f0d] shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-110 z-10' 
                                        : 'bg-slate-900 text-white shadow-xl scale-110 z-10';
                                } else if (emojiConfig) {
                                    // Custom active day background matching the emotion
                                    const bgStyle = isDark ? emojiConfig.darkBg : emojiConfig.lightBg;
                                    const borderStyle = isDark ? emojiConfig.darkBorder : emojiConfig.lightBorder;
                                    const textStyle = isDark ? 'text-white' : 'text-slate-900';
                                    customClasses = `${bgStyle} ${borderStyle} ${textStyle} border ${emojiConfig.shadow} hover:scale-105`;
                                } else if (hasAct) {
                                    // Day has active item (e.g. word learned) but no journal entry
                                    customClasses = isDark 
                                        ? 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 hover:scale-105' 
                                        : 'bg-emerald-50 border border-emerald-100 text-emerald-950 hover:scale-105';
                                } else {
                                    // Empty inactive day
                                    customClasses = isDark 
                                        ? 'hover:bg-white/5 text-slate-400 font-bold' 
                                        : 'hover:bg-slate-50 text-slate-900 font-bold';
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelDay(dStr)}
                                        title={tooltipText}
                                        className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-300 ${customClasses}`}
                                    >
                                        {/* Day number: top-left if emoji is present, otherwise centered */}
                                        <span className={emojiConfig ? 'absolute top-1 left-1.5 text-[9px] font-black opacity-60' : 'text-[12px]'}>
                                            {dStr.split('-')[2]}
                                        </span>

                                        {/* Emoji representation in the center */}
                                        {emojiConfig ? (
                                            <div className="w-[55%] h-[55%] flex items-center justify-center mt-1.5 animate-pulse-soft">
                                                <img 
                                                    src={emojiConfig.url} 
                                                    alt={coreEmotion} 
                                                    className="w-full h-full object-contain" 
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        const p = target.parentElement;
                                                        if (p) {
                                                            const fallback = document.createElement('span');
                                                            fallback.className = 'text-base';
                                                            fallback.innerText = emojiConfig.emoji;
                                                            p.appendChild(fallback);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            // Fallback dot for active days with only learned words (no journal)
                                            hasAct && !isSel && <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`}></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* WORDS LEARNED TODAY: NEATLY STACKED BELOW CALENDAR */}
                    {learnedWords.length > 0 && (
                        <div className="space-y-6 animate-reveal delay-300">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <Languages className="text-emerald-500" size={16} />
                                </div>
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Words Learned Today</h3>
                            </div>
                            <div className="space-y-4">
                                {learnedWords.map((item, i) => (
                                    <div
                                        key={i}
                                        className={`p-6 rounded-[2rem] border transition-all duration-500 ${isDark ? 'bg-white/[0.03] border-white/5 hover:border-emerald-500/30' : 'bg-white border-slate-100 hover:border-emerald-200 shadow-sm'}`}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className={`text-xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                                                {item.data.word_details?.word || item.data.word || 'Reflective'}
                                            </h4>
                                            <button
                                                onClick={() => navigate(`/search?query=${item.data.word_details?.word || item.data.word}`)}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-white/5 text-slate-500 hover:text-emerald-400' : 'bg-slate-50 text-slate-400 hover:text-emerald-600'}`}
                                            >
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                        <p className={`text-sm font-medium font-serif italic leading-relaxed border-l-2 pl-4 ${isDark ? 'text-slate-500 border-emerald-500/20' : 'text-slate-400 border-emerald-100'}`}>
                                            {item.data.word_details?.metadata?.definition || item.data.metadata?.definition || `A unique emotional node captured during your reflection.`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                {/* 🧬 MAIN CONTENT: STATS (HORIZONTAL) + JOURNAL FEED */}
                <div className="xl:col-span-8 space-y-20 animate-reveal delay-300">

                    {/* STAT CARDS: RESTORED TO HORIZONTAL GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                        <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border shadow-[0_30px_60px_-15px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full min-h-[12rem] md:min-h-[14rem] text-left group transition-all duration-1000 ${isDark ? 'bg-[#111a14]/60 border-white/5' : 'bg-white border-slate-50'}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50/50 text-emerald-600'}`}>
                                <Ribbon size={24} />
                            </div>
                            <div>
                                <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>Journal Nodes</h4>
                                {/* insights.jCount = total all-time journals, not just selected-day entries */}
                                <p className={`text-6xl font-black tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>{insights.jCount}</p>
                            </div>
                        </div>

                        {/* 🔥 STREAK CARD: REPLACED ARCHETYPE */}
                        <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-[0_45px_80px_-20px_rgba(5,6,11,0.2)] flex flex-col justify-between h-full min-h-[12rem] md:min-h-[14rem] text-left group overflow-hidden relative transition-all duration-1000 ${isDark ? 'bg-[#111a14] border border-white/10' : 'bg-slate-950'}`}>
                            <Flame className={`absolute -right-4 -top-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform ${isDark ? 'text-emerald-500' : 'text-orange-500'}`} />
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 relative z-10 ${isDark ? 'bg-white/5 text-emerald-400' : 'bg-white/5 text-orange-500'}`}>
                                <Flame size={24} />
                            </div>
                            <div className="relative z-10">
                                <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>Current Streak</h4>
                                <p className="text-6xl font-black text-white leading-none tracking-tighter" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    {streak} <span className={isDark ? 'text-slate-700 text-lg' : 'text-slate-500 text-lg'}>days</span>
                                </p>
                            </div>
                        </div>

                        <div className="bg-emerald-600 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] text-white shadow-[0_45px_80px_-20px_rgba(80,150,115,0.4)] flex flex-col justify-start relative overflow-hidden h-full min-h-[12rem] md:min-h-[14rem] text-left">
                            <Quote className="absolute -right-8 -bottom-8 w-40 h-40 text-white/10 -rotate-12" />
                            <div className="flex items-center gap-3 relative z-10 mb-5 opacity-80">
                                <Sparkles size={14} />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Master Note</span>
                            </div>
                            <p className="text-base md:text-[17px] font-bold font-serif relative z-10 italic pr-2 leading-relaxed">
                                "{insights.insight}"
                            </p>
                        </div>
                    </div>

                    {/* FEED HEADER */}
                    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-12 border-b pb-16 transition-colors duration-1000 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="text-emerald-500" size={24} />
                                <span className={`text-[11px] font-black uppercase tracking-[0.5em] ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>ARCHIVE FEED</span>
                            </div>
                            <h2 className={`text-4xl md:text-7xl font-black tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                                {new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long' }).format(new Date(selDay))}
                            </h2>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={handleMonthlyExport}
                                disabled={isAnalyzingWeekly}
                                className={`px-8 h-16 rounded-full font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-4 transition-all active:scale-95 disabled:opacity-50 ${isDark ? 'bg-white text-slate-950 hover:bg-emerald-500' : 'bg-slate-950 text-white hover:bg-emerald-600'}`}
                            >
                                {isAnalyzingWeekly ? <Sparkles className="animate-pulse" size={18} /> : <FileText size={18} />}
                                {isAnalyzingWeekly ? 'Generating Report...' : 'Monthly Report'}
                            </button>
                            <button
                                onClick={handleMonthlyExport}
                                disabled={isAnalyzingWeekly}
                                className={`w-16 h-16 rounded-full border flex items-center justify-center transition-all shadow-sm group disabled:opacity-50 ${isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white hover:text-slate-900' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                            >
                                <Download size={24} className="group-hover:translate-y-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* ─── REFLECTION CARDS — CLEAN MAGAZINE EDITORIAL ─── */}
                    {journalEntries.length > 0 && (
                        <div className="mt-16 space-y-5">
                            {journalEntries.map((item, i) => {
                                const isExpanded = expandedEntryId === item.data.entry_id;
                                const hasRuler = item.data.ruler && Object.keys(item.data.ruler).length > 0;
                                const emotions: any[] = item.data.detected_emotions || [];
                                const time = new Date(item.data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <article key={i} className="group">
                                        {/* COLLAPSED ROW — always visible */}
                                        <div
                                            onClick={() => setExpandedEntryId(isExpanded ? null : item.data.entry_id)}
                                            className={`cursor-pointer select-none rounded-2xl border px-6 py-5 flex items-center gap-5 transition-all duration-400 ${
                                                isExpanded
                                                    ? (isDark ? 'bg-[#0e1a10] border-emerald-500/30 rounded-b-none border-b-0' : 'bg-white border-emerald-200 rounded-b-none border-b-0 shadow-lg')
                                                    : (isDark ? 'bg-white/[0.025] border-white/[0.06] hover:bg-white/[0.045] hover:border-white/[0.12]' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md')
                                            }`}
                                        >
                                            {/* NUMBER BADGE */}
                                            <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-[11px] font-black transition-all duration-400 ${
                                                isExpanded ? 'bg-emerald-500 text-white' : (isDark ? 'bg-white/5 text-slate-600' : 'bg-slate-50 text-slate-400')
                                            }`}>
                                                {String(i + 1).padStart(2, '0')}
                                            </div>

                                            {/* ENTRY SNIPPET */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-base font-serif leading-snug truncate transition-colors duration-400 ${
                                                    isExpanded ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-slate-400' : 'text-slate-600')
                                                }`}>
                                                    {item.data.entry_text}
                                                </p>
                                            </div>

                                            {/* EMOTION PILLS — hidden on mobile */}
                                            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                                                {emotions.slice(0, 2).map((e: any, idx: number) => (
                                                    <span key={idx} className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider transition-all ${
                                                        isExpanded
                                                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                                            : (isDark ? 'bg-white/5 text-slate-500 border border-white/5' : 'bg-slate-50 text-slate-400 border border-slate-100')
                                                    }`}>{e.word}</span>
                                                ))}
                                            </div>

                                            {/* TIME */}
                                            <span className={`hidden md:block text-[10px] font-bold uppercase tracking-widest flex-shrink-0 ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>{time}</span>

                                            {/* CHEVRON */}
                                            <ChevronRight size={14} className={`flex-shrink-0 transition-all duration-400 ${
                                                isExpanded ? 'rotate-90 text-emerald-500' : (isDark ? 'text-slate-700 group-hover:text-slate-400' : 'text-slate-300 group-hover:text-slate-500')
                                            }`} />
                                        </div>

                                        {/* EXPANDED DRAWER */}
                                        <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? 'max-h-[8000px]' : 'max-h-0'}`}>
                                            <div
                                                className={`rounded-b-2xl border border-t-0 ${isDark ? 'bg-[#0e1a10] border-emerald-500/30' : 'bg-white border-emerald-200 shadow-lg'}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {isExpanded && (
                                                    <div className="animate-reveal-up-deep">
                                                        {/* FULL ENTRY TEXT */}
                                                        <div className={`px-8 py-8 border-b ${isDark ? 'border-white/5 bg-white/[0.015]' : 'border-slate-100 bg-slate-50/60'}`}>
                                                            <p className={`text-[9px] font-black uppercase tracking-[0.4em] mb-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Full Entry · {time}</p>
                                                            <p className={`text-xl md:text-2xl font-serif leading-[1.9] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                                                {item.data.entry_text}
                                                            </p>
                                                        </div>

                                                        {/* AI REFLECTION */}
                                                        <div className="px-8 py-8 space-y-8">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                                                                    <Sparkles size={13} className="text-emerald-500" />
                                                                </div>
                                                                <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>The Mirror Reflection</span>
                                                            </div>

                                                            {/* 1. EMOTIONAL SIGNATURE */}
                                                            <div className="space-y-3">
                                                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Emotional Signature</span>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {emotions.map((e: any, idx: number) => (
                                                                        <span key={idx} className={`px-4 py-2 rounded-xl text-xs border font-semibold tracking-wide ${isDark ? 'bg-white/[0.03] border-white/10 text-emerald-400' : 'bg-slate-50 border-emerald-100 text-emerald-700'}`}>
                                                                            {e.word}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* 2. EMOTIONAL OBSERVATION */}
                                                            {item.data.emotional_observation && (
                                                                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/50 border-slate-100'}`}>
                                                                    <p className={`text-lg md:text-xl font-serif font-light leading-relaxed italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                                        "{item.data.emotional_observation}"
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* 3. CORE ANALYTICS (RULER OR SIMPLE) */}
                                                            {hasRuler ? (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    {[
                                                                        { label: 'What You’re Feeling',    key: 'section_1' },
                                                                        { label: 'What’s Causing It',      key: 'section_2' },
                                                                        { label: 'A Better Way to See It', key: 'section_3' },
                                                                        { label: 'Try This Now',           key: 'section_4' },
                                                                        { label: 'Think About Tomorrow',   key: 'section_5' },
                                                                    ]
                                                                        .filter(item_meta => item.data.ruler[item_meta.key])
                                                                        .map((item_meta, idx) => (
                                                                            <div key={item_meta.key} className={`relative rounded-2xl border p-5 overflow-hidden ${isDark ? 'bg-white/[0.025] border-white/[0.07]' : 'bg-white border-slate-100 shadow-sm'}`}>
                                                                                <div className="flex items-center gap-2 mb-3">
                                                                                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                                                                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">{item_meta.label}</p>
                                                                                </div>
                                                                                <p className={`text-sm font-serif leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.data.ruler[item_meta.key]}</p>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            ) : (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className={`rounded-2xl p-6 border ${isDark ? 'bg-white/[0.025] border-white/10' : 'bg-white border-slate-100'}`}>
                                                                        <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Strategic Insight</p>
                                                                        <p className={`text-base font-serif leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.data.pattern_insight}</p>
                                                                    </div>
                                                                    <div className={`rounded-2xl p-6 border ${isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'}`}>
                                                                        <p className={`text-[9px] font-black uppercase tracking-widest mb-3 text-emerald-500`}>Regulation</p>
                                                                        <p className={`text-base font-serif leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.data.regulation_suggestion}</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* 4. ACTION PLAN (If exists) */}
                                                            {(() => {
                                                                const actionPlanText = item.data.ruler?.['What can be done'] || item.data.regulation_suggestion;
                                                                if (!actionPlanText) return null;
                                                                return <ActionPlan text={actionPlanText} isDark={isDark} />;
                                                            })()}

                                                            {/* 5. FINAL QUESTION */}
                                                            {item.data.reflection_question && (
                                                                <div className={`rounded-[2.5rem] p-10 border text-center relative overflow-hidden ${isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50/50 border-emerald-100'}`}>
                                                                    <Sparkles className={`w-6 h-6 mx-auto mb-5 text-emerald-500`} />
                                                                    <p className={`text-xl md:text-2xl font-serif font-light leading-relaxed italic ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                                                                        "{item.data.reflection_question}"
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 🧠 THE PREMIUM COGNITIVE REPORT UI */}
                {weeklyReport && (
                    <div id="weekly-cognitive-report" className="mt-32 space-y-12 animate-reveal-up pb-20 no-print">
                        <div className="flex items-center gap-6 mb-16">
                            <div className="h-[2px] w-24 bg-emerald-500"></div>
                            <h3 className={`text-2xl font-black uppercase tracking-[0.4em] ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>Weekly Synthesis</h3>
                            <div className={`h-[2px] flex-1 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
                            <button
                                onClick={handleDownloadWeeklyPDF}
                                className={`px-8 h-12 rounded-full border transition-all font-bold text-[10px] uppercase tracking-widest ${isDark ? 'bg-white/5 border-white/10 text-slate-500 hover:bg-white hover:text-slate-950' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-950 hover:text-white'}`}
                            >
                                <Download size={14} />
                                Generate PDF Report
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* CORE THEME CARD */}
                            <div className="md:col-span-2 bg-slate-950 rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/40">
                                <Fingerprint className="absolute -right-10 -top-10 w-80 h-80 text-emerald-500/10 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                                <div className="relative z-10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-emerald-500 mb-6 block">Core Emotional Phase</span>
                                    <h4 className="text-5xl md:text-8xl font-black tracking-tighter mb-10 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                        {weeklyReport.weekly_theme}.
                                    </h4>
                                    <div className="max-w-3xl">
                                        <p className="text-xl md:text-3xl text-slate-400 font-serif italic leading-relaxed">
                                            "{weeklyReport.emotional_landscape}"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* PSYCHOLOGY INSIGHTS */}
                            <div className={`rounded-[3.5rem] p-12 border shadow-xl shadow-slate-200/20 transition-all duration-1000 ${isDark ? 'bg-[#111a14]/60 border-white/5' : 'bg-white border-slate-100'}`}>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                    <Sparkles size={32} />
                                </div>
                                <h5 className={`text-[11px] font-black uppercase tracking-[0.4em] mb-6 ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>Growth Insight</h5>
                                <p className={`text-2xl font-bold leading-tight mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {weeklyReport.macro_insight}
                                </p>
                                <div className={`pt-8 border-t ${isDark ? 'border-white/5' : 'border-slate-50'}`}>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Growth Milestone</span>
                                    <p className={`mt-3 font-medium italic ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                        {weeklyReport.growth_milestone}
                                    </p>
                                </div>
                            </div>

                            {/* PRESCRIPTIVE FOCUS */}
                            <div className="bg-emerald-600 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-emerald-900/20 flex flex-col justify-between">
                                <div>
                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-8">
                                        <Target size={32} />
                                    </div>
                                    <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-200 mb-6">Prescriptive Focus</h5>
                                    <p className="text-3xl md:text-4xl font-black tracking-tight leading-none mb-8">
                                        {weeklyReport.focus_for_next_week}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 text-emerald-200">
                                    <Zap size={20} className="fill-current" />
                                    <span className="text-xs font-black uppercase tracking-widest">Primed for Integration</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 📋 THE PRECISION PRINT ENGINE */}
            {isPrinting && (
                <div className="print-engine-root" style={{ width: '100%', display: 'block' }}>
                    {/* PAGE 1: COVER */}
                    <div className="print-page first-page" style={{ height: '290mm', padding: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxSizing: 'border-box' }}>
                        <Fingerprint size={160} color="#10b981" style={{ marginBottom: '80px' }} />
                        <h1 style={{ fontSize: '90px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, color: '#0f172a', marginBottom: '30px', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase' }}>
                            GROWTH <br /> PROTOCOL.
                        </h1>
                        <p style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.6em', color: '#cbd5e1', marginBottom: '80px' }}>
                            EMOLIT // CHRONO ARCHIVE
                        </p>
                        <div style={{ width: '80px', height: '6px', backgroundColor: '#10b981', marginBottom: '60px' }}></div>
                        <p style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                            {selDay}
                        </p>
                    </div>

                    {/* SECTION I: WORDS */}
                    {learnedWords.length > 0 && (
                        <div className="print-page" style={{ padding: '80px', minHeight: 'auto', boxSizing: 'border-box' }}>
                            <h2 style={{ fontSize: '40px', fontWeight: 900, color: '#0f172a', marginBottom: '60px', textTransform: 'uppercase', borderBottom: '8px solid #0f172a', paddingBottom: '20px', fontFamily: 'Outfit, sans-serif' }}>
                                I. Linguistic Evolution
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                {learnedWords.map((item, idx) => (
                                    <div key={idx} style={{ padding: '40px', border: '1px solid #f1f5f9', borderRadius: '40px', breakInside: 'avoid' }}>
                                        <h4 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>{item.data.word_details?.word}</h4>
                                        <p style={{ fontSize: '20px', fontFamily: 'Fraunces, serif', fontStyle: 'italic', color: '#64748b', borderLeft: '4px solid #10b981', paddingLeft: '30px', lineHeight: 1.6 }}>
                                            {item.data.word_details?.metadata?.definition}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECTION II: JOURNALS */}
                    {journalEntries.length > 0 && (
                        <div className="print-page clinical-section" style={{ padding: '80px', minHeight: 'auto', boxSizing: 'border-box' }}>
                            <h2 style={{ fontSize: '40px', fontWeight: 900, color: '#0f172a', marginBottom: '60px', textTransform: 'uppercase', borderBottom: '8px solid #0f172a', paddingBottom: '20px', fontFamily: 'Outfit, sans-serif' }}>
                                II. Growth Manifest
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
                                {journalEntries.map((item, idx) => (
                                    <div key={idx} style={{ breakInside: 'avoid', borderBottom: '1px solid #f1f5f9', paddingBottom: '50px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>REF_{idx + 1}</span>
                                            <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>{new Date(item.data.created_at).toLocaleTimeString()}</span>
                                        </div>
                                        <p style={{ fontSize: '24px', lineHeight: 1.6, color: '#0f172a', marginBottom: '40px', fontFamily: 'Fraunces, serif' }}>
                                            {item.data.entry_text}
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                            <div style={{ padding: '30px', backgroundColor: '#f8fafc', borderRadius: '30px' }}>
                                                <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '15px' }}>Pattern</p>
                                                <p style={{ fontSize: '16px', fontWeight: 700, fontStyle: 'italic', color: '#64748b' }}>"{item.data.pattern_insight}"</p>
                                            </div>
                                            <div style={{ padding: '30px', border: '1px solid #f1f5f9', borderRadius: '30px' }}>
                                                <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '15px' }}>Regulation</p>
                                                <p style={{ fontSize: '20px', fontWeight: 800, color: '#065f46' }}>{item.data.regulation_suggestion}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isPrintingWeekly && weeklyReport && (() => {
                const emotionTally: Record<string, number> = {};
                const allJournals = history.filter((i: any) => i.type === 'journal');
                const allWords = history.filter((i: any) => i.type === 'learned_word');
                allJournals.forEach((j: any) => {
                    (j.data?.detected_emotions || []).forEach((e: any) => {
                        const label = e.core || e.word || 'Unknown';
                        emotionTally[label] = (emotionTally[label] || 0) + 1;
                    });
                });
                const totalEmotions = Object.values(emotionTally).reduce((a, b) => a + b, 0) || 1;
                const topEmotions = Object.entries(emotionTally).sort((a, b) => b[1] - a[1]).slice(0, 5);
                const EMOTION_COLORS: Record<string, string> = {
                    Happy: '#10b981', Joy: '#10b981', Excited: '#10b981', Positive: '#10b981',
                    Sad: '#6366f1', Depressed: '#6366f1', Loneliness: '#6366f1', Melancholy: '#6366f1',
                    Angry: '#f43f5e', Frustrated: '#f43f5e', Irritated: '#f43f5e', Rage: '#f43f5e',
                    Fear: '#f59e0b', Anxious: '#f59e0b', Worried: '#f59e0b', Stress: '#f59e0b',
                    Neutral: '#94a3b8', Calm: '#0ea5e9', Reflective: '#a855f7',
                };
                const getColor = (label: string) => EMOTION_COLORS[label] || '#64748b';
                const reportDates = Object.keys(dataMap).sort();
                const periodStart = reportDates[0] ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(reportDates[0])) : '–';
                const periodEnd = reportDates[reportDates.length - 1] ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(reportDates[reportDates.length - 1])) : '–';

                return (
                    <div className="print-engine-root">
                        <div className="print-page first-page" style={{ minHeight: '296mm', width: '210mm', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', padding: '40px 55px' }}>
                            {/* Emerald accent decoration */}
                            <div style={{ position: 'absolute', left: 0, top: 0, width: '5px', height: '100%', background: 'linear-gradient(180deg, #10b981 0%, #059669 40%, #d1fae5 100%)' }} />

                            {/* Top Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Heart size={18} color="white" fill="white" />
                                    </div>
                                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>Emolit</span>
                                </div>
                                <span style={{ fontSize: '10px', fontWeight: 800, color: '#059669', letterSpacing: '0.4em', textTransform: 'uppercase', backgroundColor: '#f0fdf4', padding: '6px 16px', borderRadius: '99px', border: '1px solid #d1fae5' }}>Executive Summary</span>
                            </div>

                            {/* Title & Date */}
                            <div style={{ marginBottom: '50px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ width: '40px', height: '2px', backgroundColor: '#10b981' }} />
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', letterSpacing: '0.4em', textTransform: 'uppercase' }}>Report Cycle: {periodStart} – {periodEnd}</span>
                                </div>
                                <h1 style={{ fontSize: '80px', fontWeight: 900, color: '#0f172a', lineHeight: 0.9, letterSpacing: '-0.04em', margin: '0 0 10px -4px', fontFamily: 'Outfit, sans-serif' }}>
                                    Weekly Report.
                                </h1>
                            </div>

                            {/* Core Emotional Content */}
                            <div style={{ marginBottom: '60px' }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
                                    <div style={{ width: '4px', background: 'linear-gradient(180deg, #10b981, #6366f1)', borderRadius: '99px', flexShrink: 0 }} />
                                    <div>
                                        <p style={{ fontSize: '10px', fontWeight: 800, color: '#10b981', letterSpacing: '0.4em', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Core Emotional Theme</p>
                                        <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', margin: '0 0 12px 0', lineHeight: 1.1, fontFamily: 'Outfit, sans-serif' }}>{weeklyReport.weekly_theme}</h2>
                                        <p style={{ fontSize: '16px', color: '#64748b', margin: 0, fontStyle: 'italic', fontFamily: 'Georgia, serif', lineHeight: 1.6, maxWidth: '520px' }}>{weeklyReport.emotional_landscape}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Growth Intelligence Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '60px' }}>
                                <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '30px', border: '1px solid #f1f5f9' }}>
                                    <p style={{ fontSize: '9px', fontWeight: 800, color: '#059669', letterSpacing: '0.4em', textTransform: 'uppercase', margin: '0 0 12px 0' }}>Key Growth Insight</p>
                                    <p style={{ fontSize: '18px', color: '#1e293b', fontWeight: 500, margin: 0, lineHeight: 1.6, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
                                        "{weeklyReport.macro_insight}"
                                    </p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '24px', padding: '24px', color: 'white' }}>
                                        <p style={{ fontSize: '8px', fontWeight: 800, color: '#d1fae5', letterSpacing: '0.4em', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Prescriptive Focus</p>
                                        <p style={{ fontSize: '20px', fontWeight: 900, margin: 0, lineHeight: 1.2, fontFamily: 'Outfit, sans-serif' }}>{weeklyReport.focus_for_next_week}</p>
                                    </div>
                                    <div style={{ border: '2px solid #f1f5f9', borderRadius: '24px', padding: '24px' }}>
                                        <p style={{ fontSize: '8px', fontWeight: 800, color: '#6366f1', letterSpacing: '0.4em', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Milestone</p>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#475569', margin: 0, lineHeight: 1.4 }}>{weeklyReport.growth_milestone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Frequency Map (Simplified Horizontal Bar) */}
                            <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '30px', border: '1px solid #f1f5f9', marginBottom: '60px' }}>
                                <p style={{ fontSize: '9px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: '20px' }}>Emotional Frequency Landscape</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {topEmotions.map(([label, count]) => {
                                        const percentage = Math.round((count / totalEmotions) * 100);
                                        return (
                                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <span style={{ width: '80px', fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{label}</span>
                                                <div style={{ flex: 1, height: '8px', backgroundColor: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: getColor(label) }} />
                                                </div>
                                                <span style={{ width: '30px', fontSize: '10px', fontWeight: 900, color: getColor(label), textAlign: 'right' }}>{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Bottom Stats Row */}
                            <div style={{ marginTop: 'auto', paddingTop: '30px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0' }}>
                                {[
                                    { label: 'Journal Entries', value: String(allJournals.length) },
                                    { label: 'Words Learned', value: String(allWords.length) },
                                    { label: 'Days Tracked', value: String(Object.keys(dataMap).length) },
                                    { label: 'Emotions Detected', value: String(totalEmotions) },
                                ].map((stat, i) => (
                                    <div key={i} style={{ flex: 1, borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none', paddingLeft: i > 0 ? '25px' : '0' }}>
                                        <p style={{ fontSize: '9px', fontWeight: 800, color: '#10b981', letterSpacing: '0.4em', textTransform: 'uppercase', margin: '0 0 6px 0' }}>{stat.label}</p>
                                        <p style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1, fontFamily: 'Outfit, sans-serif' }}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Symmetrical Footer */}
                            <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '9px', fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.35em', textTransform: 'uppercase' }}>Emolit // Emotional Sovereignty Archive</span>
                                <span style={{ fontSize: '9px', fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.1em' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>

                        {/* PAGE 2: VOCABULARY AUDIT */}
                        {(() => {
                            const weeklyWords = allWords.filter((w: any) => {
                                const d = formatDate(new Date(w.data.created_at));
                                return reportDates.includes(d);
                            });

                            if (weeklyWords.length === 0) return null;

                            return (
                                <div className="print-page clinical-section" style={{ minHeight: '296mm', width: '210mm', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', padding: '60px 55px' }}>
                                    <div style={{ position: 'absolute', left: 0, top: 0, width: '5px', height: '100%', background: 'linear-gradient(180deg, #6366f1 0%, #10b981 100%)' }} />
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #6366f1, #10b981)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Languages size={18} color="white" />
                                            </div>
                                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>Emolit</span>
                                        </div>
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#6366f1', letterSpacing: '0.4em', textTransform: 'uppercase', backgroundColor: '#f5f3ff', padding: '6px 16px', borderRadius: '99px', border: '1px solid #ddd6fe' }}>Linguistic Expansion</span>
                                    </div>

                                    <h2 style={{ fontSize: '56px', fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.02em', margin: '0 0 50px 0', fontFamily: 'Outfit, sans-serif' }}>
                                        Vocabulary <span style={{ color: '#6366f1' }}>Audit.</span>
                                    </h2>

                                    <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '40px', maxWidth: '600px', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
                                        "Linguistic precision is the scalpel of emotional intelligence. By naming the nuance, we gain sovereignty over the experience."
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        {weeklyWords.map((item: any, idx: number) => (
                                            <div key={idx} style={{ padding: '24px', border: '1px solid #f1f5f9', borderRadius: '24px', backgroundColor: '#fcfcfd', breakInside: 'avoid' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                    <h4 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                                                        {item.data.word_details?.word || item.data.word}
                                                    </h4>
                                                    <span style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                                                        {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(item.data.created_at))}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#475569', fontStyle: 'italic', fontFamily: 'Georgia, serif', borderLeft: '3px solid #6366f1', paddingLeft: '15px' }}>
                                                    {item.data.word_details?.metadata?.definition || item.data.metadata?.definition}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.35em', textTransform: 'uppercase' }}>Vocabulary Audit // Section III</span>
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#cbd5e1' }}>Page 02</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                );
            })()}

            <style dangerouslySetInnerHTML={{
                __html: `
                @media screen { .print-engine-root { display: none !important; } }
                @media print {
                    .no-print { display: none !important; }
                    @page { size: A4 portrait; margin: 0mm; }
                    html, body, #root {
                        height: auto !important; overflow: visible !important;
                        margin: 0 !important; padding: 0 !important;
                        display: block !important; position: static !important;
                        background: white !important;
                    }
                    .print-engine-root {
                        display: block !important; height: auto !important;
                        overflow: visible !important; position: static !important;
                        background-color: white !important;
                    }
                    .print-page {
                        display: flex !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        box-sizing: border-box !important;
                    }
                    .first-page { page-break-after: always !important; break-after: page !important; }
                    .clinical-section { page-break-before: always !important; break-before: page !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
                .animate-reveal { animation: reveal 1s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes reveal {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-reveal-up { animation: revealUp 1s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes revealUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            ` }} />
        </div>
    );
};

export default CalendarPage;
