import React, { useRef, useEffect } from "react";

interface AIPerceptionHUDProps {
  isArmed: boolean;
  flightMode: string;
}

interface SimulatedGate {
  id: number;
  z: number;      // Distance (100 to 0)
  xOffset: number; // Horizontal drift
  yOffset: number; // Vertical drift
  passed: boolean;
}

export const AIPerceptionHUD: React.FC<AIPerceptionHUDProps> = ({ isArmed, flightMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let frameCount = 0;

    // Simulation variables
    let gates: SimulatedGate[] = [
      { id: 1, z: 80, xOffset: -10, yOffset: -5, passed: false },
      { id: 2, z: 150, xOffset: 15, yOffset: 10, passed: false },
      { id: 3, z: 220, xOffset: -25, yOffset: 15, passed: false },
    ];

    let speed = 0;
    let cameraPitch = 0;
    let cameraYaw = 0;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth * window.devicePixelRatio;
        canvas.height = parent.clientHeight * window.devicePixelRatio;
        canvas.style.width = `${parent.clientWidth}px`;
        canvas.style.height = `${parent.clientHeight}px`;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scaleFactor = window.devicePixelRatio;
      ctx.scale(scaleFactor, scaleFactor);

      const w = canvas.width / scaleFactor;
      const h = canvas.height / scaleFactor;

      // Adjust camera movement speed and direction based on mode
      if (isArmed) {
        speed = flightMode === "RL_CONTROL" ? 1.4 : flightMode === "YOLO_TRACK" ? 2.2 : 0.8;
        // Minor yawing/pitching
        cameraPitch = Math.sin(frameCount * 0.02) * 8;
        cameraYaw = Math.cos(frameCount * 0.03) * 12;
      } else {
        speed = 0;
        cameraPitch *= 0.9;
        cameraYaw *= 0.9;
      }

      // 1. SPLIT VIEWPORT: Primary camera (left 75%), Depth map (right 25%)
      const mainWidth = Math.floor(w * 0.74);
      const sidebarWidth = w - mainWidth - 4;
      const dividerX = mainWidth;

      // DRAW MAIN CAMERA FEED
      ctx.save();
      // Mask main area
      ctx.beginPath();
      ctx.rect(0, 0, mainWidth, h);
      ctx.clip();

      // Draw Sky & Ground background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, "#0a0a0c");
      skyGrad.addColorStop(0.5, "#141419");
      skyGrad.addColorStop(0.51, "#1c1917"); // Ground horizon
      skyGrad.addColorStop(1, "#0c0a09");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, mainWidth, h);

      // Horizon offset
      const horizonY = h / 2 + cameraPitch;
      const centerCamX = mainWidth / 2 + cameraYaw;

      // Draw perspective grid lines for terrain
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      const gridZOffset = (frameCount * speed) % 40;

      for (let i = 0; i < 15; i++) {
        // Horizontal lines compressing towards horizon
        const z = i * 20 - gridZOffset + 1;
        if (z > 0) {
          const gridY = horizonY + 2500 / z;
          if (gridY < h) {
            ctx.beginPath();
            ctx.moveTo(0, gridY);
            ctx.lineTo(mainWidth, gridY);
            ctx.stroke();
          }
        }
      }

      // Vanishing lines radiating from center horizon
      for (let x = -8; x <= 8; x++) {
        ctx.beginPath();
        ctx.moveTo(centerCamX, horizonY);
        ctx.lineTo(centerCamX + x * 150, h);
        ctx.stroke();
      }

      // Draw Gates and bounding boxes
      gates.forEach((gate) => {
        // Update gate distance
        gate.z -= speed;
        if (gate.z <= 5) {
          // Recycle gate once passed
          gate.z = 240;
          gate.xOffset = (Math.random() - 0.5) * 60;
          gate.yOffset = (Math.random() - 0.5) * 30;
          gate.passed = false;
        }

        // Project gate coordinates (perspective projection)
        const d = gate.z;
        const scale = 220 / d; // perspective scale factor
        
        // Gate center on screen
        const sx = centerCamX + gate.xOffset * scale;
        const sy = horizonY + gate.yOffset * scale - 10 * scale;

        const gateW = 40 * scale;
        const gateH = 30 * scale;

        // Skip rendering if behind camera
        if (d <= 5) return;

        // Draw physical orange gate frame
        ctx.strokeStyle = "rgba(249, 115, 22, 0.9)"; // Orange tactical gate
        ctx.lineWidth = Math.max(1.5, 4 * scale);
        ctx.beginPath();
        // Left pillar
        ctx.moveTo(sx - gateW / 2, sy + gateH / 2);
        ctx.lineTo(sx - gateW / 2, sy - gateH / 2);
        // Right pillar
        ctx.moveTo(sx + gateW / 2, sy + gateH / 2);
        ctx.lineTo(sx + gateW / 2, sy - gateH / 2);
        // Top crossbar
        ctx.moveTo(sx - gateW / 2, sy - gateH / 2);
        ctx.lineTo(sx + gateW / 2, sy - gateH / 2);
        ctx.stroke();

        // Draw YOLO CV Bounding Box Overlay if armed and close enough
        if (isArmed && d < 180) {
          const boxPadding = 6;
          const bx = sx - gateW / 2 - boxPadding;
          const by = sy - gateH / 2 - boxPadding;
          const bw = gateW + boxPadding * 2;
          const bh = gateH + boxPadding * 2;

          // Drawing YOLO dashed bounding box in green
          ctx.strokeStyle = "rgba(59, 130, 246, 0.85)"; // Blue bounding box
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(bx, by, bw, bh);
          ctx.setLineDash([]);

          // Anchor corners (solid tech styling)
          ctx.strokeStyle = "rgba(59, 130, 246, 1)";
          ctx.lineWidth = 2.5;
          const edgeLength = Math.max(5, 10 * scale);
          
          // FL Corner
          ctx.beginPath(); ctx.moveTo(bx, by + edgeLength); ctx.lineTo(bx, by); ctx.lineTo(bx + edgeLength, by); ctx.stroke();
          // FR Corner
          ctx.beginPath(); ctx.moveTo(bx + bw - edgeLength, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + edgeLength); ctx.stroke();
          // BL Corner
          ctx.beginPath(); ctx.moveTo(bx, by + bh - edgeLength); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + edgeLength, by + bh); ctx.stroke();
          // BR Corner
          ctx.beginPath(); ctx.moveTo(bx + bw - edgeLength, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - edgeLength); ctx.stroke();

          // YOLO CV Class Label
          ctx.fillStyle = "rgba(59, 130, 246, 0.95)";
          const confidence = Math.min(99, Math.max(76, Math.floor(100 - (d / 6)))) / 100;
          const labelText = `GATE #${gate.id} [CONF: ${(confidence * 100).toFixed(0)}%]`;
          ctx.font = "bold 8px monospace";
          const labelW = ctx.measureText(labelText).width + 8;
          ctx.fillRect(bx, by - 12, labelW, 12);
          
          ctx.fillStyle = "#ffffff";
          ctx.fillText(labelText, bx + 4, by - 3);

          // YOLO Pose Estimation keypoints (the 4 corner nodes)
          ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
          const corners = [
            { x: sx - gateW / 2, y: sy - gateH / 2 },
            { x: sx + gateW / 2, y: sy - gateH / 2 },
            { x: sx + gateW / 2, y: sy + gateH / 2 },
            { x: sx - gateW / 2, y: sy + gateH / 2 },
          ];
          corners.forEach((pt, idx) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.font = "7px monospace";
            ctx.fillText(`K${idx}`, pt.x + 4, pt.y - 2);
            ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
          });
        }
      });

      // Front crosshair
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mainWidth / 2 - 15, h / 2);
      ctx.lineTo(mainWidth / 2 + 15, h / 2);
      ctx.moveTo(mainWidth / 2, h / 2 - 15);
      ctx.lineTo(mainWidth / 2, h / 2 + 15);
      ctx.stroke();

      // HUD borders & labels
      ctx.font = "9px monospace";
      ctx.fillStyle = "rgba(59, 130, 246, 0.95)";
      ctx.fillText(`INFERENCE: 4.6ms`, 12, h - 30);
      ctx.fillText(`YOLO ENGINE: V11-POSE`, 12, h - 18);
      ctx.fillText(`AI RATE: 24.5 HZ`, 12, h - 6);

      // Flight computer active overlay
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillText(`CAM FREQ: 5.8GHZ`, mainWidth - 110, 16);
      ctx.fillText(`FPS: 60.0`, mainWidth - 110, 28);
      
      ctx.restore();


      // 2. DEPTH MAP DRAWING (Sidebar Panel)
      ctx.save();
      ctx.beginPath();
      ctx.rect(dividerX + 4, 0, sidebarWidth, h);
      ctx.clip();

      // Depth gradient backgrounds
      ctx.fillStyle = "#110b29"; // Indigo dark thermal gradient background
      ctx.fillRect(dividerX + 4, 0, sidebarWidth, h);

      // Redraw Vanishing lines in deep purple
      ctx.strokeStyle = "rgba(99, 102, 241, 0.15)";
      ctx.lineWidth = 1;
      const sidebarHorizon = h / 2 + cameraPitch * 0.4;
      const sidebarCenterX = dividerX + 4 + sidebarWidth / 2 + cameraYaw * 0.4;

      for (let x = -4; x <= 4; x++) {
        ctx.beginPath();
        ctx.moveTo(sidebarCenterX, sidebarHorizon);
        ctx.lineTo(sidebarCenterX + x * 60, h);
        ctx.stroke();
      }

      // Draw depth-gates as filled silhouettes mapping depth
      gates.forEach((gate) => {
        const d = gate.z;
        const scale = 220 / d;
        const sx = sidebarCenterX + gate.xOffset * 0.4 * scale;
        const sy = sidebarHorizon + gate.yOffset * 0.4 * scale - 10 * 0.4 * scale;
        const gateW = 40 * 0.4 * scale;
        const gateH = 30 * 0.4 * scale;

        if (d <= 5) return;

        // Depth shader: closer is brighter yellow/green, further is dark purple/blue
        const intensity = Math.max(0, Math.min(255, Math.floor(255 - d * 1.05)));
        ctx.fillStyle = `rgb(${intensity}, ${Math.floor(intensity * 0.4)}, ${Math.floor(255 - intensity)})`;

        ctx.beginPath();
        // Draw physical solid silhouette of gate
        ctx.rect(sx - gateW / 2, sy - gateH / 2, gateW, gateH);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Sidebar labels
      ctx.font = "8px monospace";
      ctx.fillStyle = "rgba(99, 102, 241, 0.9)";
      ctx.fillText(`DEPTH INDEX (Z)`, dividerX + 10, 16);
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillText(`STEREO-CAM`, dividerX + 10, 26);

      ctx.restore();


      // DRAW SEPARATOR BORDER
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(dividerX, 0);
      ctx.lineTo(dividerX, h);
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [isArmed, flightMode]);

  return (
    <div className="relative w-full h-full bg-stone-950 flex flex-col overflow-hidden">
      {/* HUD scanning overlay line */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500/10 pointer-events-none animate-bounce" />
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
