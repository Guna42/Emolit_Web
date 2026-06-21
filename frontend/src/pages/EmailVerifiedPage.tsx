import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import './email-verified.css';

const EmailVerifiedPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
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
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.26,
      vy: (Math.random() - 0.5) * 0.26,
      r: 1.1 + Math.random() * 1.4,
      opacity: 0.1 + Math.random() * 0.36,
    }));
    const pColor = '82,183,136';
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
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
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${pColor},${0.06 * (1 - d / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className={`ev-root${isDark ? '' : ' ev-light'}`}>
      <canvas className="ev-canvas" ref={canvasRef} />
      <div className="ev-ambient" />

      <div className="ev-card">

        {/* Logo */}
        <span className="ev-logo">
          Emo<em>lit</em>
        </span>

        {/* Animated check circle */}
        <div className="ev-check-wrap">
          {/* Outer ring draws itself */}
          <svg className="ev-check-svg" viewBox="0 0 100 100">
            <circle className="ev-circle-track" cx="50" cy="50" r="45" />
            <circle className="ev-circle-fill"  cx="50" cy="50" r="45" />
          </svg>
          {/* Tick pops in after ring completes */}
          <svg
            className="ev-tick-svg"
            width="46"
            height="46"
            viewBox="0 0 46 46"
            fill="none"
          >
            <path
              d="M11 23L20 32L35 14"
              stroke="#52b788"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Headline */}
        <h1 className="ev-headline">You&rsquo;re in.</h1>

        {/* Sub-copy */}
        <p className="ev-sub">
          Your email is verified. Welcome to{' '}
          <strong>Emolit</strong> — your emotional intelligence
          journey begins right now.
        </p>

        {/* CTA */}
        <button className="ev-btn" onClick={() => navigate('/login')}>
          Start Your Journey <ArrowRight size={18} />
        </button>

        {/* Tagline */}
        <p className="ev-tagline">Track · Reflect · Grow</p>

      </div>
    </div>
  );
};

export default EmailVerifiedPage;
