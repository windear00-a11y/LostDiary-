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
      const parent = containerRef.current.parentElement;
      
      if (content && parent) {
        const rect = content.getBoundingClientRect();
        const parentWidth = parent.offsetWidth;
        
        // Padding that strongly favors width for a horizontal "bubble" look
        const paddingX = parentWidth < 400 ? 140 : 200;
        const paddingY = parentWidth < 400 ? 60 : 80;
        
        // Allow much more horizontal expansion
        const maxWidth = Math.min(parentWidth - 20, 750);
        
        const newWidth = Math.min(maxWidth, Math.max(220, rect.width + paddingX));
        const newHeight = Math.max(90, rect.height + paddingY);

        // Only update if change is significant to reduce jitter
        if (Math.abs(newWidth - dimensions.width) > 2 || Math.abs(newHeight - dimensions.height) > 2) {
          setDimensions({ width: newWidth, height: newHeight });
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
      const countMultiplier = 1.5;
      
      // Layer 1: Large "Mist"
      for (let i = 0; i < 60 * countMultiplier; i++) {
        particlesRef.current.push({
          x: width / 2 + (Math.random() - 0.5) * width,
          y: height / 2 + (Math.random() - 0.5) * height,
          r: 50 + Math.random() * 70,
          opacity: 0.12 + Math.random() * 0.08,
          vx: (Math.random() - 0.5) * 0.05,
          vy: (Math.random() - 0.5) * 0.05,
          sharp: false
        });
      }
      // Layer 2: Medium "Core"
      for (let i = 0; i < 100 * countMultiplier; i++) {
        particlesRef.current.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.8),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.7),
          r: 30 + Math.random() * 50,
          opacity: 0.2 + Math.random() * 0.15,
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.08,
          sharp: false
        });
      }
      // Layer 3: Sharp "Definition"
      for (let i = 0; i < 50 * countMultiplier; i++) {
        particlesRef.current.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.6),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.5),
          r: 15 + Math.random() * 30,
          opacity: 0.35 + Math.random() * 0.2,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          sharp: true
        });
      }
      // Layer 4: Highlights
      for (let i = 0; i < 20 * countMultiplier; i++) {
        particlesRef.current.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.6),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.5),
          r: 12 + Math.random() * 30,
          opacity: 0.25 + Math.random() * 0.2,
          vx: (Math.random() - 0.5) * 0.07,
          vy: (Math.random() - 0.5) * 0.07,
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

        // Soft bounce within current dimensions
        const dx = p.x - width / 2;
        const dy = p.y - height / 2;
        const normalizedDist = (dx * dx) / Math.pow(width / 2 + 30, 2) + (dy * dy) / Math.pow(height / 2 + 20, 2);
        
        if (normalizedDist > 1) {
          // Instead of hard bounce, gently pull back to center
          p.vx -= dx * 0.0001;
          p.vy -= dy * 0.0001;
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        const pColor = p.isWhite ? "255,255,255" : color;

        if (p.sharp) {
          gradient.addColorStop(0, `rgba(${pColor}, ${p.opacity})`);
          gradient.addColorStop(0.6, `rgba(${pColor}, ${p.opacity * 0.7})`);
          gradient.addColorStop(1, "rgba(255,255,255,0)");
        } else {
          gradient.addColorStop(0, `rgba(${pColor}, ${p.opacity})`);
          gradient.addColorStop(0.5, `rgba(${pColor}, ${p.opacity * 0.5})`);
          gradient.addColorStop(0.9, `rgba(${pColor}, ${p.opacity * 0.1})`);
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
      className={`relative animate-float ${className}`}
      style={{ width: dimensions.width, height: dimensions.height, ...style }}
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
      <div className="absolute inset-0 flex items-center justify-center px-20 py-8 z-10">
        <div className="cloud-content text-white text-center leading-relaxed max-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
