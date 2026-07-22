import React, { useEffect, useRef } from "react";

interface LaserScanTransitionProps {
  isEntering: boolean;
  hasEntered: boolean;
  isFadingOut?: boolean;
  stage: number;
}

export const LaserScanTransition: React.FC<LaserScanTransitionProps> = ({
  isEntering,
  hasEntered,
  isFadingOut = false,
  stage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Keep animating during transition phase
    if (!isEntering || hasEntered) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let startTime = performance.now();
    let stage4StartTime: number | null = null;

    // Laser streaks pool for high-velocity horizontal laser scanlines
    const streaks = Array.from({ length: 60 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speed: (Math.random() * 900 + 600) * (i % 2 === 0 ? 1 : -1),
      length: Math.random() * 0.4 + 0.15,
      alpha: Math.random() * 0.7 + 0.3,
      thick: Math.random() * 2 + 1,
      color: i % 4 === 0 ? "#ffffff" : i % 3 === 0 ? "#38bdf8" : "#0284c7",
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Helper to draw a sleek glowing horizontal laser scan line
    const drawLaserLine = (
      y: number,
      w: number,
      beamHeight: number,
      intensity: number,
      coreColor = "#ffffff",
      glowColor = "#38bdf8"
    ) => {
      const beamGrad = ctx.createLinearGradient(0, y - beamHeight, 0, y + beamHeight);
      beamGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
      beamGrad.addColorStop(0.25, `rgba(56, 189, 248, ${0.18 * intensity})`);
      beamGrad.addColorStop(0.5, `rgba(224, 242, 254, ${0.6 * intensity})`);
      beamGrad.addColorStop(0.75, `rgba(56, 189, 248, ${0.18 * intensity})`);
      beamGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, y - beamHeight, w, beamHeight * 2);

      // Piercing Electric Core Laser line
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 14 * intensity;
      ctx.fillStyle = coreColor;
      ctx.fillRect(0, y - 0.75, w, 1.5);
      ctx.restore();
    };

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // --- GRADUAL LASER SCANLINE INTENSIFICATION ACROSS STAGES ---
      if (stage === 1) {
        // STAGE 1: Moderate Intensity — 2 Horizon Laser Beams + Fine Grid + 10 Streaks
        const y1 = (elapsed * 320) % h;
        const y2 = (h - (elapsed * 280) % h + h) % h;

        drawLaserLine(y1, w, 12, 0.8);
        drawLaserLine(y2, w, 10, 0.7);

        // Grid lines
        ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
        ctx.lineWidth = 1;
        for (let y = 0; y < h; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Active Streaks (10)
        streaks.slice(0, 10).forEach((s) => {
          s.x = (s.x + s.speed * 0.016 + w) % w;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.thick;
          ctx.globalAlpha = s.alpha * 0.4;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + s.length * w * 0.2, s.y);
          ctx.stroke();
        });

      } else if (stage === 2) {
        // STAGE 2: Higher Intensity — 4 Horizon Laser Beams + Crisper Grid + 22 Streaks
        const y1 = (elapsed * 480) % h;
        const y2 = (h - (elapsed * 420) % h + h) % h;
        const y3 = (elapsed * 620 + h * 0.33) % h;
        const y4 = (h - (elapsed * 540) % h + h * 0.66) % h;

        drawLaserLine(y1, w, 14, 1.0);
        drawLaserLine(y2, w, 12, 0.9);
        drawLaserLine(y3, w, 11, 0.85);
        drawLaserLine(y4, w, 10, 0.8);

        // Crisper, denser grid
        ctx.strokeStyle = "rgba(56, 189, 248, 0.10)";
        ctx.lineWidth = 1;
        for (let y = 0; y < h; y += 28) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Active Streaks (22)
        streaks.slice(0, 22).forEach((s) => {
          s.x = (s.x + s.speed * 1.3 * 0.016 + w) % w;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.thick * 1.2;
          ctx.globalAlpha = s.alpha * 0.65;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + s.length * w * 0.28, s.y);
          ctx.stroke();
        });

      } else if (stage === 3) {
        // STAGE 3: Intense — 6 Horizon Beams + Vibrant Grid + 40 Fast Electric Streaks
        const y1 = (elapsed * 700) % h;
        const y2 = (h - (elapsed * 640) % h + h) % h;
        const y3 = (elapsed * 850 + h * 0.25) % h;
        const y4 = (h - (elapsed * 780) % h + h * 0.5) % h;
        const y5 = (elapsed * 920 + h * 0.75) % h;
        const y6 = (h - (elapsed * 880) % h + h * 0.85) % h;

        drawLaserLine(y1, w, 18, 1.25);
        drawLaserLine(y2, w, 16, 1.15);
        drawLaserLine(y3, w, 14, 1.05);
        drawLaserLine(y4, w, 14, 1.0);
        drawLaserLine(y5, w, 12, 0.95);
        drawLaserLine(y6, w, 12, 0.9);

        // Vibrant dense scanline grid
        ctx.strokeStyle = "rgba(56, 189, 248, 0.18)";
        ctx.lineWidth = 1;
        for (let y = 0; y < h; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Active Streaks (40)
        streaks.slice(0, 40).forEach((s) => {
          s.x = (s.x + s.speed * 1.7 * 0.016 + w) % w;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.thick * 1.4;
          ctx.globalAlpha = s.alpha * 0.85;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + s.length * w * 0.35, s.y);
          ctx.stroke();
        });

      } else if (stage === 4) {
        // STAGE 4: Peak Crescendo — Expanding Central Beam + Dense Electric Horizon Laser Torrent
        if (!stage4StartTime) stage4StartTime = now;
        const stage4Progress = Math.min(1, (now - stage4StartTime) / 700);

        const primaryY = h * 0.5;
        const beamHalfHeight = 24 + stage4Progress * (h * 0.5);

        // Central expanding horizon laser beam
        drawLaserLine(primaryY, w, beamHalfHeight, 1.5 + stage4Progress * 0.8, "#ffffff", "#38bdf8");

        // High-density scanline grid
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.25 + stage4Progress * 0.2})`;
        ctx.lineWidth = 1;
        for (let y = 0; y < h; y += 14) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Full torrent of streaks (60)
        streaks.forEach((s) => {
          s.x = (s.x + s.speed * 2.2 * 0.016 + w) % w;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.thick * 1.6;
          ctx.globalAlpha = Math.min(1, s.alpha * (0.9 + stage4Progress * 0.3));
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + s.length * w * 0.45, s.y);
          ctx.stroke();
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [isEntering, hasEntered, stage]);

  // Completely gone when transition finishes or main page entered
  if (!isEntering || hasEntered) return null;

  return (
    <div className={`fixed inset-0 z-[100] pointer-events-none overflow-hidden mix-blend-screen transition-opacity duration-800 ease-out ${
      isFadingOut ? "opacity-0" : "opacity-100"
    }`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};


