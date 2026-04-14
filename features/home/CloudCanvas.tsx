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

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use a slightly larger canvas to allow for mist spread
    const width = 340;
    const height = 220;
    
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Function to draw a single glow puff
    const drawPuff = (x: number, y: number, r: number, opacity: number) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      
      const color = side === "left" ? "0, 217, 255" : "168, 85, 247"; // Vibrant Cyan vs Purple

      gradient.addColorStop(0, `rgba(${color}, ${opacity})`);
      gradient.addColorStop(0.4, `rgba(${color}, ${opacity * 0.6})`);
      gradient.addColorStop(0.7, `rgba(${color}, ${opacity * 0.2})`);
      gradient.addColorStop(1, "rgba(255,255,255,0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    // Layer 1: Large, very faint "Mist" (Base layer)
    for (let i = 0; i < 80; i++) {
      const x = 50 + Math.random() * (width - 100);
      const y = 50 + Math.random() * (height - 100);
      const r = 35 + Math.random() * 55;
      drawPuff(x, y, r, 0.25);
    }

    // Layer 2: Medium "Core" puffs (Defining the shape)
    for (let i = 0; i < 180; i++) {
      const x = 60 + Math.random() * (width - 120);
      const y = 60 + Math.random() * (height - 120);
      const r = 20 + Math.random() * 35;
      drawPuff(x, y, r, 0.45);
    }

    // Layer 3: Tiny "Dense Mist" particles (Adding texture)
    for (let i = 0; i < 300; i++) {
      const x = 70 + Math.random() * (width - 140);
      const y = 70 + Math.random() * (height - 140);
      const r = 4 + Math.random() * 12;
      drawPuff(x, y, r, 0.6);
    }

    // Optional: Add some "white" highlight puffs for depth
    for (let i = 0; i < 40; i++) {
      const x = 80 + Math.random() * (width - 160);
      const y = 60 + Math.random() * (height - 140);
      const r = 10 + Math.random() * 25;
      drawPuff(x, y, r, 0.1); // White-ish highlight handled by gradient end color usually, but let's add specific ones
      
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(255,255,255,0.2)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [side]);

  return (
    <div ref={containerRef} className={`relative w-[340px] h-[220px] animate-float ${className}`}>
      {/* cloud canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 blur-[0.5px] pointer-events-none"
      />

      {/* content */}
      <div className="absolute inset-0 flex items-center justify-center px-10 text-white text-center leading-relaxed z-10">
        {children}
      </div>
    </div>
  );
}
