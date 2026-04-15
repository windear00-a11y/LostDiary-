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

    const margin = 50;
    const color = side === "left" ? "34,211,238" : "168,85,247";

    // Initialize particles ONLY IF they don't exist
    if (particlesRef.current.length === 0) {
      const { width, height } = dimensionsRef.current;
      const countMultiplier = 0.5; // Even fewer particles for a cleaner look
      
      // Layer 1: Soft base puffs
      for (let i = 0; i < 15 * countMultiplier; i++) {
        particlesRef.current.push({
          x: width / 2 + (Math.random() - 0.5) * width,
          y: height / 2 + (Math.random() - 0.5) * height,
          r: 30 + Math.random() * 40,
          opacity: 0.08 + Math.random() * 0.05,
          vx: (Math.random() - 0.5) * 0.005, // Almost static
          vy: (Math.random() - 0.5) * 0.005,
          sharp: false
        });
      }
      // Layer 2: Medium puffy circles
      for (let i = 0; i < 25 * countMultiplier; i++) {
        particlesRef.current.push({
          x: width / 2 + (Math.random() - 0.5) * width,
          y: height / 2 + (Math.random() - 0.5) * height,
          r: 20 + Math.random() * 30,
          opacity: 0.12 + Math.random() * 0.08,
          vx: (Math.random() - 0.5) * 0.008,
          vy: (Math.random() - 0.5) * 0.008,
          sharp: false
        });
      }
    }

    const animate = () => {
      const { width, height } = dimensionsRef.current;
      
      // Update canvas size if needed
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

        // Soft bounce within current dimensions - very tight to text
        const dx = p.x - width / 2;
        const dy = p.y - height / 2;
        const normalizedDist = (dx * dx) / Math.pow(width / 2 + 5, 2) + (dy * dy) / Math.pow(height / 2 + 2, 2);
        
        if (normalizedDist > 1) {
          p.vx -= dx * 0.00002; // Barely moving
          p.vy -= dy * 0.00002;
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        const pColor = p.isWhite ? "255,255,255" : color;

        // Ultra-soft gradients for "puffy" look
        gradient.addColorStop(0, `rgba(${pColor}, ${p.opacity})`);
        gradient.addColorStop(0.5, `rgba(${pColor}, ${p.opacity * 0.3})`);
        gradient.addColorStop(1, "rgba(255,255,255,0)");

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
        className="absolute pointer-events-none blur-[12px]"
        style={{ 
          top: -50, 
          left: -50, 
          width: dimensions.width + 100, 
          height: dimensions.height + 100 
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
