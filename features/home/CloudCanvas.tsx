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

    // Use user's requested size
    const width = 300;
    const height = 180;
    
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw cloud puffs
    for (let i = 0; i < 120; i++) {
      const x = 40 + Math.random() * 220;
      const y = 40 + Math.random() * 100;
      const r = 20 + Math.random() * 50;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);

      if (side === "left") {
        gradient.addColorStop(0, "rgba(34,211,238,0.9)");
        gradient.addColorStop(0.4, "rgba(34,211,238,0.5)");
      } else {
        gradient.addColorStop(0, "rgba(168,85,247,0.9)");
        gradient.addColorStop(0.4, "rgba(168,85,247,0.5)");
      }

      gradient.addColorStop(1, "rgba(255,255,255,0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [side]);

  return (
    <div ref={containerRef} className={`relative w-[300px] h-[180px] animate-float ${className}`}>
      {/* cloud canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 blur-sm pointer-events-none"
      />

      {/* content */}
      <div className="absolute inset-0 flex items-center justify-center px-8 text-white text-center leading-relaxed z-10">
        {children}
      </div>
    </div>
  );
}
