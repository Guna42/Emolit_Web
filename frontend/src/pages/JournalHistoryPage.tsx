import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
    Calendar, Brain, Heart, Sparkles, Activity, Clock, TrendingUp,
    ChevronLeft, ChevronRight, Zap, FileDown, Loader2, Target, Quote
} from 'lucide-react';
import { emotionAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

// ── RULER metadata ───────────────────────────────────────────────────────────
const RULER_META: Record<string, { tagline: string }> = {
    'What You’re Feeling':    { tagline: 'The weather in your heart' },
    'What’s Causing It':      { tagline: 'The roots of your state' },
    'A Better Way to See It': { tagline: 'Naming the experience' },
    'Try This Now':           { tagline: 'The soul\'s validation' },
    'Think About Tomorrow':   { tagline: 'A path to centeredness' },
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

interface JournalEntry {
    entry_id: string;
    entry_text: string;
    detected_emotions: Array<{
        word: string;
        core: string;
        category: string;
    }>;
    emotional_observation: string;
    pattern_insight: string;
    reflection_question: string;
    regulation_suggestion: string;
    ruler?: {
        section_1: string;
        section_2: string;
        section_3: string;
        section_4: string;
        section_5: string;
        "What can be done": string;
        [key: string]: string | undefined;
    };
    created_at: string;
}

interface JournalHistoryResponse {
    entries: JournalEntry[];
    total_count: number;
    page: number;
    page_size: number;
}

const THEMES: Record<string, { bg: string; color: string; border: string; gradient: string }> = {
    'Happy': { bg: 'bg-emerald-50', color: 'text-emerald-600', border: 'border-emerald-100', gradient: 'from-emerald-200 to-teal-50' },
    'Angry': { bg: 'bg-rose-50', color: 'text-rose-600', border: 'border-rose-100', gradient: 'from-rose-200 to-red-50' },
    'Sad': { bg: 'bg-indigo-50', color: 'text-indigo-600', border: 'border-indigo-100', gradient: 'from-indigo-200 to-blue-50' },
    'Fearful': { bg: 'bg-yellow-50', color: 'text-amber-600', border: 'border-amber-100', gradient: 'from-amber-200 to-yellow-50' },
    'Surprised': { bg: 'bg-sky-50', color: 'text-sky-600', border: 'border-sky-100', gradient: 'from-sky-200 to-blue-50' },
    'Disgusted': { bg: 'bg-teal-50', color: 'text-teal-600', border: 'border-teal-100', gradient: 'from-teal-200 to-emerald-50' },
    'Bad': { bg: 'bg-slate-100', color: 'text-slate-600', border: 'border-slate-200', gradient: 'from-slate-300 to-gray-50' },
};

const JournalHistoryPage: React.FC = () => {
    const { isDark } = useTheme();
    const { token } = useAuth();
    const [history, setHistory] = useState<JournalHistoryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, [page]);

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/journal/history?page=${page}&page_size=10`);
            setHistory(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to load archive');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await emotionAPI.exportReport();
        } catch (err) {
            console.error("Export failed:", err);
            alert("Failed to generate neural report. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            full: date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            weekday: date.toLocaleDateString('en-US', { weekday: 'long' })
        };
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-10 transition-colors duration-1000 ${isDark ? 'bg-[#0a0f0d]' : 'bg-[#FBFBFC]'}`}>
                <Zap className="w-12 h-12 text-emerald-500 animate-pulse mb-4" />
                <p className={`font-bold uppercase tracking-widest text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Syncing Archive...</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen pb-20 pt-24 md:pt-32 px-4 md:px-8 transition-colors duration-1000 ${isDark ? 'bg-[#0a0f0d]' : 'bg-[#FBFBFC]'}`}>
            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm mb-4 transition-all duration-1000 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            <span className={`text-[10px] font-black tracking-widest uppercase transition-colors duration-1000 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Past Reflections</span>
                        </div>
                        <h1 className={`text-4xl md:text-5xl font-black leading-tight transition-colors duration-1000 ${isDark ? 'text-white' : 'text-slate-900'}`}>Your <span className="mirror-text">Reflection</span> History</h1>
                    </div>
                    {history && history.total_count > 0 && (
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            {/* Monthly Report Button */}
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className={`group relative flex items-center gap-3 px-6 py-4 rounded-3xl border shadow-sm transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 ${isDark ? 'bg-emerald-600 border-transparent' : 'bg-emerald-50 border-emerald-100'}`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl`} />
                                {isExporting ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <FileDown className={`${isDark ? 'text-white' : 'text-emerald-600'} w-5 h-5 relative z-10`} />}
                                <div className="text-left relative z-10">
                                    <div className={`text-xs font-black uppercase tracking-wider leading-none ${isDark ? 'text-white' : 'text-emerald-700'}`}>Download</div>
                                    <div className={`text-[10px] font-bold uppercase tracking-tighter mt-1 ${isDark ? 'text-emerald-100' : 'text-emerald-500'}`}>Monthly Neural Report</div>
                                </div>
                            </button>

                            <div className={`px-6 py-4 rounded-3xl border shadow-sm flex items-center gap-4 transition-all duration-1000 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'}`}>
                                <TrendingUp className="text-emerald-500 w-6 h-6" />
                                <div>
                                    <div className={`text-2xl font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{history.total_count}</div>
                                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Entries Saved</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl mb-8 flex items-center gap-4 text-rose-600">
                        <Activity className="w-6 h-6" />
                        <p className="font-bold">{error}</p>
                    </div>
                )}

                {/* No entries */}
                {history && history.entries.length === 0 && (
                    <div className={`rounded-[3rem] p-16 text-center border shadow-sm flex flex-col items-center max-w-2xl mx-auto mt-20 transition-all duration-1000 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'}`}>
                        <Calendar className={`w-16 h-16 mb-6 ${isDark ? 'text-slate-800' : 'text-slate-200'}`} />
                        <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>The mirror is empty</h2>
                        <p className={`mb-8 max-w-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>You haven't documented any emotional fragments yet. Start your first journal entry to begin your protocol.</p>
                        <a href="/journal" className={`px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform ${isDark ? 'bg-emerald-500 text-[#0a0f0d]' : 'bg-slate-950 text-white'}`}>
                            Start Journaling
                        </a>
                    </div>
                )}

                {/* Entries List */}
                {history && history.entries.length > 0 && (
                    <div className="grid grid-cols-1 gap-12">
                        {history.entries.map((entry) => {
                            const dominantCore = entry.detected_emotions[0]?.core || 'Bad';
                            const theme = THEMES[dominantCore] || THEMES['Bad'];

                            return (
                                <div key={entry.entry_id} className="group relative">
                                    {/* Timeline accent */}
                                    <div className={`hidden lg:block absolute -left-12 top-1/2 -translate-y-1/2 w-8 h-px transition-colors duration-1000 ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}></div>

                                    <div className={`rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 border transition-all duration-1000 overflow-hidden ${isDark ? 'bg-[#111a14]/60 border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] hover:bg-[#111a14]' : 'bg-white border-slate-100 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)]'}`}>

                                        {/* Entry Header: Date & Emotions */}
                                        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-10 border-b transition-colors duration-1000 ${isDark ? 'border-white/5' : 'border-slate-50'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border transition-all duration-1000 ${isDark ? 'bg-white/5 text-emerald-400 border-white/10' : `${theme.bg} ${theme.color} ${theme.border}`}`}>
                                                    <Calendar size={24} />
                                                </div>
                                                <div>
                                                    <h3 className={`text-xl md:text-xl font-black tracking-tight transition-colors duration-1000 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatDate(entry.created_at).weekday}, {formatDate(entry.created_at).full}</h3>
                                                    <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-widest mt-1 transition-colors duration-1000 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                        <Clock size={12} /> {formatDate(entry.created_at).time}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {entry.detected_emotions.map((e, idx) => (
                                                    <span key={idx} className={`px-4 py-2 rounded-xl border font-black text-[10px] md:text-xs uppercase tracking-wider backdrop-blur-sm transition-all duration-1000 ${isDark ? (THEMES[e.core]?.color ? 'text-emerald-500/50 border-white/5 bg-white/[0.02]' : 'text-slate-600 border-white/5 bg-white/[0.02]') : `${THEMES[e.core]?.color || 'text-slate-500'} ${THEMES[e.core]?.border || 'border-slate-100'} bg-white/50`}`}>
                                                        {e.word}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Entry Content: CLEAN MAGAZINE EDITORIAL */}
                                        <div className="space-y-12">
                                            {/* FULL ENTRY TEXT */}
                                            <div className={`p-8 md:p-12 rounded-[2.5rem] border ${isDark ? 'bg-white/[0.015] border-white/5' : 'bg-slate-50/60 border-slate-100'}`}>
                                                <p className={`text-[9px] font-black uppercase tracking-[0.4em] mb-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Full Document</p>
                                                <p className={`text-xl md:text-2xl font-serif leading-[1.9] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                                    {entry.entry_text}
                                                </p>
                                            </div>

                                            {/* AI REFLECTION SECTION */}
                                            <div className="space-y-10">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                                                        <Sparkles size={16} className="text-emerald-500" />
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase tracking-[0.5em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>The Mirror Reflection</span>
                                                </div>

                                                <div className="grid grid-cols-1 gap-8">
                                                    {/* 1. EMOTIONAL SIGNATURE */}
                                                    <div className="space-y-4">
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Emotional Signature</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {entry.detected_emotions.map((e, idx) => (
                                                                <span key={idx} className={`px-5 py-2.5 rounded-xl text-xs border font-bold tracking-wide ${isDark ? 'bg-white/[0.03] border-white/10 text-emerald-400' : 'bg-white border-emerald-100 text-emerald-700 shadow-sm'}`}>
                                                                    {e.word}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* 2. EMOTIONAL OBSERVATION */}
                                                    <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/50 border-slate-100 shadow-sm'}`}>
                                                        <p className={`text-xl md:text-2xl font-serif font-light leading-relaxed italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                            "{entry.emotional_observation}"
                                                        </p>
                                                    </div>

                                                    {/* 3. CORE ANALYTICS (RULER OR SIMPLE) */}
                                                    {(() => {
                                                        const ruler = entry.ruler;
                                                        if (ruler) {
                                                            return (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    {[
                                                                        { label: 'What You’re Feeling',    key: 'section_1' },
                                                                        { label: 'What’s Causing It',      key: 'section_2' },
                                                                        { label: 'A Better Way to See It', key: 'section_3' },
                                                                        { label: 'Try This Now',           key: 'section_4' },
                                                                        { label: 'Think About Tomorrow',   key: 'section_5' },
                                                                    ]
                                                                        .filter(meta => ruler[meta.key])
                                                                        .map((meta, idx) => (
                                                                            <RulerCard 
                                                                                key={meta.key}
                                                                                index={idx + 1}
                                                                                label={meta.label}
                                                                                text={ruler[meta.key] || ''}
                                                                                isDark={isDark}
                                                                            />
                                                                        ))}
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div className={`rounded-3xl p-8 border ${isDark ? 'bg-white/[0.025] border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                                                                    <div className="flex items-center gap-2 mb-4">
                                                                        <Brain size={16} className="text-emerald-500" />
                                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Strategic Insight</p>
                                                                    </div>
                                                                    <p className={`text-lg font-serif leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{entry.pattern_insight}</p>
                                                                </div>
                                                                <div className={`rounded-3xl p-8 border ${isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100 shadow-sm'}`}>
                                                                    <div className="flex items-center gap-2 mb-4">
                                                                        <Zap size={16} className="text-emerald-500" />
                                                                        <p className={`text-[10px] font-black uppercase tracking-widest text-emerald-500`}>Regulation</p>
                                                                    </div>
                                                                    <p className={`text-lg font-serif leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{entry.regulation_suggestion}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* 4. ACTION PLAN */}
                                                    {(() => {
                                                        const actionPlanText = entry.ruler?.['What can be done'] || entry.regulation_suggestion;
                                                        if (!actionPlanText) return null;
                                                        return <ActionPlan text={actionPlanText} isDark={isDark} />;
                                                    })()}

                                                    {/* 5. FINAL QUESTION */}
                                                    <div className={`rounded-[3rem] p-12 border text-center relative overflow-hidden ${isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50/50 border-emerald-100 shadow-sm'}`}>
                                                        <Quote className={`absolute -left-4 -top-4 w-24 h-24 transition-opacity duration-1000 ${isDark ? 'text-white/[0.03]' : 'text-slate-100/50'}`} />
                                                        <Sparkles className={`w-8 h-8 mx-auto mb-6 text-emerald-500`} />
                                                        <p className={`text-2xl md:text-3xl font-serif font-light leading-relaxed italic relative z-10 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                                                            "{entry.reflection_question}"
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {history && history.total_count > history.page_size && (
                    <div className="flex items-center justify-center gap-8 mt-20">
                        <button
                            onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                            disabled={page === 1}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest disabled:opacity-30 hover:shadow-lg transition-all active:scale-95 ${isDark ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-white text-slate-900 border-slate-200'}`}
                        >
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <span className={`font-black text-xs uppercase tracking-[0.4em] transition-colors duration-1000 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Page {page} <span className={`mx-2 ${isDark ? 'text-slate-800' : 'text-slate-200'}`}>/</span> {Math.ceil(history.total_count / history.page_size)}
                        </span>
                        <button
                            onClick={() => { setPage((p) => p + 1); window.scrollTo(0, 0); }}
                            disabled={page >= Math.ceil(history.total_count / history.page_size)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest disabled:opacity-30 hover:shadow-lg transition-all active:scale-95 shadow-xl ${isDark ? 'bg-emerald-500 text-[#0a0f0d]' : 'bg-slate-950 text-white'}`}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JournalHistoryPage;

