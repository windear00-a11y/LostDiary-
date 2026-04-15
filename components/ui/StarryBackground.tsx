'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useSky } from '@/lib/sky-context';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleDirection: number;
  layer: number; // 1: far, 2: mid, 3: near
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
}

// Helper functions moved outside to avoid re-creation
const getMoonData = (width: number, height: number) => {
  // Check if Astronomy Engine is available
  const Astronomy = (window as any).Astronomy;
  
  if (Astronomy) {
    try {
      const date = new Date();
      const observer = new Astronomy.Observer(0, 0, 0); // Default to 0,0 (Equator/Prime Meridian)
      
      // Calculate Moon position (Horizontal coordinates: Azimuth/Altitude)
      const moonEquator = Astronomy.Equator('Moon', date, observer, true, true);
      const moonHoriz = Astronomy.Horizon(date, observer, moonEquator.ra, moonEquator.dec, 'Refraction');
      
      // Calculate Moon phase
      const phaseInfo = Astronomy.MoonPhase(date);
      const phase = phaseInfo / 360; // Convert 0-360 to 0-1
      
      // Map Altitude/Azimuth to screen coordinates
      // Altitude: -90 to 90 (0 is horizon)
      // Azimuth: 0 to 360 (North is 0, East is 90)
      
      // Simple mapping for visual effect:
      // We want the moon to be visible when altitude > 0
      // If altitude < 0, it's below horizon, we can either hide it or keep it at a default high position for "always on" feel
      const alt = moonHoriz.altitude; // in degrees
      const az = moonHoriz.azimuth; // in degrees
      
      // Normalize position for canvas
      const x = width * (0.5 + 0.4 * Math.sin(az * Math.PI / 180));
      const y = height * (0.5 - 0.4 * Math.sin(alt * Math.PI / 180));
      
      return { x, y, phase, isReal: true };
    } catch (e) {
      console.error('Astronomy Engine calculation failed:', e);
    }
  }

  // Fallback to static/calculated moon
  const referenceDate = new Date('2024-01-11T11:57:00Z').getTime();
  const now = Date.now();
  const diff = (now - referenceDate) / (1000 * 60 * 60 * 24);
  const phase = (diff % 29.53059) / 29.53059;
  
  const timeProgress = (new Date().getHours() * 3600 + new Date().getMinutes() * 60 + new Date().getSeconds()) / 86400;
  const x = width * (0.2 + 0.6 * timeProgress);
  const y = height * (0.3 - 0.2 * Math.sin(timeProgress * Math.PI));
  
  return { x, y, phase, isReal: false };
};

const getSkyBrightness = () => {
  const hour = new Date().getHours();
  if (hour >= 20 || hour <= 4) return 0;
  if (hour >= 5 && hour <= 8) return 0.15;
  if (hour >= 17 && hour <= 19) return 0.1;
  return 0.05;
};

const createShootingStar = (width: number, height: number) => {
  const startX = Math.random() * width;
  const startY = Math.random() * (height / 2);
  return {
    x: startX,
    y: startY,
    length: Math.random() * 80 + 40,
    speed: Math.random() * 10 + 15,
    opacity: 1,
    angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
  };
};

export type SkyMode = 'calm' | 'sad' | 'energetic';

interface ModeSettings {
  brightness: number;
  starOpacity: number;
  shootingStarFreq: number;
  nebulaOpacity: number;
}

const MODE_CONFIG: Record<SkyMode, ModeSettings> = {
  calm: {
    brightness: 1.0,
    starOpacity: 1.0,
    shootingStarFreq: 0.005,
    nebulaOpacity: 1.0,
  },
  sad: {
    brightness: 0.5,
    starOpacity: 0.4,
    shootingStarFreq: 0.001,
    nebulaOpacity: 0.3,
  },
  energetic: {
    brightness: 1.5,
    starOpacity: 1.3,
    shootingStarFreq: 0.02,
    nebulaOpacity: 1.8,
  },
};

