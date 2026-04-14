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
  const [dimensions, setDimensions] = useState({ width: 280, height: 140 });

  // Measure content size more reliably
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const content = containerRef.current.querySelector('.cloud-content');
      const parent = containerRef.current.parentElement;
      
      if (content && parent) {
        const rect = content.getBoundingClientRect();
        const parentWidth = parent.offsetWidth;
        
        // Add padding and cap width based on parent container
        // Scale padding for smaller screens
        const paddingX = parentWidth < 400 ? 120 : 180;
        const paddingY = parentWidth < 400 ? 100 : 140;
        
        // Ensure we don't exceed parent width (minus some buffer for safety)
        const maxWidth = Math.min(parentWidth - 10, 500);
        
        setDimensions({ 
          width: Math.min(maxWidth, Math.max(200, rect.width + paddingX)), 
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
    const margin = 100; // Extra space around the canvas to prevent clipping
    canvas.width = width + margin * 2;
    canvas.height = height + margin * 2;
    
    ctx.translate(margin, margin);

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
      const countMultiplier = Math.min(2, (width * height) / (280 * 140));
      
      // Layer 1: Large "Mist" (Base layer)
      for (let i = 0; i < 60 * countMultiplier; i++) {
        particles.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.7),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.6),
          r: 50 + Math.random() * 70,
          opacity: 0.12 + Math.random() * 0.08,
          vx: (Math.random() - 0.5) * 0.05,
          vy: (Math.random() - 0.5) * 0.05,
          sharp: false
        });
      }
      // Layer 2: Medium "Core" puffs (Defining the puffy shape)
      for (let i = 0; i < 120 * countMultiplier; i++) {
        particles.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.6),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.5),
          r: 30 + Math.random() * 50,
          opacity: 0.2 + Math.random() * 0.15,
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.08,
          sharp: false
        });
      }
      // Layer 3: Sharp "Definition" puffs
      for (let i = 0; i < 60 * countMultiplier; i++) {
        particles.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.5),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.4),
          r: 15 + Math.random() * 30,
          opacity: 0.35 + Math.random() * 0.2,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          sharp: true
        });
      }
      // Layer 4: Highlights (White puffs)
      for (let i = 0; i < 25 * countMultiplier; i++) {
        particles.push({
          x: width / 2 + (Math.random() - 0.5) * (width * 0.5),
          y: height / 2 + (Math.random() - 0.5) * (height * 0.4),
          r: 12 + Math.random() * 30,
          opacity: 0.25 + Math.random() * 0.2,
          vx: (Math.random() - 0.5) * 0.07,
          vy: (Math.random() - 0.5) * 0.07,
          sharp: Math.random() > 0.5,
          isWhite: true
        });
      }
    };

    createParticles();

    const animate = () => {
      // Clear the ENTIRE canvas including margins
      ctx.clearRect(-margin, -margin, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Soft bounce within elliptical bounds - slightly larger to fill space
        const dx = p.x - width / 2;
        const dy = p.y - height / 2;
        const normalizedDist = (dx * dx) / Math.pow(width / 2 + 20, 2) + (dy * dy) / Math.pow(height / 2 + 10, 2);
        
        if (normalizedDist > 1) {
          p.vx *= -1;
          p.vy *= -1;
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
      <div className="absolute inset-0 flex items-center justify-center px-14 py-10 z-10">
        <div className="cloud-content text-white text-center leading-relaxed max-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
