
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

// Lightweight Simplex Noise Implementation (2D)
// Based on standard Simplex Noise algorithms for organic gradients
class SimplexNoise {
  private p: Uint8Array;
  private perm: Uint8Array;
  private gradP: Int8Array;

  constructor() {
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) this.p[i] = i;
    for (let i = 255; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      [this.p[i], this.p[r]] = [this.p[r], this.p[i]];
    }
    this.perm = new Uint8Array(512);
    this.gradP = new Int8Array(512);
    const grads = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0, 1], [0, -1]];
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      const g = grads[this.perm[i] % grads.length];
      this.gradP[i * 2] = g[0];
      this.gradP[i * 2 + 1] = g[1];
    }
  }

  noise2D(x: number, y: number): number {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;

    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;

    const ii = i & 255;
    const jj = j & 255;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    let n0 = 0;
    if (t0 > 0) {
      t0 *= t0;
      n0 = t0 * t0 * (this.gradP[(ii + this.perm[jj]) * 2] * x0 + this.gradP[(ii + this.perm[jj]) * 2 + 1] * y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    let n1 = 0;
    if (t1 > 0) {
      t1 *= t1;
      n1 = t1 * t1 * (this.gradP[(ii + i1 + this.perm[jj + j1]) * 2] * x1 + this.gradP[(ii + i1 + this.perm[jj + j1]) * 2 + 1] * y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    let n2 = 0;
    if (t2 > 0) {
      t2 *= t2;
      n2 = t2 * t2 * (this.gradP[(ii + 1 + this.perm[jj + 1]) * 2] * x2 + this.gradP[(ii + 1 + this.perm[jj + 1]) * 2 + 1] * y2);
    }

    return 70.0 * (n0 + n1 + n2);
  }
}

interface AmbientBackgroundProps {
  intensity?: number; // 0 to 1
  scale?: number;     // noise resolution
  speed?: number;     // movement speed
  baseColor?: string; // HEX or RGB
  fogColor?: string;  // HEX or RGB
}

const AmbientBackgroundNoiseCanvas: React.FC<AmbientBackgroundProps> = ({
  intensity = 0.4,
  scale = 0.002,
  speed = 0.0005,
  baseColor = '#09090b',
  fogColor = '#1e1e2e'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noise = useRef(new SimplexNoise());
  const requestRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const animate = (time: number) => {
      // 30 FPS Cap
      const deltaTime = time - lastFrameTimeRef.current;
      if (deltaTime < 33) {
        requestRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTimeRef.current = time;

      // Organic Fog Shimmer
      const w = canvas.width;
      const h = canvas.height;
      
      // Clear with base color
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, w, h);

      const timeOffset = time * speed;
      const step = 80; // Grid step for performance

      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) {
          const n = noise.current.noise2D(x * scale + timeOffset, y * scale + timeOffset);
          const val = (n + 1) / 2; // Normalize to 0-1
          
          if (val > 0.3) {
            const alpha = (val - 0.3) * intensity;
            const radius = step * 2.5 * val;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `${fogColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    // Pause on hidden tab using Page Visibility API
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(requestRef.current);
      } else {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(requestRef.current);
    };
  }, [intensity, scale, speed, baseColor, fogColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        filter: 'blur(40px)', // Adds that extra soft fog feel
        opacity: 0.8
      }}
    />
  );
};

export default AmbientBackgroundNoiseCanvas;
