import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Brain, Mic, BarChart3, BookOpen,
  Moon, CloudFog, Compass, MessageCircleOff,
  Instagram, Linkedin, Twitter, Mail,
  ChevronRight, Zap, Target, Sprout,
  VolumeX, Puzzle, ArrowRight, Sun
} from 'lucide-react';
import './landing.css';

const logo = process.env.PUBLIC_URL + '/logo.png';

/* ── TYPEWRITER ── */
function useTypewriter(texts: string[], speed = 22, pause = 2800) {
  const [displayed, setDisplayed] = useState('');
  const [textIdx, setTextIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const current = texts[textIdx];
    const timer = setTimeout(() => {
      if (!deleting) {
        setDisplayed(current.slice(0, charIdx + 1));
        if (charIdx + 1 === current.length) setTimeout(() => setDeleting(true), pause);
        else setCharIdx(c => c + 1);
      } else {
        setDisplayed(current.slice(0, charIdx - 1));
        if (charIdx - 1 === 0) { setDeleting(false); setTextIdx(i => (i + 1) % texts.length); setCharIdx(0); }
        else setCharIdx(c => c - 1);
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timer);
  }, [charIdx, deleting, textIdx, texts, speed, pause]);
  return displayed;
}

const MIRROR_TEXTS = [
  '"There is a quiet storm inside you — not chaos, but transformation. The weight you\'re carrying feels heavy because you\'re holding more than one version of yourself at once."',
  '"Your anxiety is not weakness. It is your mind scanning urgently for safety. Name it. It loses power when you do."',
  '"The loneliness you feel isn\'t emptiness — it\'s a vivid sign of how deeply you are capable of connecting."',
  '"You keep circling the same thought because a part of you already knows the answer and is afraid of it."',
];

/* ── NEURAL DOTS COMPONENT ── */
const NeuralDots: React.FC = () => {
  const dots = [
    { left: '10%', top: '20%', delay: '0s' },
    { left: '35%', top: '60%', delay: '0.4s' },
    { left: '60%', top: '10%', delay: '0.8s' },
    { left: '80%', top: '50%', delay: '0.2s' },
    { left: '50%', top: '80%', delay: '0.6s' },
    { left: '20%', top: '75%', delay: '1s' },
  ];
  return (
    <div className="lp-neural-dots">
      {dots.map((d, i) => (
        <div key={i} className="lp-neural-dot" style={{ left: d.left, top: d.top, animationDelay: d.delay }} />
      ))}
    </div>
  );
};

/* ── WAVE BARS (the one that impressed) ── */
const WaveBars: React.FC = () => (
  <div className="lp-bento-wave">
    {Array.from({ length: 22 }).map((_, i) => (
      <div key={i} className="lp-wave-bar" style={{
        height: `${22 + Math.abs(Math.sin(i * 0.65)) * 34 + (i % 4) * 6}px`,
        animationDelay: `${i * 0.07}s`,
        animationDuration: `${0.85 + (i % 5) * 0.14}s`,
      }} />
    ))}
  </div>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { setDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    try {
      const lp = localStorage.getItem('lp-theme');
      if (lp === 'light') return false;
      if (lp === 'dark') return true;
      return localStorage.getItem('emolit-theme') !== 'light';
    } catch {
      return true;
    }
  });
  const [launching, setLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const mirrorText = useTypewriter(MIRROR_TEXTS);

  /* ── Redirect if already logged in ── */
  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/home', { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  /* ── Save theme (landing + global app / login) ── */
  useEffect(() => {
    try {
      localStorage.setItem('lp-theme', isDark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
    setDark(isDark);
  }, [isDark, setDark]);

  /* ── Particle canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    const particles = Array.from({ length: isDark ? 60 : 40 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      r: 1.2 + Math.random() * 1.4, opacity: 0.12 + Math.random() * 0.38,
    }));
    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const pColor = isDark ? '82,183,136' : '16,185,129';
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pColor},${p.opacity})`; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++)
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${pColor},${0.06 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(animId); };
  }, [isDark]);

  /* ── Cursor glow ── */
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (cursorRef.current) { cursorRef.current.style.left = e.clientX + 'px'; cursorRef.current.style.top = e.clientY + 'px'; }
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  /* ── Nav scroll ── */
  useEffect(() => {
    const s = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', s);
    return () => window.removeEventListener('scroll', s);
  }, []);

  /* ── 3D card tilt ── */
  const onCardMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current; if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5, y = (e.clientY - top) / height - 0.5;
    card.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  };
  const onCardLeave = () => { if (cardRef.current) cardRef.current.style.transform = 'rotateY(0) rotateX(0)'; };

  /* ── Scroll reveal ── */
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      const els = document.querySelectorAll('.lp-reveal');
      const obs = new IntersectionObserver(entries => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) { setTimeout(() => e.target.classList.add('lp-visible'), i * 80); obs.unobserve(e.target); }
        });
      }, { threshold: 0.08 });
      els.forEach(el => obs.observe(el));
    }, 50);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  /* ── Cinematic launch loader ── */
  const handleLaunch = () => {
    setLaunching(true);
    setLaunchProgress(0);
    const steps = [10, 28, 52, 74, 91, 100];
    const delays = [80, 180, 280, 420, 600, 900];
    steps.forEach((p, i) => setTimeout(() => setLaunchProgress(p), delays[i]));
    setTimeout(() => navigate('/login'), 1150);
  };

  if (isLoading) return null;

  return (
    <div className={`lp-root${isDark ? '' : ' lp-light'}`}>
      {/* ═══ CINEMATIC LAUNCH OVERLAY ═══ */}
      {launching && (
        <div className="lp-launch-overlay">
          <div className="lp-launch-bar" style={{ width: `${launchProgress}%` }} />
          <div className="lp-launch-content">
            <img src={logo} alt="Emolit" className="lp-launch-logo" />
            <p className="lp-launch-text">Preparing your emotional space</p>
            <div className="lp-launch-dots">
              <span /><span /><span />
            </div>
          </div>
        </div>
      )}

      <div className="lp-cursor-glow" ref={cursorRef} />
      <canvas className="lp-canvas" ref={canvasRef} />

      {/* ═══ NAV ═══ */}
      <nav className={`lp-nav${navScrolled ? ' scrolled' : ''}`}>
        <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src={logo} alt="Emolit" />
        </div>
        <ul className="lp-nav-links">
          <li><a href="#features" onClick={e => { e.preventDefault(); scrollTo('features'); }}>Features</a></li>
          <li><a href="#how"      onClick={e => { e.preventDefault(); scrollTo('how'); }}>How It Works</a></li>
          <li><a href="#about"    onClick={e => { e.preventDefault(); scrollTo('about'); }}>About</a></li>
        </ul>
        <div className="lp-nav-right">
          <button className="lp-theme-toggle" onClick={() => setIsDark(d => !d)} aria-label="Toggle theme">
            <div className="lp-toggle-knob">
              {isDark ? <Moon size={12} /> : <Sun size={12} />}
            </div>
          </button>
          <button className="lp-nav-cta" onClick={handleLaunch}>
            Get Started <ChevronRight size={14} />
          </button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="lp-hero">
        <div className="lp-badge"><span className="lp-badge-dot" /> AI-Powered · Emotionally Intelligent</div>
        <h1 className="lp-hero-headline">
          The App That <span className="lp-gradient-text">Understands</span><br />What You're Feeling
        </h1>
        <p className="lp-hero-sub">
          Most journaling apps save your thoughts. Emolit reflects them back as wisdom — with AI insights that help you understand yourself on a level you never thought possible.
        </p>
        <div className="lp-hero-actions">
          <button className="lp-btn-primary" onClick={handleLaunch}>
            Begin Your Journey <ArrowRight size={17} />
          </button>
        </div>

        {/* 3D AI Card */}
        <div className="lp-hero-card-wrap">
          <div className="lp-hero-card" ref={cardRef} onMouseMove={onCardMove} onMouseLeave={onCardLeave}>
            <div className="lp-hero-card-glow" />
            <div className="lp-emotion-tags">
              <span className="lp-tag lt-green"><Brain size={12} /> Overwhelmed</span>
              <span className="lp-tag lt-blue"><Compass size={12} /> Uncertain</span>
              <span className="lp-tag lt-gold"><Zap size={12} /> Hopeful</span>
              <span className="lp-tag lt-red"><Moon size={12} /> Anxious</span>
            </div>
            <div className="lp-mirror-box">
              <div className="lp-mirror-label"><span className="lp-mirror-label-dot" /> Emolit AI — The Mirror</div>
              <div className="lp-mirror-text">{mirrorText}<span className="lp-cursor-blink" /></div>
            </div>
          </div>
        </div>
      </section>



      {/* ═══ PROBLEM — CINEMATIC VIDEO ═══ */}
      <section className="lp-section" id="problem">
        <div className="lp-container">
          <div className="lp-center">
            <span className="lp-badge-sub">The Real Problem</span>
            <h2 className="lp-section-title">You Feel Things You Can't<br />Put into Words</h2>
            <p className="lp-section-sub lp-mx-auto">And that silence costs you. Every unexplored emotion is a missed opportunity to understand yourself, grow, and connect more deeply.</p>
          </div>

          <div className="lp-cinematic-grid">
            {/* OVERTHINKING - WIDE */}
            <div className="lp-cine-card lp-cine-wide lp-reveal">
              <div className="lp-cine-img-wrap">
                <img src={`${process.env.PUBLIC_URL}/overthinking.jpeg`} alt="Overthinking" className="lp-cine-img" style={{ objectPosition: 'center 48%' }} />
                <div className="lp-cine-overlay" />
              </div>
              <div className="lp-cine-content">
                <h3 className="lp-cine-title">Overthinking at 2AM</h3>
                <p className="lp-cine-text">Your mind refuses to shut off. Thoughts spiral without resolution, leaving you exhausted and no clearer than when you started.</p>
              </div>
            </div>

            {/* FOG - TALL */}
            <div className="lp-cine-card lp-cine-tall lp-reveal" style={{ animationDelay: '0.1s' }}>
              <div className="lp-cine-img-wrap">
                <img src={`${process.env.PUBLIC_URL}/emotional.jpeg`} alt="Emotional Fog" className="lp-cine-img" style={{ objectPosition: 'center 20%' }} />
                <div className="lp-cine-overlay" />
              </div>
              <div className="lp-cine-content">
                <h3 className="lp-cine-title">Emotional Fog</h3>
                <p className="lp-cine-text">You feel something heavy but can't name it. Without a name, you can't address it.</p>
              </div>
            </div>

            {/* PATH - NORMAL */}
            <div className="lp-cine-card lp-cine-norm lp-reveal" style={{ animationDelay: '0.2s' }}>
              <div className="lp-cine-img-wrap">
                <img src={`${process.env.PUBLIC_URL}/noclearpath.jpeg`} alt="No Path" className="lp-cine-img" style={{ objectPosition: 'center 30%' }} />
                <div className="lp-cine-overlay" />
              </div>
              <div className="lp-cine-content">
                <h3 className="lp-cine-title">No Clear Path</h3>
                <p className="lp-cine-text">Generic self-help doesn't fit your specific emotional state.</p>
              </div>
            </div>

            {/* WORDS - NORMAL */}
            <div className="lp-cine-card lp-cine-norm lp-reveal" style={{ animationDelay: '0.3s' }}>
              <div className="lp-cine-img-wrap">
                <img src={`${process.env.PUBLIC_URL}/lostofwords.jpeg`} alt="Lost for Words" className="lp-cine-img" style={{ objectPosition: 'center 25%' }} />
                <div className="lp-cine-overlay" />
              </div>
              <div className="lp-cine-content">
                <h3 className="lp-cine-title">Lost for Words</h3>
                <p className="lp-cine-text">In conversations that matter most, words fail you. Not because you don't feel — but because you haven't learned the language.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EMOTION WORD MARQUEE ═══ */}
      {(() => {
        const words = [
          'Sonder','Hiraeth','Limerence','Vellichor','Eudaimonia',
          'Chrysalism','Kenopsia','Sehnsucht','Redamancy','Forelsket',
          'Liberosis','Onism','Jouissance','Monachopsis','Acatalepsy',
        ];
        const doubled = [...words, ...words];
        return (
          <div className="lp-marquee-section">
            <div className="lp-marquee-header">
              <p className="lp-marquee-question">How many of these words do you actually know?</p>
              <p className="lp-marquee-answer">Don't worry if none — that's exactly why we're here.</p>
            </div>
            <div className="lp-marquee-wrap">
              <div className="lp-marquee-track">
                {doubled.map((w, i) => (
                  <span className="lp-marquee-word" key={i}>
                    <span className="lp-mq-word">{w}</span>
                    <span className="lp-marquee-dot" />
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ SOLUTION ═══ */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-solution-grid">
            <div className="lp-reveal">
              <span className="lp-badge-sub">The Emolit Difference</span>
              <h2 className="lp-section-title">Not therapy.<br />Not just journaling.<br /><span style={{ color: 'var(--primary)' }}>Something entirely new.</span></h2>
              <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginTop: 16, fontSize: '0.95rem' }}>
                Emolit sits at the intersection of artificial intelligence and emotional psychology — reflecting your inner world with depth, clarity, and compassion you didn't know was possible.
              </p>
            </div>
            <div className="lp-sol-card lp-reveal">
              {[
                ['Generic therapy app',    'Your personal clarity engine'],
                ['Blank journal page',     'AI-powered reflection'],
                ['Vague self-help advice', 'Tailored emotional insight'],
                ['Confusion & rumination', 'Named emotions & clarity'],
                ['Random motivation',      '30-day growth audit'],
              ].map(([bad, good], i) => (
                <div className="lp-vs-row" key={i}>
                  <span className="lp-vs-bad">{bad}</span>
                  <span className="lp-vs-arrow">→</span>
                  <span className="lp-vs-good">{good}</span>
                </div>
              ))}
              <div className="lp-research-badge">
                <div className="lp-research-badge-label"><BookOpen size={12} /> Backed by Psychology Research</div>
                <div className="lp-research-badge-text">Built on established emotional intelligence frameworks by a team that believes self-awareness is the ultimate superpower.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES — BENTO ═══ */}
      <section className="lp-section lp-section-alt" id="features">
        <div className="lp-container">
          <div className="lp-center">
            <span className="lp-badge-sub">Core Features</span>
            <h2 className="lp-section-title">Your Complete Emotional<br />Intelligence Suite</h2>
          </div>
          <div className="lp-bento-grid">

            {/* AI Analysis — emotion pills only, no neural dots */}
            <div className="lp-bento-big lp-reveal">
              <div className="lp-bento-icon-wrap lp-bento-icon-green"><Brain size={34} strokeWidth={1.4} /></div>
              <div className="lp-bento-content">
                <div className="lp-bento-label">Core Engine</div>
                <h3 className="lp-bento-title">AI Emotion Analysis</h3>
                <p className="lp-bento-text">Write freely. Our AI reads between the lines, identifying 2–4 precise emotions from 200+ mapped psychological states — then reflects them back with clinical-grade depth and empathy.</p>
                <div className="lp-bento-outcome"><Zap size={13} /> Instant emotional clarity, every time</div>
              </div>
              <div className="lp-bento-visual">
                <span className="lp-bento-pill lp-bento-pill-a">Anxious anticipation</span>
                <span className="lp-bento-pill lp-bento-pill-b">Quiet resilience</span>
                <span className="lp-bento-pill lp-bento-pill-c">Suppressed grief</span>
              </div>
            </div>

            {/* Voice — with the beloved wave bars */}
            <div className="lp-bento-big lp-reveal">
              <div className="lp-bento-icon-wrap lp-bento-icon-gold"><Mic size={34} strokeWidth={1.4} /></div>
              <div className="lp-bento-content">
                <div className="lp-bento-label">Voice Protocol</div>
                <h3 className="lp-bento-title">Speak Your Truth</h3>
                <p className="lp-bento-text">Speak in any language — English, Hindi, Telugu, or your mother tongue. Our voice engine transcribes, translates, and analyzes your spoken words into structured emotional insight in seconds.</p>
                <div className="lp-bento-outcome"><Zap size={13} /> Zero language barriers, total freedom</div>
              </div>
              <WaveBars />
            </div>

            {/* PDF Report — animated bars */}
            <div className="lp-bento-small lp-reveal">
              <div className="lp-bento-icon-wrap lp-bento-icon-purple"><BarChart3 size={26} strokeWidth={1.4} /></div>
              <div className="lp-bento-label">Monthly Audit</div>
              <h3 className="lp-bento-title-sm">30-Day Growth Report</h3>
              <p className="lp-bento-text-sm">Download a premium PDF with emotion heatmaps, streak data, and psychological insights that reveal who you are becoming.</p>
            </div>

            {/* Vocabulary */}
            <div className="lp-bento-small lp-reveal">
              <div className="lp-bento-icon-wrap lp-bento-icon-teal"><BookOpen size={26} strokeWidth={1.4} /></div>
              <div className="lp-bento-label">Vocabulary</div>
              <h3 className="lp-bento-title-sm">Emotion Word Library</h3>
              <p className="lp-bento-text-sm">Learn one precise emotion word daily. Naming what you feel is the first step to transforming it into growth and self-mastery.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="lp-section" id="how">
        <div className="lp-container">
          <div className="lp-center">
            <span className="lp-badge-sub">How It Works</span>
            <h2 className="lp-section-title">Three Steps.<br />Infinite Clarity.</h2>
          </div>
          <div className="lp-how-steps">
            <div className="lp-how-line" />
            {[
              { n: '01', Icon: Mic,    title: 'Share Your Thoughts', text: 'Type or speak your journal entry — any length, any language, any time. Total freedom, zero judgment.' },
              { n: '02', Icon: Brain,  title: 'Receive AI Insights',  text: "Emolit AI maps your emotions, surfaces hidden patterns, and asks the one question you haven't thought to ask yourself." },
              { n: '03', Icon: Sprout, title: 'Grow Every Day',       text: 'Track your progress, download your monthly growth audit, and watch your self-awareness compound over time.' },
            ].map(({ n, Icon, title, text }, i) => (
              <div className="lp-how-step lp-reveal" key={i}>
                <div className="lp-step-circle"><Icon size={26} strokeWidth={1.5} /></div>
                <div className="lp-step-num-label">{n}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ABOUT — EDITORIAL REDESIGN ═══ */}
      <section className="lp-ed-section" id="about">
        <div className="lp-ed-orb lp-ed-orb-green" />
        <div className="lp-ed-orb lp-ed-orb-gold" />
        <div className="lp-container" style={{ position: 'relative', zIndex: 1 }}>

          {/* ── ROW 1: Big Headline + Stats ── */}
          <div className="lp-ed-top">
            <div className="lp-ed-headline-col lp-reveal">
              <span className="lp-badge-sub">Our Story &amp; Purpose</span>
              <h2 className="lp-ed-headline">
                We built this<br />
                because we<br />
                <span className="lp-gradient-text">felt it too.</span>
              </h2>
              <p className="lp-ed-headline-sub">
                The sleepless nights. The unnamed heaviness. The moment you want to talk but the words don't come. Emolit was born from that exact silence.
              </p>
            </div>
            <div className="lp-ed-stats-col lp-reveal">
              {[
                { num: '200+', label: 'Emotion Words', sub: 'Mapped & classified' },
                { num: '6',    label: 'RULER Layers',  sub: 'Per journal entry' },
                { num: '30',   label: 'Day Audit',     sub: 'Monthly growth report' },
                { num: '∞',    label: 'Judgment-Free', sub: 'Always, for everyone' },
              ].map(({ num, label, sub }, i) => (
                <div className="lp-ed-stat" key={i}>
                  <span className="lp-ed-stat-num">{num}</span>
                  <span className="lp-ed-stat-label">{label}</span>
                  <span className="lp-ed-stat-sub">{sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── FULL WIDTH PULL QUOTE ── */}
          <div className="lp-ed-quote-row lp-reveal">
            <div className="lp-ed-quote-line" />
            <blockquote className="lp-ed-blockquote">
              "We looked for an app that could truly <em>understand</em> — not just log, not just prompt. Something that held space for the whole human. We built it ourselves because it didn't exist."
            </blockquote>
            <div className="lp-ed-quote-attr">
              <span className="lp-ed-attr-dash">—</span>
              <span className="lp-ed-attr-name">The Emolit Team</span>
              <span className="lp-ed-attr-role">Founders &amp; Builders</span>
            </div>
            <div className="lp-ed-quote-line" />
          </div>

        </div>
      </section>


      {/* ═══ FINAL CTA ═══ */}
      <section className="lp-final">
        <div className="lp-final-glow" />
        <div className="lp-urgency-badge"><span className="lp-urgency-dot" /> Early Access Open</div>
        <h2 className="lp-section-title lp-reveal" style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,4rem)', letterSpacing: '-1px' }}>
          Your Emotions Are Not<br />Chaos. They Are Data.<br /><span style={{ color: 'var(--primary)' }}>Start Understanding Them.</span>
        </h2>
        <p className="lp-reveal" style={{ color: 'var(--text2)', maxWidth: 480, margin: '20px auto 44px', fontSize: '1rem', lineHeight: 1.75 }}>
          The clarity you've been searching for is one entry away.
        </p>
        <div className="lp-hero-actions lp-reveal">
          <button className="lp-btn-primary" style={{ fontSize: '1rem', padding: '17px 44px' }} onClick={handleLaunch}>
            Begin Your Journey <ArrowRight size={18} />
          </button>
        </div>
        <p style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 28 }}>Track · Reflect · Grow</p>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-brand-col">
            <div className="lp-footer-brand">
              <img src={logo} alt="Emolit" />
              <span>Emolit</span>
            </div>
            <p className="lp-footer-tagline">Your emotional intelligence companion.<br />Track · Reflect · Grow.</p>
            <div className="lp-footer-socials">
              <a href="https://www.instagram.com/emolit.app?igsh=b200aTc4bG9hcTl4" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={16} /></a>
              <a href="https://www.linkedin.com/company/emolit/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={16} /></a>
              <a href="https://twitter.com/emolit_app" target="_blank" rel="noreferrer" aria-label="Twitter"><Twitter size={16} /></a>
              <a href="mailto:hello@emolit.app" aria-label="Email"><Mail size={16} /></a>
            </div>
          </div>
          <div className="lp-footer-links-col">
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Product</div>
              <button onClick={() => scrollTo('features')}>Features</button>
              <button onClick={() => scrollTo('how')}>How It Works</button>
              <button onClick={() => navigate('/login')}>Get Started</button>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Company</div>
              <button onClick={() => scrollTo('about')}>About Us</button>
              <button onClick={() => scrollTo('about')}>Mission</button>
              <a href="mailto:hello@emolit.app">Contact</a>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>© 2026 Emolit. Built with empathy and intelligence.</p>
          <p>Privacy Policy · Terms of Service</p>
        </div>
      </footer>
    </div>
  );
}
