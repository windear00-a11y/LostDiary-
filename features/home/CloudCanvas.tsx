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
  const foregroundCanvasRef = useRef<HTMLCanvasElement>(null);
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
    const fgCanvas = foregroundCanvasRef.current;
    if (!canvas || !fgCanvas) return;

    const ctx = canvas.getContext("2d");
    const fgCtx = fgCanvas.getContext("2d");
    if (!ctx || !fgCtx) return;

    const margin = 50;
    const color = side === "left" ? "34,211,238" : "168,85,247";

    // Initialize particles ONLY IF they don't exist
    if (particlesRef.current.length === 0) {
      const { width, height } = dimensionsRef.current;
      const countMultiplier = 0.8; // Increased for better visibility
      
      // Layer 1: Soft base puffs (Increased opacity)
      for (let i = 0; i < 20 * countMultiplier; i++) {
        particlesRef.current.push({
          x: width / 2 + (Math.random() - 0.5) * width,
          y: height / 2 + (Math.random() - 0.5) * height,
          r: 35 + Math.random() * 45,
          opacity: 0.18 + Math.random() * 0.1, // Increased visibility
          vx: (Math.random() - 0.5) * 0.005,
          vy: (Math.random() - 0.5) * 0.005,
          sharp: false,
          isForeground: Math.random() < 0.1
        });
      }
      // Layer 2: Medium puffy circles (Increased opacity)
      for (let i = 0; i < 35 * countMultiplier; i++) {
        particlesRef.current.push({
          x: width / 2 + (Math.random() - 0.5) * width,
          y: height / 2 + (Math.random() - 0.5) * height,
          r: 25 + Math.random() * 35,
          opacity: 0.22 + Math.random() * 0.15, // Increased visibility
          vx: (Math.random() - 0.5) * 0.008,
          vy: (Math.random() - 0.5) * 0.008,
          sharp: false,
          isForeground: Math.random() < 0.1
        });
      }

      // Layer 3: The "Tail" - Points toward the sender
      const tailX = side === "right" ? width * 0.85 : width * 0.15;
      const tailY = height * 0.85;
      
      for (let i = 0; i < 10; i++) {
        const offset = i * 5;
        particlesRef.current.push({
          x: side === "right" ? tailX + offset : tailX - offset,
          y: tailY + offset * 0.4,
          r: 18 - i * 1.5, // Tapering off
          opacity: 0.25 - i * 0.02,
          vx: (Math.random() - 0.5) * 0.005,
          vy: (Math.random() - 0.5) * 0.005,
          sharp: false,
          isTail: true,
          isForeground: false
        });
      }

      // Layer 4: Tail Fog - Many tiny, very soft particles
      for (let i = 0; i < 25; i++) {
        const t = Math.random();
        const offset = t * 40;
        particlesRef.current.push({
          x: side === "right" ? tailX + offset + (Math.random() - 0.5) * 15 : tailX - offset + (Math.random() - 0.5) * 15,
          y: tailY + offset * 0.4 + (Math.random() - 0.5) * 15,
          r: 2 + Math.random() * 8,
          opacity: 0.05 + Math.random() * 0.1,
          vx: (Math.random() - 0.5) * 0.01,
          vy: (Math.random() - 0.5) * 0.01,
          sharp: false,
          isTail: true,
          isForeground: false
        });
      }
    }

    const animate = () => {
      const { width, height } = dimensionsRef.current;
      
      // Update canvas size if needed
      if (canvas.width !== width + margin * 2 || canvas.height !== height + margin * 2) {
        canvas.width = width + margin * 2;
        canvas.height = height + margin * 2;
        fgCanvas.width = width + margin * 2;
        fgCanvas.height = height + margin * 2;
      }

      ctx.save();
      fgCtx.save();
      ctx.translate(margin, margin);
      fgCtx.translate(margin, margin);
      ctx.clearRect(-margin, -margin, canvas.width, canvas.height);
      fgCtx.clearRect(-margin, -margin, fgCanvas.width, fgCanvas.height);

      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Soft bounce within current dimensions - very tight to text
        // Don't pull tail particles back to center to maintain their shape
        const dx = p.x - width / 2;
        const dy = p.y - height / 2;
        const normalizedDist = (dx * dx) / Math.pow(width / 2 + 5, 2) + (dy * dy) / Math.pow(height / 2 + 2, 2);
        
        if (normalizedDist > 1 && !p.isTail) {
          p.vx -= dx * 0.00002; // Barely moving
          p.vy -= dy * 0.00002;
        }

        const targetCtx = p.isForeground ? fgCtx : ctx;
        const gradient = targetCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        const pColor = p.isWhite ? "255,255,255" : color;

        // Ultra-soft gradients for "puffy" look
        // Foreground particles are even more transparent
        const currentOpacity = p.isForeground ? p.opacity * 0.4 : p.opacity;

        gradient.addColorStop(0, `rgba(${pColor}, ${currentOpacity})`);
        gradient.addColorStop(0.5, `rgba(${pColor}, ${currentOpacity * 0.3})`);
        gradient.addColorStop(1, "rgba(255,255,255,0)");

        targetCtx.fillStyle = gradient;
        targetCtx.beginPath();
        targetCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        targetCtx.fill();
      });

      ctx.restore();
      fgCtx.restore();
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
      className={`relative inline-block ${className}`}
      style={style}
    >
      {/* background cloud canvas */}
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

      {/* foreground cloud canvas (renders over text) */}
      <canvas
        ref={foregroundCanvasRef}
        className="absolute pointer-events-none blur-[15px] z-20"
        style={{ 
          top: -50, 
          left: -50, 
          width: dimensions.width + 100, 
          height: dimensions.height + 100 
        }}
      />
    </div>
  );
}
