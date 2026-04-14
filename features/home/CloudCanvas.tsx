"use client";

import { useEffect, useRef } from "react";

interface CloudCanvasProps {
  side: "left" | "right";
  children: React.ReactNode;
  className?: string;
}

export default function CloudCanvas({ side, children, className = "" }: CloudCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 150 });

  // Measure content size
  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Add padding for the cloud mist (approx 80px total padding)
        setDimensions({ 
          width: Math.max(200, width + 100), 
          height: Math.max(120, height + 80) 
        });
      }
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

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

    // Initialize particles based on current dimensions
    const createParticles = () => {
      const countMultiplier = (width * height) / (300 * 150);
      
      // Mist
      for (let i = 0; i < 25 * countMultiplier; i++) {
        particles.push({
          x: 40 + Math.random() * (width - 80),
          y: 30 + Math.random() * (height - 60),
          r: 30 + Math.random() * 50,
          opacity: 0.08 + Math.random() * 0.05,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          sharp: false
        });
      }
      // Core
      for (let i = 0; i < 50 * countMultiplier; i++) {
        particles.push({
          x: 50 + Math.random() * (width - 100),
          y: 40 + Math.random() * (height - 80),
          r: 20 + Math.random() * 35,
          opacity: 0.15 + Math.random() * 0.1,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          sharp: false
        });
      }
      // Sharp Definition
      for (let i = 0; i < 30 * countMultiplier; i++) {
        particles.push({
          x: 60 + Math.random() * (width - 120),
          y: 50 + Math.random() * (height - 100),
          r: 8 + Math.random() * 15,
          opacity: 0.25 + Math.random() * 0.15,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          sharp: true
        });
      }
      // Sparkles
      for (let i = 0; i < 60 * countMultiplier; i++) {
        particles.push({
          x: 60 + Math.random() * (width - 120),
          y: 50 + Math.random() * (height - 100),
          r: 2 + Math.random() * 6,
          opacity: 0.4 + Math.random() * 0.2,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          sharp: false
        });
      }
      // Highlights
      for (let i = 0; i < 12 * countMultiplier; i++) {
        particles.push({
          x: 60 + Math.random() * (width - 120),
          y: 40 + Math.random() * (height - 80),
          r: 6 + Math.random() * 15,
          opacity: 0.2 + Math.random() * 0.2,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
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

        // Dynamic boundaries based on current dimensions
        if (p.x < 30 || p.x > width - 30) p.vx *= -1;
        if (p.y < 20 || p.y > height - 20) p.vy *= -1;

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
        className="absolute inset-0 blur-[1.5px] pointer-events-none"
      />

      {/* content wrapper for measurement */}
      <div 
        ref={contentRef}
        className="absolute inset-0 flex items-center justify-center px-12 py-8 text-white text-center leading-relaxed z-10"
      >
        {children}
      </div>
    </div>
  );
}
