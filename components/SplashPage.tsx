import React, { useEffect, useState, useRef } from 'react';
import { Zap, ArrowRight } from 'lucide-react';

interface SplashPageProps {
  onComplete: () => void;
}

const SplashPage: React.FC<SplashPageProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'exit'>('loading');
  const phaseRef = useRef<'loading' | 'ready' | 'exit'>('loading');
  const [progress, setProgress] = useState(0);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  const setPhaseState = (newPhase: 'loading' | 'ready' | 'exit') => {
    setPhase(newPhase);
    phaseRef.current = newPhase;
  };

  useEffect(() => {
    const skipSplash = localStorage.getItem('fnf-skip-splash') === 'true';
    if (skipSplash || prefersReducedMotion.current) {
      onComplete();
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);

    const readyTimer = setTimeout(() => {
      setPhaseState('ready');
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(readyTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let isPaused = false;
    
    canvas.width = width;
    canvas.height = height;

    const chars = "010101<>{}[]/\\Σ∫π∆∇FLASHFRAME⚡";
    const particles: { x: number; y: number; z: number; char: string; color: string }[] = [];
    const particleCount = 200;
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 5,
        y: (Math.random() - 0.5) * height * 5,
        z: Math.random() * 4000, 
        char: chars[Math.floor(Math.random() * chars.length)],
        color: Math.random() > 0.6 ? '#8b5cf6' : Math.random() > 0.3 ? '#2B6C85' : '#ec4899'
      });
    }

    let lastTime = performance.now();
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const render = (time: number) => {
      if (isPaused || document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      
      const elapsed = time - lastTime;
      if (elapsed < frameInterval) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      
      const deltaTime = Math.min(elapsed / 16.67, 2.0);
      lastTime = time - (elapsed % frameInterval);

      const currentPhase = phaseRef.current;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      let baseSpeed = 40;
      if (currentPhase === 'ready') {
        baseSpeed = 15;
      } else if (currentPhase === 'exit') {
        baseSpeed = 200;
      }

      particles.forEach(p => {
        p.z -= baseSpeed * deltaTime;

        if (p.z <= 10) {
          p.z = 4000;
          p.x = (Math.random() - 0.5) * width * 5;
          p.y = (Math.random() - 0.5) * height * 5;
        }

        const perspective = 300;
        const k = perspective / p.z; 
        const px = p.x * k + cx;
        const py = p.y * k + cy;

        if (px >= -100 && px <= width + 100 && py >= -100 && py <= height + 100 && p.z > 10) {
          const size = (1 - p.z / 4000) * 24; 
          const alpha = (1 - p.z / 4000) * 0.8;
          
          if (size > 2) {
            ctx.font = `bold ${size}px "JetBrains Mono", monospace`;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.fillText(p.char, px, py);
            ctx.globalAlpha = 1.0;
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render(performance.now());

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const handleVisibility = () => {
      isPaused = document.hidden;
      if (!isPaused) lastTime = performance.now();
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleEnter = () => {
    setPhaseState('exit');
    setTimeout(onComplete, 600);
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-opacity duration-500 ${phase === 'exit' ? 'opacity-0' : 'opacity-100'}`}
      style={{
        background: '#0a0a12'
      }}
    >
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/splash-circuit-bg.png)',
          opacity: 0.6
        }}
      />

      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.7 }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a12]/90" />
      
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-25 animate-pulse"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
            top: '10%',
            left: '20%'
          }}
        />
        <div 
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 animate-pulse"
          style={{
            background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
            bottom: '20%',
            right: '10%',
            animationDelay: '1s'
          }}
        />
        <div 
          className="absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-30 animate-pulse"
          style={{
            background: 'radial-gradient(circle, #2B6C85 0%, transparent 70%)',
            top: '50%',
            right: '30%',
            animationDelay: '2s'
          }}
        />
        
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        <div className="relative">
          <div 
            className="absolute -inset-8 rounded-full blur-2xl opacity-60 animate-pulse"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #2B6C85 50%, #ec4899 100%)'
            }}
          />
          
          <div 
            className="relative p-6 rounded-2xl border animate-pulse"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(139, 92, 246, 0.4)',
              boxShadow: '0 0 80px rgba(139, 92, 246, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
              animationDuration: '2s'
            }}
          >
            <Zap className="w-16 h-16 text-white" style={{ filter: 'drop-shadow(0 0 25px rgba(139, 92, 246, 0.9))' }} />
          </div>
        </div>

        <div className="text-center">
          <h1 
            className="text-5xl md:text-7xl font-bold tracking-tight mb-2"
            style={{
              fontFamily: 'Roboto Condensed, sans-serif',
              background: 'linear-gradient(135deg, #ffffff 0%, #8b5cf6 50%, #2B6C85 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(139, 92, 246, 0.6))'
            }}
          >
            Flash-n-Frame
          </h1>
          <p 
            className="text-lg md:text-xl tracking-widest uppercase"
            style={{
              fontFamily: 'Rubik, sans-serif',
              color: 'rgba(255, 255, 255, 0.6)'
            }}
          >
            Visual Intelligence Platform
          </p>
        </div>

        {phase === 'loading' && (
          <div className="w-64 md:w-80">
            <div 
              className="h-1.5 rounded-full overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  background: 'linear-gradient(90deg, #8b5cf6 0%, #2B6C85 50%, #ec4899 100%)',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
                }}
              />
            </div>
            <p 
              className="text-center mt-3 text-sm"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              Initializing...
            </p>
          </div>
        )}

        {phase === 'ready' && (
          <button
            onClick={handleEnter}
            className="group flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 animate-fade-in"
            style={{
              fontFamily: 'Rubik, sans-serif',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(43, 108, 133, 0.25) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.5)',
              color: 'white',
              boxShadow: '0 0 40px rgba(139, 92, 246, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            <span>Enter Studio</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        )}

      </div>

      <button
        onClick={() => {
          localStorage.setItem('fnf-skip-splash', 'true');
          handleEnter();
        }}
        className="absolute top-6 right-6 z-20 px-3 py-1.5 text-xs rounded-lg transition-colors"
        style={{
          color: 'rgba(255, 255, 255, 0.4)',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        aria-label="Skip splash screen and don't show again"
      >
        Skip & Remember
      </button>

      <div 
        className="absolute bottom-8 left-0 right-0 text-center text-sm z-10"
        style={{ color: 'rgba(255, 255, 255, 0.3)' }}
      >
        Powered by INT Inc
      </div>
    </div>
  );
};

export default SplashPage;
