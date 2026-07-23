import React, { useEffect, useRef } from "react";

export const KineticGears: React.FC<{ speed: number; isInverted: boolean }> = ({ speed, isInverted }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef(0);
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();
    let scrollY = window.scrollY;
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let targetScrollVelocity = 0;

    // Fast, passive scroll listener with scroll velocity calculation
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY;
      targetScrollVelocity = diff;
      lastScrollY = currentY;
      scrollY = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const renderGears = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Interpolate scrollVelocity towards target, then decay target
      scrollVelocity += (targetScrollVelocity - scrollVelocity) * 0.2;
      targetScrollVelocity *= 0.82;

      // Update rotation speed smoothly without resetting angle
      rotationRef.current = (rotationRef.current + delta * 15 * speedRef.current + (scrollVelocity * 0.12)) % 360000;
      const localRotation = rotationRef.current;

      const scale = window.devicePixelRatio || 1;
      const w = canvas.width / scale;
      const h = canvas.height / scale;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(scale, scale);

      // Color Palette - STRIKT NO RED!
      // Sophisticated tech/arcane tones - balanced blueprint visibility
      const gearColorMain = isInverted 
        ? "rgba(71, 85, 105, 0.28)"  // slate grey
        : "rgba(56, 189, 248, 0.22)"; // sky blue
      
      const gearColorSecondary = isInverted 
        ? "rgba(100, 116, 139, 0.35)" 
        : "rgba(186, 230, 253, 0.30)";

      const blueAccentAlpha = (a: number) => isInverted ? `rgba(71, 85, 105, ${Math.min(1, a * 1.8)})` : `rgba(125, 211, 252, ${Math.min(1, a * 2.0)})`;
      const whiteAlpha = (a: number) => isInverted ? `rgba(15, 23, 42, ${a})` : `rgba(255, 255, 255, ${a})`;
      const gridLineColor = isInverted ? "rgba(100, 116, 139, 0.08)" : "rgba(147, 197, 253, 0.08)";

      // Draw global subtle aligning grid lines (scrolling dynamically with page scroll)
      ctx.strokeStyle = gridLineColor;
      ctx.lineWidth = 1.0;
      const gridSize = 40;
      const startY = (-scrollY % gridSize + gridSize) % gridSize - gridSize;
      ctx.beginPath();
      for (let x = 0; x < w; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = startY; y < h + gridSize; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Scannable crosshairs "+" scattered across screen - only on larger screens
      const isMobile = w < 768;
      const isLaptop = w >= 768 && w < 1280;

      if (!isMobile) {
        ctx.strokeStyle = blueAccentAlpha(0.20);
        ctx.lineWidth = 1.2;
        const ticks = isLaptop ? [
          { x: 100, y: 120 }, { x: w - 120, y: 150 }
        ] : [
          { x: 100, y: 120 }, { x: w - 120, y: 150 },
          { x: 280, y: 700 }, { x: w - 300, y: 1100 },
          { x: w * 0.5, y: 500 }, { x: w * 0.35, y: 1600 }
        ];
        ticks.forEach((t) => {
          // Offset Y by scroll position for visual scrolling lock
          const drawY = t.y - scrollY;
          if (drawY > -10 && drawY < h + 10) {
            ctx.beginPath();
            ctx.moveTo(t.x - 6, drawY);
            ctx.lineTo(t.x + 6, drawY);
            ctx.moveTo(t.x, drawY - 6);
            ctx.lineTo(t.x, drawY + 6);
            ctx.stroke();
          }
        });
      }

      // ==========================================
      // GEOMETRIC & GEAR ARTWORK DRAWING FUNCTIONS
      // ==========================================

      // DRAW COMPLEX GEAR (Paper-cut style drop shadow)
      const drawComplexGear = (
        cx: number,
        cy: number,
        outerR: number,
        innerR: number,
        teeth: number,
        rotDeg: number,
        color: string,
        style: "spokes" | "plate" | "rings" | "simple"
      ) => {
        // Frame-culling check
        const drawY = cy - scrollY;
        if (drawY < -outerR - 100 || drawY > h + outerR + 100) return;

        ctx.save();
        ctx.translate(cx, drawY);
        ctx.rotate((rotDeg * Math.PI) / 180);

        // Gear teeth outline
        ctx.beginPath();
        const angleStep = (Math.PI * 2) / teeth;
        for (let i = 0; i < teeth; i++) {
          const baseAngle = i * angleStep;
          const a1 = baseAngle;
          const a2 = baseAngle + angleStep * 0.38;
          const a3 = baseAngle + angleStep * 0.62;
          const a4 = baseAngle + angleStep * 0.95;

          ctx.lineTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
          ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
          ctx.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
          ctx.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
        }
        ctx.closePath();

        // Punch inner holes depending on style (evenodd fill rule)
        const rimRadius = innerR * 0.82;
        const hubOuter = innerR * 0.28;
        const hubInner = innerR * 0.1;

        if (style === "rings" || style === "spokes" || style === "simple") {
          ctx.moveTo(rimRadius, 0);
          ctx.arc(0, 0, rimRadius, 0, Math.PI * 2, true);

          ctx.moveTo(hubOuter, 0);
          ctx.arc(0, 0, hubOuter, 0, Math.PI * 2, false);

          ctx.moveTo(hubInner, 0);
          ctx.arc(0, 0, hubInner, 0, Math.PI * 2, true);
        } else if (style === "plate") {
          const windowCount = teeth > 18 ? 6 : 4;
          const windowRadius = innerR * 0.18;
          const windowDist = innerR * 0.5;

          ctx.moveTo(hubInner * 1.5, 0);
          ctx.arc(0, 0, hubInner * 1.5, 0, Math.PI * 2, true);

          for (let i = 0; i < windowCount; i++) {
            const angle = (i * Math.PI * 2) / windowCount;
            const wx = Math.cos(angle) * windowDist;
            const wy = Math.sin(angle) * windowDist;
            ctx.moveTo(wx + windowRadius, wy);
            ctx.arc(wx, wy, windowRadius, 0, Math.PI * 2, true);
          }
        }

        // Drop shadow for real paper-cut appearance
        ctx.shadowColor = isInverted ? "rgba(0, 0, 0, 0.08)" : "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = isInverted ? 10 : 16;
        ctx.shadowOffsetX = isInverted ? 3 : 6;
        ctx.shadowOffsetY = isInverted ? 4 : 8;

        // Solid filling
        ctx.fillStyle = isInverted 
          ? "rgba(250, 249, 246, 0.98)" 
          : "rgba(10, 15, 30, 0.90)";
        
        ctx.fill("evenodd");

        // Clear shadows
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Crisp borders
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Structural elements
        if (style === "spokes") {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          const spokeCount = teeth > 18 ? 6 : 4;
          for (let i = 0; i < spokeCount; i++) {
            const sa = (i * Math.PI * 2) / spokeCount;
            ctx.moveTo(Math.cos(sa) * hubOuter, Math.sin(sa) * hubOuter);
            ctx.lineTo(Math.cos(sa) * rimRadius, Math.sin(sa) * rimRadius);
          }
          ctx.stroke();
        } else if (style === "rings") {
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(0, 0, rimRadius - 6, 0, Math.PI * 2);
          ctx.arc(0, 0, rimRadius - 12, 0, Math.PI * 2);
          ctx.stroke();

          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const sa = (i * Math.PI * 2) / 8;
            ctx.moveTo(Math.cos(sa) * hubOuter, Math.sin(sa) * hubOuter);
            ctx.lineTo(Math.cos(sa) * (rimRadius - 12), Math.sin(sa) * (rimRadius - 12));
          }
          ctx.stroke();
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      // DRAW METATRON'S CUBE (Magnificent Sacred Geometry)
      const drawMetatronsCube = (cx: number, cy: number, r: number, color: string, rotDeg: number) => {
        const drawY = cy - scrollY;
        if (drawY < -r - 100 || drawY > h + r + 100) return;

        ctx.save();
        ctx.translate(cx, drawY);
        ctx.rotate((rotDeg * Math.PI) / 180);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;

        const centers: { x: number; y: number }[] = [{ x: 0, y: 0 }];
        
        // Inner 6 circles
        const dist1 = r * 0.45;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          centers.push({
            x: Math.cos(angle) * dist1,
            y: Math.sin(angle) * dist1
          });
        }

        // Outer 6 circles
        const dist2 = r * 0.9;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          centers.push({
            x: Math.cos(angle) * dist2,
            y: Math.sin(angle) * dist2
          });
        }

        // Draw overlapping geometric circles
        centers.forEach((c) => {
          ctx.beginPath();
          ctx.arc(c.x, c.y, r * 0.22, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Web of all-to-all connecting lines (Creating the mind-bending sacred mesh)
        ctx.strokeStyle = blueAccentAlpha(0.06);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        for (let i = 0; i < centers.length; i++) {
          for (let j = i + 1; j < centers.length; j++) {
            ctx.moveTo(centers[i].x, centers[i].y);
            ctx.lineTo(centers[j].x, centers[j].y);
          }
        }
        ctx.stroke();

        // Beautiful outer hexagram ring with ticks
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        for (let a = 0; a < 360; a += 15) {
          const rad = (a * Math.PI) / 180;
          ctx.moveTo(Math.cos(rad) * r, Math.sin(rad) * r);
          ctx.lineTo(Math.cos(rad) * (r - 8), Math.sin(rad) * (r - 8));
        }
        ctx.stroke();

        ctx.restore();
      };

      // DRAW SEED OF LIFE
      const drawSeedOfLife = (cx: number, cy: number, r: number, color: string, rotDeg: number) => {
        const drawY = cy - scrollY;
        if (drawY < -r - 100 || drawY > h + r + 100) return;

        ctx.save();
        ctx.translate(cx, drawY);
        ctx.rotate((rotDeg * Math.PI) / 180);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        // Central circle
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        // 6 surrounding interlocking circles
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Concentric outer bounds with compass notches
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.0, 0, Math.PI * 2);
        ctx.arc(0, 0, r * 2.0 - 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = blueAccentAlpha(0.08);
        ctx.beginPath();
        for (let a = 0; a < 360; a += 5) {
          const rad = (a * Math.PI) / 180;
          const len = a % 30 === 0 ? 10 : 4;
          ctx.moveTo(Math.cos(rad) * (r * 2.0 - 5), Math.sin(rad) * (r * 2.0 - 5));
          ctx.lineTo(Math.cos(rad) * (r * 2.0 - 5 - len), Math.sin(rad) * (r * 2.0 - 5 - len));
        }
        ctx.stroke();

        ctx.restore();
      };

      // DRAW ALCHEMICAL ASTROLABE (Complex Clock-dial)
      const drawAlchemicalAstrolabe = (cx: number, cy: number, r: number, color: string, rotDeg: number) => {
        const drawY = cy - scrollY;
        if (drawY < -r - 100 || drawY > h + r + 100) return;

        ctx.save();
        ctx.translate(cx, drawY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;

        // Concentric dials
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.arc(0, 0, r - 12, 0, Math.PI * 2);
        ctx.arc(0, 0, r - 35, 0, Math.PI * 2);
        ctx.stroke();

        // Compass crosshairs
        ctx.strokeStyle = blueAccentAlpha(0.05);
        ctx.beginPath();
        ctx.moveTo(-r * 1.1, 0);
        ctx.lineTo(r * 1.1, 0);
        ctx.moveTo(0, -r * 1.1);
        ctx.lineTo(0, r * 1.1);
        ctx.stroke();

        // Rotating Runic Circle (clockwise)
        const runes = ["᚛", "ᛉ", "ᛖ", "ᛗ", "ᛚ", "ᛟ", "ᚦ", "ᚧ", "ᚩ", "ᚪ", "ᚫ", "ᚬ", "ᚭ", "ᚮ", "ᚯ", "ᚰ", "ᚱ", "ᚲ", "ᚳ", "ᚴ"];
        ctx.font = "bold 9px monospace";
        ctx.fillStyle = blueAccentAlpha(0.25);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.save();
        ctx.rotate((rotDeg * 0.15 * Math.PI) / 180);
        for (let i = 0; i < runes.length; i++) {
          const angle = (i * (360 / runes.length) * Math.PI) / 180;
          const rx = Math.sin(angle) * (r - 235 / 10); // fits perfectly between dial circles
          const ry = -Math.cos(angle) * (r - 235 / 10);
          ctx.fillText(runes[i], rx, ry);
        }
        ctx.restore();

        // Rotating inner decagram (counter-clockwise)
        ctx.save();
        ctx.rotate((-rotDeg * 0.1 * Math.PI) / 180);
        ctx.strokeStyle = blueAccentAlpha(0.07);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        const points = 10;
        for (let i = 0; i < points; i++) {
          const a = (i * Math.PI * 2) / points;
          const x = Math.cos(a) * (r - 45);
          const y = Math.sin(a) * (r - 45);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // Giant clock markers
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let a = 0; a < 360; a += 15) {
          const rad = (a * Math.PI) / 180;
          const len = a % 90 === 0 ? 15 : 8;
          ctx.moveTo(Math.cos(rad) * (r - 12), Math.sin(rad) * (r - 12));
          ctx.lineTo(Math.cos(rad) * (r - 12 - len), Math.sin(rad) * (r - 12 - len));
        }
        ctx.stroke();

        // Ticking astrolabe needle
        ctx.save();
        ctx.rotate((rotDeg * 0.3 * Math.PI) / 180);
        ctx.strokeStyle = blueAccentAlpha(0.35);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -r + 15);
        ctx.stroke();

        ctx.fillStyle = blueAccentAlpha(0.35);
        ctx.beginPath();
        ctx.arc(0, -r + 10, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
      };

      // DRAW HEPTAGRAM SEAL (7-pointed star of cosmos)
      const drawHeptagramSeal = (cx: number, cy: number, r: number, color: string, rotDeg: number) => {
        const drawY = cy - scrollY;
        if (drawY < -r - 100 || drawY > h + r + 100) return;

        ctx.save();
        ctx.translate(cx, drawY);
        ctx.rotate((rotDeg * Math.PI) / 180);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.9;

        // Nested circles
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
        ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
        ctx.stroke();

        // 7 Points coordinates
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < 7; i++) {
          const angle = (i * Math.PI * 2) / 7 - Math.PI / 2;
          pts.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r
          });
        }

        // Draw Heptagram outline by connecting non-adjacent vertices (step 3)
        ctx.strokeStyle = blueAccentAlpha(0.12);
        ctx.beginPath();
        let curr = 0;
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 0; i < 7; i++) {
          curr = (curr + 3) % 7;
          ctx.lineTo(pts[curr].x, pts[curr].y);
        }
        ctx.stroke();

        // Draw lines from vertices to center
        ctx.strokeStyle = blueAccentAlpha(0.04);
        ctx.beginPath();
        pts.forEach((p) => {
          ctx.moveTo(0, 0);
          ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        ctx.restore();
      };

      // DRAW ROMAN NUMERAL BACKGROUND CLOCK DIAL (Enormous subtle blueprint clockface)
      const drawRomanNumeralClockBackground = (cx: number, cy: number, r: number, color: string, rotDeg: number) => {
        const drawY = cy - scrollY;
        if (drawY < -r - 200 || drawY > h + r + 200) return;

        ctx.save();
        ctx.translate(cx, drawY);
        ctx.rotate((rotDeg * Math.PI) / 180);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;

        // Draw multiple fine rings
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
        ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
        ctx.stroke();

        // 12 ticks and Roman numerals
        const romanNumerals = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
        ctx.font = "bold italic 14px serif";
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
          
          // Draw tick
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * (r * 0.95), Math.sin(angle) * (r * 0.95));
          ctx.lineTo(Math.cos(angle) * (r * 0.88), Math.sin(angle) * (r * 0.88));
          ctx.stroke();

          // Draw Roman Numeral text
          ctx.save();
          const tx = Math.cos(angle) * (r * 0.77);
          const ty = Math.sin(angle) * (r * 0.77);
          ctx.translate(tx, ty);
          ctx.rotate(angle + Math.PI / 2);
          ctx.fillText(romanNumerals[i], 0, 0);
          ctx.restore();
        }

        // Draw compass crosshairs extending from center
        ctx.strokeStyle = blueAccentAlpha(0.08);
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.15);
        ctx.lineTo(0, r * 1.15);
        ctx.moveTo(-r * 1.15, 0);
        ctx.lineTo(r * 1.15, 0);
        ctx.stroke();

        ctx.restore();
      };

      // DRAW VESICA PISCIS (The sacred interlocking portal lenses)
      const drawVesicaPiscis = (cx: number, cy: number, r: number, color: string, rotDeg: number) => {
        const drawY = cy - scrollY;
        if (drawY < -r - 150 || drawY > h + r + 150) return;

        ctx.save();
        ctx.translate(cx, drawY);
        ctx.rotate((rotDeg * Math.PI) / 180);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;

        // Two interlocking circles intersecting at their centers
        const offset = r * 0.55;
        ctx.beginPath();
        ctx.arc(-offset, 0, r, 0, Math.PI * 2);
        ctx.arc(offset, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        // Inner aligning grids and fine chords
        ctx.strokeStyle = blueAccentAlpha(0.04);
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.3);
        ctx.lineTo(0, r * 1.3);
        ctx.moveTo(-r * 1.6, 0);
        ctx.lineTo(r * 1.6, 0);
        ctx.stroke();

        // Beautiful concentric orbiting ring with fine ticks
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = blueAccentAlpha(0.08);
        ctx.beginPath();
        for (let a = 0; a < 360; a += 10) {
          const rad = (a * Math.PI) / 180;
          ctx.moveTo(Math.cos(rad) * (r * 1.45), Math.sin(rad) * (r * 1.45));
          ctx.lineTo(Math.cos(rad) * (r * 1.45 - 6), Math.sin(rad) * (r * 1.45 - 6));
        }
        ctx.stroke();

        ctx.restore();
      };

      // DRAW DECAGRAM STAR (Ten-fold complex alchemical blueprint star)
      const drawDecagram = (cx: number, cy: number, r: number, color: string, rotDeg: number) => {
        const drawY = cy - scrollY;
        if (drawY < -r - 150 || drawY > h + r + 150) return;

        ctx.save();
        ctx.translate(cx, drawY);
        ctx.rotate((rotDeg * Math.PI) / 180);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.9;

        // Outer concentric boundaries
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
        ctx.stroke();

        // Star coordinates (10 vertices)
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI * 2) / 10 - Math.PI / 2;
          pts.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r
          });
        }

        // Draw outer ring of dots
        ctx.fillStyle = color;
        pts.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
        });

        // Connect every 3rd vertex to form a beautiful overlapping 10-pointed star
        ctx.strokeStyle = blueAccentAlpha(0.12);
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const next = (i * 3) % 10;
          if (i === 0) ctx.moveTo(pts[next].x, pts[next].y);
          else ctx.lineTo(pts[next].x, pts[next].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Connect every 4th vertex for the secondary sharper star
        ctx.strokeStyle = blueAccentAlpha(0.05);
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const next = (i * 4) % 10;
          if (i === 0) ctx.moveTo(pts[next].x, pts[next].y);
          else ctx.lineTo(pts[next].x, pts[next].y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
      };

      // DRAW TRANSMISSION BEAM CONNECTORS (Connecting active geometries with low-opacity cyber-lines)
      const drawConnectingBeam = (x1: number, y1: number, x2: number, y2: number, color: string) => {
        const drawY1 = y1 - scrollY;
        const drawY2 = y2 - scrollY;

        // Culling check - if both endpoints are way off-screen, don't draw
        if ((drawY1 < -200 && drawY2 < -200) || (drawY1 > h + 200 && drawY2 > h + 200)) return;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.6;
        ctx.setLineDash([4, 10]);
        
        ctx.beginPath();
        ctx.moveTo(x1, drawY1);
        ctx.lineTo(x2, drawY2);
        ctx.stroke();

        // Tiny crosshair junction dots at ends
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x1, drawY1, 2, 0, Math.PI * 2);
        ctx.arc(x2, drawY2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      // ==============================================
      // LAYERING ARCANE GEOMETRIES SCROLLABLE TIMELINE
      // ==============================================

      // STATIC & INTERCONNECTED CELESTIAL BEAMS
      if (!isMobile) {
        if (isLaptop) {
          drawConnectingBeam(w * 0.5, 450, w * 0.5, 1250, blueAccentAlpha(0.03));
          drawConnectingBeam(w * 0.5, 1250, w * 0.5, 2150, blueAccentAlpha(0.03));
        } else {
          drawConnectingBeam(w * 0.5, 450, w * 0.5, 1250, blueAccentAlpha(0.05));
          drawConnectingBeam(100, 300, w * 0.5, 450, blueAccentAlpha(0.04));
          drawConnectingBeam(w - 180, 280, w * 0.5, 450, blueAccentAlpha(0.04));
          drawConnectingBeam(w * 0.5, 1250, w * 0.25, 2150, blueAccentAlpha(0.04));
          drawConnectingBeam(w * 0.5, 1250, w * 0.75, 2150, blueAccentAlpha(0.04));
          drawConnectingBeam(w * 0.25, 2150, w * 0.75, 2150, blueAccentAlpha(0.03));
          drawConnectingBeam(w * 0.75, 2150, w * 0.5, 3100, blueAccentAlpha(0.04));
          drawConnectingBeam(w * 0.5, 3100, w * 0.5 - 150, 3250, blueAccentAlpha(0.03));
          drawConnectingBeam(w * 0.5, 3100, w * 0.5 + 150, 3250, blueAccentAlpha(0.03));
          drawConnectingBeam(150, 650, w * 0.5, 450, blueAccentAlpha(0.03));
          drawConnectingBeam(w - 180, 680, w * 0.5, 450, blueAccentAlpha(0.03));
        }
      }

      // SECTION 1 (Intro Page / Hero Room: Y = 0 to 900)
      if (isMobile) {
        // Mobile: Minimal elegant crown gear
        drawComplexGear(w * 0.5, 120, 50, 40, 10, localRotation * -1.2, gearColorMain, "simple");
      } else if (isLaptop) {
        // Laptop: Clean hero setup - Metatron's cube + primary crown & subtle side gears
        drawMetatronsCube(w * 0.5, 450, 180, blueAccentAlpha(0.04), localRotation * 0.08);
        drawComplexGear(w * 0.5, 110, 55, 44, 12, localRotation * -1.4, gearColorMain, "spokes");
        drawComplexGear(70, 300, 60, 48, 12, localRotation * 1.2, gearColorSecondary, "rings");
        drawComplexGear(w - 90, 300, 55, 44, 11, localRotation * -1.2, gearColorSecondary, "plate");
      } else {
        // Desktop: Full elaborate hero artwork
        drawRomanNumeralClockBackground(w * 0.5, 450, 440, blueAccentAlpha(0.045), localRotation * -0.05);
        drawMetatronsCube(w * 0.5, 450, 240, blueAccentAlpha(0.06), localRotation * 0.1);
        drawComplexGear(w * 0.5, 110, 65, 52, 14, localRotation * -1.4, gearColorMain, "spokes");
        drawComplexGear(w * 0.5 - 110, 95, 45, 36, 10, localRotation * 2.0, gearColorSecondary, "simple");
        drawComplexGear(w * 0.5 + 110, 95, 45, 36, 10, localRotation * 2.0, gearColorSecondary, "simple");
        drawComplexGear(100, 300, 85, 72, 18, localRotation * 1.2, gearColorSecondary, "rings");
        drawComplexGear(100 + 130, 360, 55, 44, 12, localRotation * -1.8, gearColorMain, "spokes");
        drawComplexGear(100 + 130 + 85, 420, 38, 30, 8, localRotation * 2.6, gearColorSecondary, "simple");
        drawSeedOfLife(w - 180, 280, 75, blueAccentAlpha(0.07), localRotation * -0.2);
        drawComplexGear(w - 120, 380, 65, 53, 14, localRotation * 1.5, gearColorMain, "plate");
        drawComplexGear(w - 220, 430, 42, 34, 9, localRotation * -2.3, gearColorSecondary, "spokes");
        drawDecagram(w - 120, 150, 60, blueAccentAlpha(0.04), localRotation * 0.3);
        drawComplexGear(140, 680, 95, 80, 20, localRotation * -0.9, gearColorMain, "rings");
        drawComplexGear(250, 740, 50, 40, 11, localRotation * 1.7, gearColorSecondary, "spokes");
        drawComplexGear(w - 160, 680, 90, 75, 18, localRotation * 1.0, gearColorSecondary, "plate");
        drawComplexGear(w - 270, 740, 52, 42, 11, localRotation * -1.7, gearColorMain, "simple");
      }

      // SECTION 2 (Flight Simulator / Central Rotator Sector: Y = 1000 to 1900)
      if (isMobile) {
        // Mobile: Single central astrolabe core
        drawAlchemicalAstrolabe(w * 0.5, 1250, 140, blueAccentAlpha(0.05), localRotation);
      } else if (isLaptop) {
        // Laptop: Astrolabe + 1 gear on each side
        drawAlchemicalAstrolabe(w * 0.5, 1250, 200, blueAccentAlpha(0.06), localRotation);
        drawComplexGear(w * 0.5 - 260, 1250, 55, 44, 12, localRotation * -1.3, gearColorMain, "plate");
        drawComplexGear(w * 0.5 + 260, 1250, 55, 44, 12, localRotation * -1.3, gearColorMain, "plate");
      } else {
        // Desktop: Full astrolabe clock, Roman clock, 6 side gears, Vesica Piscis
        drawRomanNumeralClockBackground(w * 0.5, 1250, 420, blueAccentAlpha(0.035), localRotation * 0.08);
        drawAlchemicalAstrolabe(w * 0.5, 1250, 260, blueAccentAlpha(0.08), localRotation);
        drawComplexGear(w * 0.5 - 320, 1250, 75, 63, 16, localRotation * -1.3, gearColorMain, "plate");
        drawComplexGear(w * 0.5 - 435, 1190, 50, 40, 11, localRotation * 1.95, gearColorSecondary, "spokes");
        drawComplexGear(w * 0.5 - 435, 1310, 50, 40, 11, localRotation * 1.95, gearColorSecondary, "rings");
        drawComplexGear(w * 0.5 + 320, 1250, 75, 63, 16, localRotation * -1.3, gearColorMain, "plate");
        drawComplexGear(w * 0.5 + 435, 1190, 50, 40, 11, localRotation * 1.95, gearColorSecondary, "spokes");
        drawComplexGear(w * 0.5 + 435, 1310, 50, 40, 11, localRotation * 1.95, gearColorSecondary, "rings");
        drawVesicaPiscis(w * 0.5 - 550, 1250, 100, blueAccentAlpha(0.05), localRotation * -0.25);
        drawVesicaPiscis(w * 0.5 + 550, 1250, 100, blueAccentAlpha(0.05), localRotation * 0.25);
      }

      // SECTION 3 (Timeline / Projects Grid Room: Y = 2000 to 2900)
      if (isMobile) {
        drawComplexGear(w * 0.5, 2150, 50, 40, 12, localRotation * 0.7, gearColorSecondary, "rings");
      } else if (isLaptop) {
        drawSeedOfLife(w * 0.2, 2150, 60, blueAccentAlpha(0.05), localRotation * 0.35);
        drawComplexGear(w * 0.8, 2150, 70, 58, 16, localRotation * 0.7, gearColorSecondary, "rings");
      } else {
        drawRomanNumeralClockBackground(w * 0.35, 2250, 360, blueAccentAlpha(0.03), localRotation * -0.06);
        drawSeedOfLife(w * 0.25, 2150, 90, blueAccentAlpha(0.06), localRotation * 0.35);
        drawComplexGear(w * 0.25 - 130, 2150, 60, 48, 13, localRotation * -0.5, gearColorMain, "spokes");
        drawComplexGear(w * 0.75, 2150, 110, 95, 24, localRotation * 0.7, gearColorSecondary, "rings");
        drawComplexGear(w * 0.75 - 150, 2150, 50, 40, 12, localRotation * -1.54, gearColorMain, "simple");
        drawComplexGear(w * 0.75 + 150, 2150, 50, 40, 12, localRotation * -1.54, gearColorMain, "plate");
        drawDecagram(120, 2450, 80, blueAccentAlpha(0.05), localRotation * -0.12);
        drawComplexGear(120, 2580, 60, 48, 12, localRotation * 1.2, gearColorSecondary, "spokes");
        drawVesicaPiscis(w - 140, 2350, 70, blueAccentAlpha(0.04), localRotation * 0.2);
        drawComplexGear(w - 140, 2480, 65, 52, 14, localRotation * -1.1, gearColorMain, "rings");
      }

      // SECTION 4 (About Me / Terminal & Footer Area: Y = 3000 to 4200)
      if (isMobile) {
        drawHeptagramSeal(w * 0.5, 3100, 120, blueAccentAlpha(0.04), localRotation * -0.15);
      } else if (isLaptop) {
        drawHeptagramSeal(w * 0.5, 3100, 160, blueAccentAlpha(0.05), localRotation * -0.15);
        drawComplexGear(w * 0.5 - 120, 3250, 60, 50, 14, localRotation * 1.0, gearColorMain, "spokes");
        drawComplexGear(w * 0.5 + 120, 3250, 60, 50, 14, localRotation * -1.0, gearColorSecondary, "plate");
      } else {
        drawRomanNumeralClockBackground(w * 0.5, 3100, 410, blueAccentAlpha(0.04), localRotation * 0.05);
        drawHeptagramSeal(w * 0.5, 3100, 220, blueAccentAlpha(0.07), localRotation * -0.15);
        drawComplexGear(w * 0.5 - 150, 3250, 80, 68, 18, localRotation * 1.0, gearColorMain, "spokes");
        drawComplexGear(w * 0.5 + 150, 3250, 80, 68, 18, localRotation * -1.0, gearColorSecondary, "plate");
        drawComplexGear(w * 0.5 - 280, 3320, 55, 44, 12, localRotation * -1.45, gearColorSecondary, "simple");
        drawComplexGear(w * 0.5 + 280, 3320, 55, 44, 12, localRotation * 1.45, gearColorMain, "simple");
        drawVesicaPiscis(w * 0.15, 3500, 110, blueAccentAlpha(0.05), localRotation * 0.15);
        drawComplexGear(w * 0.15 + 130, 3500, 55, 44, 12, localRotation * -1.3, gearColorMain, "spokes");
        drawDecagram(w * 0.85, 3500, 110, blueAccentAlpha(0.05), localRotation * -0.15);
        drawComplexGear(w * 0.85 - 130, 3500, 55, 44, 12, localRotation * 1.3, gearColorSecondary, "rings");
      }


      // HORIZON LASER SCAN SWEEP ON SCROLL
      if (Math.abs(scrollVelocity) > 0.8) {
        const sweepY = (scrollY * 1.8) % h;
        ctx.strokeStyle = blueAccentAlpha(Math.min(0.4, Math.abs(scrollVelocity) * 0.015));
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, sweepY);
        ctx.lineTo(w, sweepY);
        ctx.stroke();

        ctx.fillStyle = blueAccentAlpha(Math.min(0.08, Math.abs(scrollVelocity) * 0.003));
        ctx.fillRect(0, sweepY - 8, w, 16);
      }

      ctx.restore();

      animationId = requestAnimationFrame(renderGears);
    };

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        const ratio = window.devicePixelRatio || 1;
        canvas.width = canvas.parentElement.clientWidth * ratio;
        canvas.height = canvas.parentElement.clientHeight * ratio;
        canvas.style.width = `${canvas.parentElement.clientWidth}px`;
        canvas.style.height = `${canvas.parentElement.clientHeight}px`;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    renderGears();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [speed, isInverted]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none block"
    />
  );
};
