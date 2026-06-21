import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { useTheme } from '../contexts/ThemeContext';
import { emotionAPI } from '../services/api';
import { Check, Clock, Target, Activity, Sparkles, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

const DONE_GREETINGS = [
  { title:"You did it!", msg:"That took courage. Every intention you honour is a conversation with your future self. We're proud of you." },
  { title:"Beautiful.", msg:"Showing up for yourself — even in small ways — rewires everything. This moment counts." },
  { title:"Look at you go.", msg:"Consistency isn't about perfection. It's about returning. And you just returned. That's everything." },
  { title:"Growth in action.", msg:"You set an intention and you kept it. That's not small. That's who you're becoming." },
];

const LATE_GREETINGS = [
  { title:"Better late than never.", msg:"You came back to it. That shows true resilience. Most people just let it slide, but you closed the loop." },
  { title:"Still counts.", msg:"Time slipped away, but your intention didn't. You honoured your word to yourself today, and that builds real trust." },
  { title:"Way to return.", msg:"You didn't give up on the task just because the perfect moment passed. That is what emotional endurance looks like." }
];

const MOTIVATIONS = [
  "Tomorrow is still yours. The fact that you're here, reflecting on what got in the way, is already a step forward.",
  "Missing once doesn't break a streak — hiding from it does. You're not hiding. That alone means everything.",
  "Compassion starts with yourself. You don't owe perfection. You owe yourself honesty, and you just gave that.",
  "Growth isn't a straight line. It curves, it pauses, it breathes. You're in a breathing moment. Rest here.",
];

function safeNewDate(val: any): Date {
  if (!val) return new Date(NaN);
  const num = Number(val);
  const d = !isNaN(num) ? new Date(num) : new Date(val);
  return d;
}

function formatDateString(val: any): string {
  try {
    const d = val instanceof Date ? val : safeNewDate(val);
    if (isNaN(d.getTime())) return 'invalid-date';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch (e) {
    return 'invalid-date';
  }
}

function fmtDateObj(ms: number) {
  if (!ms) return 'No time set';
  const d = safeNewDate(ms);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}


export default function RemindersPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { allReminders, markComplete, markFailed, cancel } = useNotification();

  const [activeFilter, setActiveFilter] = useState<'tobedone' | 'overdue' | 'completed' | 'missed'>('tobedone');
  const [doneModalId, setDoneModalId] = useState<string | null>(null);
  const [failModalId, setFailModalId] = useState<string | null>(null);
  const [failReason, setFailReason] = useState('');
  const [randomGreeting, setRandomGreeting] = useState(DONE_GREETINGS[0]);
  const [randomMotivation, setRandomMotivation] = useState(MOTIVATIONS[0]);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const res = await emotionAPI.getJournalHistory();
        const entries = res.entries || [];
        
        const dataMap: Record<string, any[]> = {};
        entries.forEach((item: any) => {
            const rawCreatedAt = item.data?.created_at || item.created_at;
            if (!rawCreatedAt) return;
            const key = formatDateString(new Date(rawCreatedAt)); 
            if (key === 'invalid-date') return;
            if (!dataMap[key]) dataMap[key] = [];
            dataMap[key].push(item);
        });

        const dates = Object.keys(dataMap).filter(d => d !== "invalid-date").sort().reverse();
        if (dates.length === 0) {
            setStreak(0);
            return;
        }
        
        let count = 0;
        let curr = new Date();
        curr.setHours(0, 0, 0, 0);

        for (let i = 0; i < dates.length; i++) {
            const [y, m, d] = dates[i].split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const diff = Math.round((curr.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
            if (diff === 0 || diff === 1) {
                count++;
                curr = dateObj;
            } else if (diff > 1) {
                break;
            }
        }
        setStreak(count);
      } catch (e) {
        console.error("Failed to fetch streak", e);
      }
    };
    fetchStreak();
  }, []);

  // Map to UI statuses
  const mappedReminders = useMemo(() => {
    return allReminders.map(r => {
      let uiStatus: 'tobedone' | 'overdue' | 'completed' | 'missed' = 'tobedone';
      if (r.status === 'completed') uiStatus = 'completed';
      else if (r.status === 'failed') uiStatus = 'missed';
      else if (r.fired && r.status === 'pending') uiStatus = 'overdue';
      return { ...r, uiStatus, isFailed: r.status === 'failed' };
    }).sort((a, b) => b.remindAt - a.remindAt);
  }, [allReminders]);

  // Total stats independent of date selection
  const total = mappedReminders.length;
  const completedCount = mappedReminders.filter(r => r.uiStatus === 'completed').length;
  const missedCount = mappedReminders.filter(r => r.uiStatus === 'missed').length;
  const pendingCount = mappedReminders.filter(r => r.uiStatus === 'tobedone' || r.uiStatus === 'overdue').length;

  // Filter list by selectedDate AND tab
  const filtered = useMemo(() => {
    const dateFiltered = mappedReminders.filter(r => {
        if (!r.remindAt) return false;
        return formatDateString(r.remindAt) === formatDateString(selectedDate);
    });
    return dateFiltered.filter(r => r.uiStatus === activeFilter);
  }, [mappedReminders, activeFilter, selectedDate]);


  // Actions
  const handleCheckClick = (r: typeof mappedReminders[0]) => {
    if (r.uiStatus === 'completed' || r.uiStatus === 'missed') return;
    if (r.uiStatus === 'overdue') {
      setRandomGreeting(LATE_GREETINGS[Math.floor(Math.random() * LATE_GREETINGS.length)]);
    } else {
      setRandomGreeting(DONE_GREETINGS[Math.floor(Math.random() * DONE_GREETINGS.length)]);
    }
    setDoneModalId(r.id);
  };

  const handleFailClick = (r: typeof mappedReminders[0]) => {
    setRandomMotivation(MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)]);
    setFailModalId(r.id);
    setFailReason('');
  };

  const submitDone = () => {
    if (doneModalId) {
      markComplete(doneModalId);
      setDoneModalId(null);
    }
  };

  const submitFail = () => {
    if (failModalId) {
      setSaving(true);
      markFailed(failModalId, failReason);
      setSaving(false);
      setFailModalId(null);
      setFailReason('');
    }
  };

  const handleDelete = (r: typeof mappedReminders[0]) => {
    if (r.status === 'pending') cancel(r.stepIndex, r.stepText);
  };

  // Calendar logic
  const generateCalendarDays = (currentDate: Date) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };
  const calendarDays = generateCalendarDays(selectedDate);

  const shiftMonth = (offset: number) => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + offset, 1));
  };

  return (
    <div className={`min-h-screen pb-32 pt-20 transition-colors duration-700 overflow-x-hidden relative ${isDark ? 'bg-[#0a0f0d] text-white' : 'bg-[#F8FAFC] text-slate-900'}`}>
      
      {/* ── AMBIENT BACKGROUND GLOWS ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-[-10%] right-[-5%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.06)_0%,transparent_60%)] blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.04)_0%,transparent_60%)] blur-[120px]" />
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] right-[-5%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.04)_0%,transparent_60%)] blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.02)_0%,transparent_60%)] blur-[120px]" />
          </>
        )}
      </div>

      <div className="relative z-10 max-w-[1550px] mx-auto px-4 md:px-8">
        

        {/* ── HEADER ── */}
        <div className="relative pb-8 text-center max-w-2xl mx-auto">
          <p className={`text-[9px] font-bold uppercase tracking-[0.35em] mb-4 flex items-center justify-center gap-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <span className="w-8 h-px bg-current opacity-50"></span>
            Journal Reminders
            <span className="w-8 h-px bg-current opacity-50"></span>
          </p>

          <h1 className={`text-4xl sm:text-5xl font-black tracking-tighter mb-4 leading-[0.95] ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Your <span className="font-serif italic text-emerald-500 font-medium">Intentions,</span><br/>Held With Care.
          </h1>

          <p className={`text-sm md:text-base font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Reminders set from your journal entries — gentle nudges tied to your emotional practice.
          </p>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
          
          {/* COLUMN 1: LEFT SIDEBAR (CALENDAR ONLY) */}
          <div className="lg:col-span-3 xl:col-span-3 lg:sticky lg:top-32 self-start">
            
            {/* BOX 2: CALENDAR */}
            <div className={`rounded-[2.5rem] p-6 md:p-8 transition-all ${isDark ? 'bg-[#111a14]/80 border border-white/5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]' : 'bg-white border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)]'}`}>
              <div className="flex justify-between items-center mb-6">
                 <button onClick={() => shiftMonth(-1)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                    <ChevronLeft size={16} />
                 </button>
                 <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                 </div>
                 <button onClick={() => shiftMonth(1)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                    <ChevronRight size={16} />
                 </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-3">
                 {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{d}</div>
                 ))}
              </div>
              
              <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                 {calendarDays.map((date, i) => {
                    if (!date) return <div key={i} className="p-2"></div>;
                    const isSelected = formatDateString(date) === formatDateString(selectedDate);
                    const hasTask = mappedReminders.some(r => r.remindAt && formatDateString(r.remindAt) === formatDateString(date));
                    
                    return (
                       <button 
                          key={i} 
                          onClick={() => setSelectedDate(date)}
                          className={`w-9 h-9 mx-auto rounded-full flex flex-col items-center justify-center text-xs font-semibold transition-all duration-300 relative
                            ${isSelected ? (isDark ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-110 z-10' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110 z-10') 
                            : hasTask ? (isDark ? 'bg-emerald-950/40 border-2 border-emerald-500/40 text-emerald-400 shadow-[0_2px_8px_rgba(16,185,129,0.25)] scale-105' : 'bg-emerald-50 border-2 border-emerald-200 text-emerald-700 shadow-[0_2px_8px_rgba(16,185,129,0.15)] scale-105') 
                            : (isDark ? 'text-slate-500 hover:bg-white/5 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700')}`}
                       >
                          <span className={hasTask ? 'translate-y-[-2px]' : ''}>{date.getDate()}</span>
                          {hasTask && (
                             <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? (isDark ? 'bg-[#0a0f0d]' : 'bg-white') : (isDark ? 'bg-emerald-400' : 'bg-emerald-500')}`} />
                          )}
                       </button>
                    );
                 })}
              </div>
            </div>
          </div>

          {/* COLUMN 2: CENTER (TIMELINE LIST) */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
              <div>
                <h2 className={`text-3xl font-black tracking-tight mb-2 flex items-center gap-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Timeline
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest ${isDark ? 'bg-white/10 text-emerald-400' : 'bg-slate-100 text-emerald-600'}`}>
                     {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </h2>
                <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {filtered.length} intention{filtered.length !== 1 ? 's' : ''} for this date
                </div>
              </div>

              {/* TABS */}
              <div className={`flex p-1.5 rounded-full ${isDark ? 'bg-[#111a14] border border-white/5' : 'bg-white border border-slate-200 shadow-sm'}`}>
                {(['tobedone', 'overdue', 'completed', 'missed'] as const).map(tab => {
                  const isActive = activeFilter === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? (isDark ? 'bg-white text-black shadow-lg' : 'bg-slate-900 text-white shadow-md') : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')}`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {filtered.length === 0 ? (
                <div className={`rounded-[3rem] p-20 text-center border transition-all ${isDark ? 'bg-[#111a14]/40 border-white/5' : 'bg-white border-dashed border-slate-200'}`}>
                  <div className={`text-7xl font-serif italic mb-6 opacity-20 ${isDark ? 'text-emerald-500' : 'text-slate-400'}`}>∞</div>
                  <h3 className={`text-3xl font-black mb-4 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Clear Horizon</h3>
                  <p className={`text-lg max-w-md mx-auto mb-10 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    No reminders found for this specific date. Check another day on the calendar.
                  </p>
                </div>
              ) : (
                filtered.map((r, i) => {
                  const isDone = r.uiStatus === 'completed';
                  const isMissed = r.uiStatus === 'missed';
                  const isOverdue = r.uiStatus === 'overdue';
                  
                  return (
                    <div key={r.id} className={`group relative rounded-[2.5rem] p-8 md:p-10 transition-all duration-700 ${isDone || isMissed ? 'opacity-60 hover:opacity-100 grayscale hover:grayscale-0' : ''} ${isDark ? 'bg-[#111a14]/80 border border-white/5 hover:border-emerald-500/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-1' : 'bg-white border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.08)] hover:border-slate-200 hover:-translate-y-1'}`}>
                      
                      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className={`text-xs font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                              {safeNewDate(r.remindAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></span>
                            
                            {isDone && !r.isFailed && <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>Completed</span>}
                            {isOverdue && <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>Overdue</span>}
                            {!isDone && !isOverdue && !isMissed && <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>To Be Done</span>}
                            {isMissed && <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600 border border-rose-200'}`}>Missed</span>}
                          </div>
                          
                          <p className={`text-xl md:text-2xl font-serif italic leading-relaxed mb-6 ${isDone ? 'line-through decoration-slate-500/30' : ''} ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                            "{r.stepText}"
                          </p>

                          {r.isFailed && r.failReason && (
                            <div className={`mb-6 p-5 rounded-2xl border font-serif italic text-lg leading-relaxed ${isDark ? 'bg-rose-500/5 border-rose-500/10 text-rose-200' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                              "{r.failReason}"
                            </div>
                          )}
                          
                          {r.wordName && (
                            <Link to={`/explore/${r.wordName}`} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                              <Target className="w-3.5 h-3.5" /> Context: {r.wordName}
                            </Link>
                          )}
                        </div>

                        {/* HIGH-END CIRCULAR ACTION BUTTONS */}
                        {!isDone && !isMissed && (
                          <div className="flex flex-row gap-4 shrink-0 mt-4 md:mt-0 md:pl-8 border-t md:border-t-0 md:border-l pt-6 md:pt-0 border-slate-200 dark:border-white/10 w-full md:w-auto justify-end">
                            <button 
                              onClick={() => handleCheckClick(r)} 
                              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2 shadow-lg group hover:-translate-y-1 relative overflow-hidden ${isDark ? 'bg-[#0a0f0d] border-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] text-emerald-500' : 'bg-white border-emerald-300 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] text-emerald-500'}`} 
                              title={isOverdue ? "Complete Late" : "Complete"}
                            >
                              <Check className="w-6 h-6 transition-transform group-hover:scale-110 relative z-10" />
                              <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </button>
                            
                            {isOverdue && (
                              <button 
                                onClick={() => handleFailClick(r)} 
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2 shadow-lg group hover:-translate-y-1 relative overflow-hidden ${isDark ? 'bg-[#0a0f0d] border-rose-500/30 hover:border-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] text-rose-500' : 'bg-white border-rose-300 hover:border-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] text-rose-500'}`} 
                                title="Missed Task"
                              >
                                <X className="w-6 h-6 transition-transform group-hover:scale-110 relative z-10" />
                                <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </button>
                            )}

                            {!isOverdue && (
                              <button 
                                onClick={() => handleDelete(r)} 
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2 shadow-lg group hover:-translate-y-1 relative overflow-hidden ${isDark ? 'bg-[#0a0f0d] border-slate-600/50 hover:border-slate-400 hover:shadow-[0_0_20px_rgba(148,163,184,0.1)] text-slate-400' : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-[0_0_20px_rgba(148,163,184,0.1)] text-slate-500'}`} 
                                title="Cancel Reminder"
                              >
                                <X className="w-6 h-6 transition-transform group-hover:scale-110 relative z-10" />
                                <div className="absolute inset-0 bg-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 3: RIGHT SIDEBAR (STATS, STREAK, QUOTE) */}
          <div className="lg:col-span-3 xl:col-span-3 lg:sticky lg:top-32 self-start space-y-6">
            
            {/* BOX 1: STATS OVERVIEW */}
            <div className={`rounded-[2.5rem] p-6 md:p-8 transition-all ${isDark ? 'bg-[#111a14]/80 border border-white/5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]' : 'bg-white border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)]'}`}>
              <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 mb-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <Activity className="w-4 h-4" /> Global Action Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-3xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
                   <div className={`text-3xl font-light mb-1 tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>{total}</div>
                   <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total Tasks</div>
                </div>
                <div className={`p-4 rounded-3xl ${isDark ? 'bg-emerald-500/10 border border-emerald-500/10' : 'bg-emerald-50 border border-emerald-100'}`}>
                   <div className={`text-3xl font-light mb-1 tracking-tighter ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{completedCount}</div>
                   <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>Completed</div>
                </div>
                <div className={`p-4 rounded-3xl ${isDark ? 'bg-rose-500/10 border border-rose-500/10' : 'bg-rose-50 border border-rose-100'}`}>
                   <div className={`text-3xl font-light mb-1 tracking-tighter ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>{missedCount}</div>
                   <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-rose-500/70' : 'text-rose-600/70'}`}>Missed</div>
                </div>
                <div className={`p-4 rounded-3xl ${isDark ? 'bg-amber-500/10 border border-amber-500/10' : 'bg-amber-50 border border-amber-100'}`}>
                   <div className={`text-3xl font-light mb-1 tracking-tighter ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{pendingCount}</div>
                   <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-amber-500/70' : 'text-amber-600/70'}`}>Pending</div>
                </div>
              </div>
            </div>

            {/* BOX 2: STREAK & JOURNAL LINK */}
            <div className={`rounded-[2.5rem] p-6 md:p-8 transition-all bg-[#111a14] border border-white/5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] text-white`}>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-4xl font-bold text-white tracking-tighter leading-none">{streak}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 mt-2 whitespace-nowrap">Day Streak</div>
                </div>
                <div className="flex-1 text-[11px] text-slate-300 leading-relaxed pl-4 border-l border-white/10">
                  These reminders trace back to your journal. Keep writing, keep growing.
                </div>
                <div className="text-2xl shrink-0">🔥</div>
              </div>
              
              <div className="h-px w-full my-6 bg-white/10"></div>

              <Link to="/journal" className="group block">
                 <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-emerald-400 transition-colors duration-300">
                    <span className="text-xs">↗</span> Go to Journal
                 </div>
                 <p className="font-serif italic text-sm leading-relaxed transition-colors duration-300 text-slate-300 group-hover:text-white">
                    "Your journal is where these intentions were born."
                 </p>
              </Link>
            </div>

            {/* BOX 3: QUOTE */}
            <div className={`rounded-[2.5rem] p-8 md:p-10 transition-all relative overflow-hidden group ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.1)]' : 'bg-emerald-700 text-white shadow-[0_20px_60px_-15px_rgba(16,185,129,0.3)]'}`}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="relative z-10">
                <span className={`text-5xl font-serif leading-[0.5] block mb-2 opacity-50 ${isDark ? 'text-emerald-400' : 'text-white'}`}>“</span>
                <p className={`text-base font-serif italic leading-relaxed ${isDark ? 'text-slate-200' : 'text-emerald-50'}`}>
                  Emotional growth isn't a race — it's a practice. Every moment you show up is the whole point.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* DONE MODAL */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${doneModalId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`absolute inset-0 transition-opacity duration-500 ${doneModalId ? 'opacity-100' : 'opacity-0'} ${isDark ? 'bg-[#0a0f0d]/90 backdrop-blur-xl' : 'bg-slate-900/60 backdrop-blur-md'}`} onClick={() => setDoneModalId(null)} />
        <div className={`relative w-full max-w-2xl p-12 md:p-16 rounded-[3rem] shadow-2xl transition-all duration-700 delay-100 ${doneModalId ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'} ${isDark ? 'bg-[#111a14] border border-white/10 shadow-[0_0_80px_-20px_rgba(16,185,129,0.3)]' : 'bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)]'}`}>
          
          <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-50 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-300/30'}`} />

          <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner relative z-10 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
            <Sparkles className={`w-10 h-10 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
          </div>
          
          <h2 className={`text-4xl md:text-5xl font-serif font-black tracking-tighter text-center mb-6 relative z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>{randomGreeting.title}</h2>
          
          <div className={`p-8 rounded-[2rem] text-center font-serif italic text-xl md:text-2xl leading-relaxed mb-10 relative z-10 ${isDark ? 'bg-white/[0.02] border border-white/5 text-slate-200' : 'bg-slate-50 border border-slate-100 text-slate-700'}`}>
            "{allReminders.find(r => r.id === doneModalId)?.stepText}"
          </div>
          
          <p className={`text-center text-lg leading-relaxed mb-12 max-w-lg mx-auto relative z-10 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{randomGreeting.msg}</p>
          
          <button onClick={submitDone} className={`w-full py-6 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500 hover:-translate-y-1 relative z-10 ${isDark ? 'bg-emerald-500 text-[#0a0f0d] hover:bg-emerald-400 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)]' : 'bg-slate-900 text-white hover:bg-black shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]'}`}>
            That feels good ✦
          </button>
        </div>
      </div>

      {/* FAIL/MISSED MODAL */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${failModalId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`absolute inset-0 transition-opacity duration-500 ${failModalId ? 'opacity-100' : 'opacity-0'} ${isDark ? 'bg-[#0a0f0d]/90 backdrop-blur-xl' : 'bg-slate-900/60 backdrop-blur-md'}`} onClick={() => setFailModalId(null)} />
        <div className={`relative w-full max-w-2xl p-12 md:p-16 rounded-[3rem] shadow-2xl transition-all duration-700 delay-100 ${failModalId ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'} ${isDark ? 'bg-[#111a14] border border-white/10 shadow-[0_0_80px_-20px_rgba(244,63,94,0.2)]' : 'bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)]'}`}>
          
          <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-50 ${isDark ? 'bg-rose-500/10' : 'bg-rose-300/30'}`} />

          <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner relative z-10 ${isDark ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-rose-50 border border-rose-100'}`}>
            <AlertCircle className={`w-10 h-10 ${isDark ? 'text-rose-400' : 'text-rose-500'}`} />
          </div>
          
          <h2 className={`text-4xl md:text-5xl font-serif font-black tracking-tighter text-center mb-6 relative z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>That's okay.</h2>
          
          <div className={`p-8 rounded-[2rem] text-center font-serif italic text-xl md:text-2xl leading-relaxed mb-10 relative z-10 ${isDark ? 'bg-white/[0.02] border border-white/5 text-slate-200' : 'bg-slate-50 border border-slate-100 text-slate-700'}`}>
            <textarea 
               className={`w-full bg-transparent resize-none outline-none text-center placeholder-slate-400 ${isDark ? 'text-white' : 'text-slate-900'}`}
               placeholder="What happened? A single word is enough…" 
               value={failReason}
               onChange={e => setFailReason(e.target.value)}
               rows={2}
               autoFocus
             />
          </div>
          
          <p className={`text-center text-lg leading-relaxed mb-12 max-w-lg mx-auto relative z-10 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
             "{randomMotivation}"
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <button onClick={() => setFailModalId(null)} disabled={saving} className={`flex-1 py-6 rounded-full border text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${isDark ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
              Skip for now
            </button>
            <button onClick={submitFail} disabled={saving || !failReason.trim()} className={`flex-[1.5] py-6 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${!saving && failReason.trim() ? 'hover:-translate-y-1' : ''} ${isDark ? 'bg-rose-500 text-[#0a0f0d] hover:bg-rose-400 shadow-[0_15px_30px_-10px_rgba(244,63,94,0.3)]' : 'bg-slate-900 text-white hover:bg-black shadow-[0_15px_30px_-10px_rgba(0,0,0,0.2)]'}`}>
               {saving ? 'Saving...' : 'Save Reflection'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

