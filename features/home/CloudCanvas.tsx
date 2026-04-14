"use client";

import { useEffect, useRef, useState } from "react";

interface CloudCanvasProps {
  side: "left" | "right";
  children: React.ReactNode;
  className?: string;
}

export default function CloudCanvas({ side, children, className = "" }: CloudCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(null);
  const [dimensions, setDimensions] = useState({ width: 280, height: 140 });

  // Measure content size more reliably
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const content = containerRef.current.querySelector('.cloud-content');
      if (content) {
        const rect = content.getBoundingClientRect();
        // Add padding and cap width for mobile
        const paddingX = 120; // More padding for mist
        const paddingY = 100;
        const maxWidth = Math.min(window.innerWidth - 40, 450);
        
        setDimensions({ 
          width: Math.min(maxWidth, Math.max(240, rect.width + paddingX)), 
          height: Math.max(140, rect.height + paddingY) 
        });
      }
    };

    measure();
    // Use a small delay to ensure content is rendered
    const timer = setTimeout(measure, 50);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      clearTimeout(timer);
    };
  }, [children]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;

    const color = side === "left" ? "34,211,238" : "168,85,247"; // Cyan vs Purple

    // Particle system for internal movement
    interface Particle {
      x: number;
      y: number;
      r: number;
      opacity: number;
      vx: number;
      vy: number;
      sharp: boolean;
      isWhite?: boolean;
    }

    const particles: Particle[] = [];

    // Initialize particles in a dense, overlapping distribution
    const createParticles = () => {
      const countMultiplier = Math.min(1.5, (width * height) / (280 * 140));
      
      // Layer 1: Large, very soft "Mist" (Base layer)
      for (let i = 0; i < 40 * countMultiplier; i++) {
        particles.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.6),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.5),
          r: 45 + Math.random() * 65,
          opacity: 0.08 + Math.random() * 0.05,
          vx: (Math.random() - 0.5) * 0.04, // Very slow
          vy: (Math.random() - 0.5) * 0.04,
          sharp: false
        });
      }
      // Layer 2: Medium "Core" puffs (Defining the shape)
      for (let i = 0; i < 80 * countMultiplier; i++) {
        particles.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.5),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.4),
          r: 25 + Math.random() * 45,
          opacity: 0.15 + Math.random() * 0.1,
          vx: (Math.random() - 0.5) * 0.06, // Very slow
          vy: (Math.random() - 0.5) * 0.06,
          sharp: false
        });
      }
      // Layer 3: Sharp "Definition" puffs
      for (let i = 0; i < 40 * countMultiplier; i++) {
        particles.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.4),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.3),
          r: 12 + Math.random() * 22,
          opacity: 0.25 + Math.random() * 0.15,
          vx: (Math.random() - 0.5) * 0.08, // Very slow
          vy: (Math.random() - 0.5) * 0.08,
          sharp: true
        });
      }
      // Layer 4: Highlights
      for (let i = 0; i < 15 * countMultiplier; i++) {
        particles.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.4),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.3),
          r: 10 + Math.random() * 25,
          opacity: 0.15 + Math.random() * 0.15,
          vx: (Math.random() - 0.5) * 0.05,
          vy: (Math.random() - 0.5) * 0.05,
          sharp: Math.random() > 0.5,
          isWhite: true
        });
      }
    };

    createParticles();

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Soft bounce within elliptical bounds
        const dx = p.x - width / 2;
        const dy = p.y - height / 2;
        const normalizedDist = (dx * dx) / Math.pow(width / 2 - 30, 2) + (dy * dy) / Math.pow(height / 2 - 20, 2);
        
        if (normalizedDist > 1) {
          p.vx *= -1;
          p.vy *= -1;
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        const pColor = p.isWhite ? "255,255,255" : color;

        if (p.sharp) {
          gradient.addColorStop(0, `rgba(${pColor}, ${p.opacity})`);
          gradient.addColorStop(0.7, `rgba(${pColor}, ${p.opacity * 0.8})`);
        } else {
          gradient.addColorStop(0, `rgba(${pColor}, ${p.opacity})`);
          gradient.addColorStop(0.3, `rgba(${pColor}, ${p.opacity * 0.5})`);
          gradient.addColorStop(0.6, `rgba(${pColor}, ${p.opacity * 0.1})`);
        }
        gradient.addColorStop(1, "rgba(255,255,255,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [side, dimensions]);

  return (
    <div 
      ref={containerRef} 
      className={`relative animate-float ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      {/* cloud canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 blur-[2px] pointer-events-none"
      />

      {/* content wrapper */}
      <div className="absolute inset-0 flex items-center justify-center px-14 py-10 z-10">
        <div className="cloud-content text-white text-center leading-relaxed max-w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
          {children}
        </div>
      </div>
    </div>
  );
}