export const StarryBackground = ({ mode: propMode }: { mode?: SkyMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const { mode: contextMode } = useSky();
  const [mounted, setMounted] = useState(false);
  const mousePos = useRef({ x: 0, y: 0 });
  
  const activeMode = propMode || contextMode;

  // Transition state
  const currentSettings = useRef<ModeSettings>({ ...MODE_CONFIG.calm });
  const targetMode = useRef<SkyMode>(activeMode);

  useEffect(() => {
    targetMode.current = activeMode;
  }, [activeMode]);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) - 0.5;
      mousePos.current.y = (e.clientY / window.innerHeight) - 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // Optimization: disable alpha if possible, but we need it for transparency? 
    // Actually, the canvas itself is transparent in the CSS, but the drawing inside can be optimized.
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let nebulas: Nebula[] = [];
    let lastTime = performance.now();
    let fadeOpacity = 0;
    
    // Dynamic star count based on screen size
    const getStarCount = (width: number) => {
      if (width < 768) return 60;
      if (width < 1200) return 100;
      return 150;
    };

    const initStars = (width: number, height: number) => {
      const count = getStarCount(width);
      stars = [];
      for (let i = 0; i < count; i++) {
        const layer = Math.random() < 0.6 ? 1 : Math.random() < 0.9 ? 2 : 3;
        let size = 0;
        let twinkleSpeed = 0;
        
        if (layer === 1) {
          size = Math.random() * 0.3 + 0.1; // Far: very small
          twinkleSpeed = Math.random() * 0.0003 + 0.0002; // Slow twinkle (per ms)
        } else if (layer === 2) {
          size = Math.random() * 0.5 + 0.4; // Mid: medium
          twinkleSpeed = Math.random() * 0.0008 + 0.0005; // Normal twinkle (per ms)
        } else {
          size = Math.random() * 0.8 + 1.0; // Near: slightly bigger
          twinkleSpeed = Math.random() * 0.0015 + 0.001; // Faster twinkle (per ms)
        }

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size,
          opacity: Math.random(),
          twinkleSpeed,
          twinkleDirection: Math.random() > 0.5 ? 1 : -1,
          layer,
        });
      }
    };

    const initNebulas = (width: number, height: number) => {
      nebulas = [
        { x: width * 0.2, y: height * 0.3, radius: width * 0.6, color: 'rgba(99, 102, 241, 0.02)' }, // Soft Indigo
        { x: width * 0.7, y: height * 0.6, radius: width * 0.7, color: 'rgba(168, 85, 247, 0.02)' }, // Soft Purple
        { x: width * 0.5, y: height * 0.2, radius: width * 0.5, color: 'rgba(59, 130, 246, 0.015)' }, // Soft Blue
      ];
    };

    const drawMoon = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, phase: number, isDark: boolean, globalAlpha: number) => {
      ctx.save();
      ctx.globalAlpha = globalAlpha;
      
      // Cinematic Halo (Outer)
      const haloOuter = ctx.createRadialGradient(x, y, radius * 1.2, x, y, radius * 6);
      const haloColor = isDark ? '255, 255, 255' : '99, 102, 241';
      haloOuter.addColorStop(0, `rgba(${haloColor}, ${isDark ? 0.08 : 0.03})`);
      haloOuter.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = haloOuter;
      ctx.beginPath();
      ctx.arc(x, y, radius * 6, 0, Math.PI * 2);
      ctx.fill();

      // Cinematic Halo (Inner)
      const haloInner = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 2.5);
      haloInner.addColorStop(0, `rgba(${haloColor}, ${isDark ? 0.2 : 0.06})`);
      haloInner.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = haloInner;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Moon Body Base
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.02)';
      ctx.fill();

      // Clipping for the illuminated part
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();

      const moonColor = isDark ? '#fefce8' : '#e0e7ff';
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 10);
      
      // Base Moon Surface
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(99, 102, 241, 0.08)';
      ctx.fill();

      // Phase Shading
      ctx.beginPath();
      if (phase < 0.5) {
        ctx.arc(0, 0, radius, Math.PI / 2, (Math.PI * 3) / 2, true);
        const r2 = radius * (1 - phase * 4);
        ctx.ellipse(0, 0, Math.abs(r2), radius, 0, Math.PI / 2, (Math.PI * 3) / 2, r2 < 0);
      } else {
        ctx.arc(0, 0, radius, Math.PI / 2, (Math.PI * 3) / 2, false);
        const r2 = radius * (1 - (phase - 0.5) * 4);
        ctx.ellipse(0, 0, Math.abs(r2), radius, 0, Math.PI / 2, (Math.PI * 3) / 2, r2 > 0);
      }
      ctx.fillStyle = moonColor;
      ctx.shadowBlur = 10;
      ctx.shadowColor = moonColor;
      ctx.fill();
      
      // Subtle Craters (Texture)
      ctx.globalAlpha = 0.03 * globalAlpha;
      ctx.fillStyle = '#000';
      const seed = Math.floor(phase * 100); // Semi-stable seed based on phase
      for(let i=0; i<8; i++) {
        const cx = Math.sin(seed + i) * radius * 0.5;
        const cy = Math.cos(seed * i) * radius * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * (0.1 + (i % 3) * 0.05), 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars(canvas.width, canvas.height);
      initNebulas(canvas.width, canvas.height);
      shootingStars = [];
    };

    let lastBrightnessUpdate = 0;
    let cachedBrightness = getSkyBrightness();

    const draw = (currentTime: number) => {
      if (!ctx || !canvas) return;

      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Smooth fade-in on mount
      if (fadeOpacity < 1) {
        fadeOpacity = Math.min(1, fadeOpacity + deltaTime * 0.001);
      }

      const isDark = resolvedTheme === 'dark';
      const now = Date.now();
      
      // Smoothly transition settings
      const target = MODE_CONFIG[targetMode.current];
      const lerp = (current: number, target: number, speed: number) => current + (target - current) * speed;
      const transitionSpeed = 0.002 * deltaTime; // Time-based transition

      currentSettings.current.brightness = lerp(currentSettings.current.brightness, target.brightness, transitionSpeed);
      currentSettings.current.starOpacity = lerp(currentSettings.current.starOpacity, target.starOpacity, transitionSpeed);
      currentSettings.current.shootingStarFreq = lerp(currentSettings.current.shootingStarFreq, target.shootingStarFreq, transitionSpeed);
      currentSettings.current.nebulaOpacity = lerp(currentSettings.current.nebulaOpacity, target.nebulaOpacity, transitionSpeed);

      // Update brightness only every 30 seconds
      if (now - lastBrightnessUpdate > 30000) {
        cachedBrightness = getSkyBrightness();
        lastBrightnessUpdate = now;
      }
      
      const effectiveBrightness = cachedBrightness * currentSettings.current.brightness;
      const rotationAngle = (now / 1000) * (Math.PI * 2 / 86400) * 10;

      // Draw background gradient
      ctx.globalAlpha = fadeOpacity;
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (isDark) {
        const nightBlue = Math.floor(23 * (1 + effectiveBrightness));
        gradient.addColorStop(0, `rgb(2, 6, ${nightBlue})`); 
        gradient.addColorStop(1, '#000000');
      } else {
        // Twilight sky for light mode to keep stars visible
        gradient.addColorStop(0, '#0f172a'); // slate-900
        gradient.addColorStop(1, '#1e293b'); // slate-800
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isDark) {
        const mx = mousePos.current.x * 20;
        const my = mousePos.current.y * 20;
        const nOpacity = currentSettings.current.nebulaOpacity;
        
        nebulas.forEach(nebula => {
          const nx = nebula.x + Math.cos(rotationAngle * 0.5) * 50 + mx;
          const ny = nebula.y + Math.sin(rotationAngle * 0.5) * 50 + my;
          
          const nGlow = ctx.createRadialGradient(nx, ny, 0, nx, ny, nebula.radius);
          const colorWithOpacity = nebula.color.replace(/[\d.]+\)$/g, `${0.02 * nOpacity * fadeOpacity})`);
          nGlow.addColorStop(0, colorWithOpacity);
          nGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = nGlow;
          ctx.beginPath();
          ctx.arc(nx, ny, nebula.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const mx = mousePos.current.x;
      const my = mousePos.current.y;
      const sOpacityMult = currentSettings.current.starOpacity * fadeOpacity;

      stars.forEach((star) => {
        // Time-based twinkling
        star.opacity += star.twinkleSpeed * deltaTime * star.twinkleDirection;
        if (star.opacity >= 1) {
          star.opacity = 1;
          star.twinkleDirection = -1;
        } else if (star.opacity <= 0.2) {
          star.opacity = 0.2;
          star.twinkleDirection = 1;
        }

        const dx = star.x - centerX;
        const dy = star.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const rotationFactor = star.layer === 1 ? 0.1 : star.layer === 2 ? 0.3 : 0.6;
        const parallaxFactor = star.layer === 1 ? 5 : star.layer === 2 ? 15 : 30;
        
        const angle = Math.atan2(dy, dx) + rotationAngle * rotationFactor;
        const rotatedX = centerX + Math.cos(angle) * distance + mx * parallaxFactor;
        const rotatedY = centerY + Math.sin(angle) * distance + my * parallaxFactor;

        const finalOpacity = star.opacity * sOpacityMult;
        if (finalOpacity <= 0.01) return;

        ctx.beginPath();
        ctx.arc(rotatedX, rotatedY, star.size, 0, Math.PI * 2);
        
        if (isDark) {
          ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
          if (star.layer === 3) {
            ctx.shadowBlur = 6 * finalOpacity;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
          }
        } else {
          ctx.fillStyle = `rgba(99, 102, 241, ${finalOpacity * 0.3})`;
          if (star.layer === 3) {
            ctx.shadowBlur = 4 * finalOpacity;
            ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
          }
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        
        if (star.layer === 3 && finalOpacity > 0.8) {
          ctx.beginPath();
          ctx.arc(rotatedX, rotatedY, star.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${finalOpacity * 0.08})` : `rgba(99, 102, 241, ${finalOpacity * 0.04})`;
          ctx.fill();
        }
      });

      const moonData = getMoonData(canvas.width, canvas.height);
      const moonX = moonData.x + mx * 5;
      const moonY = moonData.y + my * 5;
      const moonRadius = Math.min(canvas.width, canvas.height) * 0.05;
      drawMoon(ctx, moonX, moonY, moonRadius, moonData.phase, isDark, fadeOpacity);

      if (Math.random() < currentSettings.current.shootingStarFreq && shootingStars.length < 3) {
        shootingStars.push(createShootingStar(canvas.width, canvas.height));
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += Math.cos(ss.angle) * ss.speed * (deltaTime / 16.67); // Time-based speed
        ss.y += Math.sin(ss.angle) * ss.speed * (deltaTime / 16.67);
        ss.opacity -= 0.001 * deltaTime; // Time-based fade

        if (ss.opacity <= 0) {
          shootingStars.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = fadeOpacity;
        ctx.beginPath();
        const grad = ctx.createLinearGradient(
          ss.x, ss.y, 
          ss.x - Math.cos(ss.angle) * ss.length, 
          ss.y - Math.sin(ss.angle) * ss.length
        );
        
        const color = isDark ? '255, 255, 255' : '99, 102, 241';
        grad.addColorStop(0, `rgba(${color}, ${ss.opacity})`);
        grad.addColorStop(0.1, `rgba(${color}, ${ss.opacity * 0.8})`);
        grad.addColorStop(1, `rgba(${color}, 0)`);
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        if (isDark) {
          ctx.shadowBlur = 8 * ss.opacity;
          ctx.shadowColor = `rgba(${color}, 0.5)`;
        }
        
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - Math.cos(ss.angle) * ss.length, ss.y - Math.sin(ss.angle) * ss.length);
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();
    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mounted, resolvedTheme]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none transition-opacity duration-1000 opacity-100"
    />
  );
};
