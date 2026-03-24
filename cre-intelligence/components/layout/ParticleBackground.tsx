"use client";

import { useEffect, useRef } from "react";

// Lightweight hand-rolled canvas particle system — avoids tsparticles bundle size
// while giving us full control over the neon data-flow aesthetic.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

const COLORS = ["#00f5ff", "#00ff9d", "#a855f7", "#3b82f6"];

function createParticle(width: number, height: number): Particle {
  const maxLife = 120 + Math.random() * 180;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    radius: 0.5 + Math.random() * 1.5,
    opacity: 0,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    life: 0,
    maxLife,
  };
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 25 : 60;
    const CONNECT_DISTANCE = isMobile ? 0 : 100; // disable connections on mobile
    const particles: Particle[] = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Seed particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = createParticle(canvas.width, canvas.height);
      p.life = Math.random() * p.maxLife; // stagger start
      particles.push(p);
    }

    // Mouse influence
    let mx = canvas.width / 2;
    let my = canvas.height / 2;
    const onMouseMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener("mousemove", onMouseMove);

    function draw() {
      if (!ctx || !canvas) return;
      // Pause animation when tab is hidden to save CPU/battery
      if (document.hidden) {
        animId = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.life++;

        // Fade in / fade out over life
        const halfLife = p.maxLife / 2;
        p.opacity = p.life < halfLife
          ? (p.life / halfLife) * 0.35
          : ((p.maxLife - p.life) / halfLife) * 0.35;

        // Very subtle mouse attraction
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          p.vx += (dx / dist) * 0.005;
          p.vy += (dy / dist) * 0.005;
        }

        // Damp velocity
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();

        // Glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 6);
        grd.addColorStop(0, p.color + "40");
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 6, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.globalAlpha = p.opacity * 0.5;
        ctx.fill();

        ctx.globalAlpha = 1;

        // Draw faint connections to nearby particles (skip on mobile)
        if (CONNECT_DISTANCE > 0) {
          for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const cdx = p.x - q.x;
            const cdy = p.y - q.y;
            const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
            if (cdist < CONNECT_DISTANCE) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = "#00f5ff";
              ctx.globalAlpha = (1 - cdist / CONNECT_DISTANCE) * 0.06;
              ctx.lineWidth = 0.5;
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }
        }

        // Respawn
        if (p.life >= p.maxLife) {
          particles[i] = createParticle(canvas.width, canvas.height);
        }
      });

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.7,
      }}
    />
  );
}
