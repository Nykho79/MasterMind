/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface CelebrationCanvasProps {
  active: boolean;
}

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  decay: number;
  gravity: number;
  friction: number;
  size: number;
  shape: 'circle' | 'star' | 'heart';
}

interface FireworkRocket {
  x: number;
  y: number;
  targetY: number;
  speed: number;
  vx: number;
  vy: number;
  color: string;
  exploded: boolean;
}

interface ConfettiPiece {
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'square' | 'heart' | 'star';
  wobble: number;
  wobbleSpeed: number;
}

const CELEBRATION_COLORS = [
  '#FF6B8B', // Pastel Pink Rose
  '#FF8E53', // Bright Coral
  '#FFD200', // Gold Yellow
  '#2EECB7', // Aqua Teal
  '#4E65FF', // Blue Electric
  '#925BFF', // Lilac Magic
  '#FF7FF2', // Sweet Violet
];

export default function CelebrationCanvas({ active }: CelebrationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const rockets: FireworkRocket[] = [];
    const particles: FireworkParticle[] = [];
    const confetti: ConfettiPiece[] = [];

    // Helper to draw a heart shape
    const drawHeart = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      c.beginPath();
      c.moveTo(x, y + r / 4);
      c.bezierCurveTo(x, y - r / 2, x - r, y - r / 2, x - r, y + r / 4);
      c.bezierCurveTo(x - r, y + (r * 3) / 4, x, y + r * 1.1, x, y + r * 1.3);
      c.bezierCurveTo(x, y + r * 1.1, x + r, y + (r * 3) / 4, x + r, y + r / 4);
      c.bezierCurveTo(x + r, y - r / 2, x, y - r / 2, x, y + r / 4);
      c.closePath();
      c.fill();
    };

    // Helper to draw a star shape
    const drawStar = (c: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fill();
    };

    // Spawn an explosion of particles
    const createExplosion = (x: number, y: number, color: string) => {
      const count = 60 + Math.floor(Math.random() * 40);
      const shapes: Array<'circle' | 'star' | 'heart'> = ['circle', 'star', 'heart'];
      const explosionShape = shapes[Math.floor(Math.random() * shapes.length)];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 2 + Math.random() * 8;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 1, // slight upward push
          alpha: 1,
          color,
          decay: 0.012 + Math.random() * 0.015,
          gravity: 0.06,
          friction: 0.97,
          size: 2 + Math.random() * 4,
          shape: explosionShape,
        });
      }
    };

    // Spawn a rocket
    const spawnRocket = () => {
      const startX = 100 + Math.random() * (width - 200);
      const targetY = 100 + Math.random() * (height / 2);
      const color = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];
      
      const dx = startX - (Math.random() * width); // lean in toward center
      const angle = -Math.PI / 2 + (Math.random() * 0.2 - 0.1); // mostly straight up

      rockets.push({
        x: startX,
        y: height + 10,
        targetY,
        speed: 8 + Math.random() * 6,
        vx: Math.cos(angle) * (8 + Math.random() * 4),
        vy: Math.sin(angle) * (8 + Math.random() * 4),
        color,
        exploded: false,
      });
    };

    // Spawn continuous confetti
    const spawnConfetti = () => {
      const shapes: Array<'circle' | 'square' | 'heart' | 'star'> = ['circle', 'square', 'heart', 'star'];
      confetti.push({
        x: Math.random() * width,
        y: -20,
        size: 6 + Math.random() * 8,
        color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
        vx: Math.random() * 2 - 1,
        vy: 1.5 + Math.random() * 3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() * 0.1 - 0.05) * Math.PI,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        wobble: Math.random() * Math.PI,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
      });
    };

    // Initial burst on mount
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (!active) return;
        const x = width * 0.25 + Math.random() * (width * 0.5);
        const y = height * 0.2 + Math.random() * (height * 0.3);
        const color = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];
        createExplosion(x, y, color);
      }, i * 400);
    }

    // Initial confetti rain
    for (let i = 0; i < 60; i++) {
      const shapes: Array<'circle' | 'square' | 'heart' | 'star'> = ['circle', 'square', 'heart', 'star'];
      confetti.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        size: 6 + Math.random() * 8,
        color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
        vx: Math.random() * 2 - 1,
        vy: 1.5 + Math.random() * 3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() * 0.1 - 0.05) * Math.PI,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        wobble: Math.random() * Math.PI,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
      });
    }

    let spawnTimer = 0;

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      // Handle spawning new rockets
      spawnTimer++;
      if (spawnTimer % 45 === 0 && Math.random() > 0.3 && rockets.length < 5) {
        spawnRocket();
      }

      // Confetti continuous rain
      if (confetti.length < 130) {
        spawnConfetti();
      }

      // 1. Update and Draw Rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx;
        r.y += r.vy;

        // Gravity pull on rocket
        r.vy += 0.05;

        // Draw trail / spark
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();

        // Spark particles trailing
        if (Math.random() > 0.3) {
          particles.push({
            x: r.x,
            y: r.y,
            vx: Math.random() * 1 - 0.5,
            vy: Math.random() * 1 - 0.5,
            alpha: 0.8,
            color: '#FFEAAA',
            decay: 0.03,
            gravity: 0.02,
            friction: 0.98,
            size: 1.5,
            shape: 'circle',
          });
        }

        // Explode condition (reached peak height or vertical speed turns downwards)
        if (r.y <= r.targetY || r.vy >= 0 || r.y < 50) {
          createExplosion(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // 2. Update and Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'heart') {
          drawHeart(ctx, p.x, p.y, p.size * 2);
        } else if (p.shape === 'star') {
          drawStar(ctx, p.x, p.y, 5, p.size * 2, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Update and Draw Confetti
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.y += c.vy;
        c.x += c.vx + Math.sin(c.wobble) * 0.5;
        c.wobble += c.wobbleSpeed;
        c.rotation += c.rotationSpeed;

        // If out of bounds, recycle or drop
        if (c.y > height + 20) {
          c.y = -20;
          c.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;

        if (c.shape === 'heart') {
          drawHeart(ctx, 0, 0, c.size);
        } else if (c.shape === 'star') {
          drawStar(ctx, 0, 0, 5, c.size, c.size / 2);
        } else if (c.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, c.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Square / Rectangle strip
          ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        }

        ctx.restore();
      }

      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50 select-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
