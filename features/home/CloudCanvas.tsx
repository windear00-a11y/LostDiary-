"use client";

import { useEffect, useRef, useState } from "react";

interface CloudCanvasProps {
  side: "left" | "right";
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function CloudCanvas({ side, children, className = "", style }: CloudCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(null);
  const particlesRef = useRef<any[]>([]);
  const dimensionsRef = useRef({ width: 280, height: 140 });
  const [dimensions, setDimensions] = useState({ width: 280, height: 140 });

  // Update ref whenever state changes
  useEffect(() => {
    dimensionsRef.current = dimensions;
  }, [dimensions]);

  // Measure content size more reliably
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const content = containerRef.current.querySelector('.cloud-content');
      
      if (content) {
        const rect = content.getBoundingClientRect();
        
        // Only update if change is significant to reduce jitter
        if (Math.abs(rect.width - dimensions.width) > 2 || Math.abs(rect.height - dimensions.height) > 2) {
          setDimensions({ width: rect.width, height: rect.height });
        }
      }
    };

    measure();
    const timer = setTimeout(measure, 50);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      clearTimeout(timer);
    };
  }, [children, dimensions.width, dimensions.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const margin = 100;
    const color = side === "left" ? "34,211,238" : "168,85,247";

    // Initialize particles ONLY IF they don't exist
    if (particlesRef.current.length === 0) {
      const { width, height } = dimensionsRef.current;
      const countMultiplier = 2.5; // Increased for more "puffs"
      
      // Layer 1: Large "Mist" (Base soft glow)
      for (let i = 0; i < 40 * countMultiplier; i++) {
        particlesRef.current.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.9),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.8),
          r: 40 + Math.random() * 60,
          opacity: 0.08 + Math.random() * 0.05,
          vx: (Math.random() - 0.5) * 0.02, // Much slower
          vy: (Math.random() - 0.5) * 0.02,
          sharp: false
        });
      }
      // Layer 2: Medium "Puffy" circles (The main texture)
      for (let i = 0; i < 120 * countMultiplier; i++) {
        particlesRef.current.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.8),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.7),
          r: 20 + Math.random() * 40,
          opacity: 0.15 + Math.random() * 0.1,
          vx: (Math.random() - 0.5) * 0.03, // Much slower
          vy: (Math.random() - 0.5) * 0.03,
          sharp: false
        });
      }
      // Layer 3: Small "Definition" puffs (For that bubbly edge look)
      for (let i = 0; i < 80 * countMultiplier; i++) {
        particlesRef.current.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.7),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.6),
          r: 10 + Math.random() * 20,
          opacity: 0.25 + Math.random() * 0.15,
          vx: (Math.random() - 0.5) * 0.04, // Much slower
          vy: (Math.random() - 0.5) * 0.04,
          sharp: true
        });
      }
      // Layer 4: Highlights (Soft white puffs)
      for (let i = 0; i < 30 * countMultiplier; i++) {
        particlesRef.current.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.6),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.5),
          r: 8 + Math.random() * 25,
          opacity: 0.15 + Math.random() * 0.15,
          vx: (Math.random() - 0.5) * 0.02,
          vy: (Math.random() - 0.5) * 0.02,
          sharp: Math.random() > 0.5,
          isWhite: true
        });
      }
    }

    const animate = () => {
      const { width, height } = dimensionsRef.current;
      
      // Update canvas size if needed without clearing particles
      if (canvas.width !== width + margin * 2 || canvas.height !== height + margin * 2) {
        canvas.width = width + margin * 2;
        canvas.height = height + margin * 2;
      }

      ctx.save();
      ctx.translate(margin, margin);
      ctx.clearRect(-margin, -margin, canvas.width, canvas.height);

      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Soft bounce within current dimensions - tighter to wrap text closely
        const dx = p.x - width / 2;
        const dy = p.y - height / 2;
        const normalizedDist = (dx * dx) / Math.pow(width / 2 + 15, 2) + (dy * dy) / Math.pow(height / 2 + 10, 2);
        
        if (normalizedDist > 1) {
          // Instead of hard bounce, gently pull back to center
          p.vx -= dx * 0.00005; // Even gentler pull
          p.vy -= dy * 0.00005;
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        const pColor = p.isWhite ? "255,255,255" : color;

        if (p.sharp) {
          gradient.addColorStop(0, `rgba(${pColor}, ${p.opacity})`);
          gradient.addColorStop(0.4, `rgba(${pColor}, ${p.opacity * 0.6})`);
          gradient.addColorStop(1, "rgba(255,255,255,0)");
        } else {
          gradient.addColorStop(0, `rgba(${pColor}, ${p.opacity})`);
          gradient.addColorStop(0.6, `rgba(${pColor}, ${p.opacity * 0.4})`);
          gradient.addColorStop(1, "rgba(255,255,255,0)");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [side]); // Only re-run if side changes

  return (
    <div 
      ref={containerRef} 
      className={`relative inline-block animate-float ${className}`}
      style={style}
    >
      {/* cloud canvas */}
      <canvas
        ref={canvasRef}
        className="absolute pointer-events-none blur-[2px]"
        style={{ 
          top: -100, 
          left: -100, 
          width: dimensions.width + 200, 
          height: dimensions.height + 200 
        }}
      />

      {/* content wrapper */}
      <div className="relative z-10 cloud-content px-4 py-2 flex items-center justify-center min-w-[60px] min-h-[40px]">
        <div className="text-white text-center leading-relaxed max-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
