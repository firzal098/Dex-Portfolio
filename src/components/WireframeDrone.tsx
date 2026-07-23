import React, { useRef, useEffect, useState } from "react";

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface WireframeDroneProps {
  isArmed: boolean;
  flightMode: string;
  pidP: number;
  pidI: number;
  pidD: number;
  onTelemetryUpdate: (telemetry: {
    altitude: number;
    speed: number;
    heading: number;
    pitch: number;
    roll: number;
    yaw: number;
    motorRPMs: number[];
  }) => void;
}

export const WireframeDrone: React.FC<WireframeDroneProps> = ({
  isArmed,
  flightMode,
  pidP,
  pidI,
  pidD,
  onTelemetryUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera perspective settings stored in refs to prevent React state re-render loops during 60fps animation
  const cameraRot = useRef({ pitch: 0.35, yaw: 0.45 });
  const zoom = useRef(6.5);

  // Stable callback ref for telemetry updates
  const onTelemetryUpdateRef = useRef(onTelemetryUpdate);
  useEffect(() => {
    onTelemetryUpdateRef.current = onTelemetryUpdate;
  }, [onTelemetryUpdate]);

  // Pointer & Touch gesture tracking
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const previousPointerPos = useRef<{ x: number; y: number } | null>(null);
  const previousPinchDistance = useRef<number | null>(null);
  const isInteracting = useRef(false);

  // Physics & Animation internal states
  const droneState = useRef({
    altitude: 10.0,
    speed: 5.0,
    heading: 90,
    pitch: 0,
    roll: 0,
    yaw: 0,
    motorRPMs: [0, 0, 0, 0],
    simTime: 0,
    targetAltitude: 10.0,
    targetSpeed: 5.0,
  });

  // Unified Pointer Down (Mouse & Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    isInteracting.current = true;

    if (pointers.current.size === 1) {
      previousPointerPos.current = { x: e.clientX, y: e.clientY };
    } else if (pointers.current.size === 2) {
      const pList: { x: number; y: number }[] = Array.from(pointers.current.values());
      previousPinchDistance.current = Math.hypot(pList[0].x - pList[1].x, pList[0].y - pList[1].y);
    }
  };

  // Unified Pointer Move (Single drag to orbit, multi touch pinch to zoom)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pList: { x: number; y: number }[] = Array.from(pointers.current.values());

    if (pList.length === 1 && previousPointerPos.current) {
      const deltaX = e.clientX - previousPointerPos.current.x;
      const deltaY = e.clientY - previousPointerPos.current.y;

      cameraRot.current.pitch = Math.max(
        -Math.PI / 2.2,
        Math.min(Math.PI / 2.2, cameraRot.current.pitch + deltaY * 0.006)
      );
      cameraRot.current.yaw += deltaX * 0.006;

      previousPointerPos.current = { x: e.clientX, y: e.clientY };
    } else if (pList.length === 2) {
      const currentDist = Math.hypot(pList[0].x - pList[1].x, pList[0].y - pList[1].y);
      if (previousPinchDistance.current !== null && previousPinchDistance.current > 0) {
        const deltaDist = currentDist - previousPinchDistance.current;
        zoom.current = Math.max(2.5, Math.min(16.0, zoom.current - deltaDist * 0.025));
      }
      previousPinchDistance.current = currentDist;
    }
  };

  // Unified Pointer Up or Cancel
  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
    pointers.current.delete(e.pointerId);

    if (pointers.current.size < 2) {
      previousPinchDistance.current = null;
    }
    if (pointers.current.size === 1) {
      const remaining = Array.from(pointers.current.values())[0] as { x: number; y: number };
      previousPointerPos.current = { x: remaining.x, y: remaining.y };
    } else if (pointers.current.size === 0) {
      isInteracting.current = false;
      previousPointerPos.current = null;
    }
  };

  // Attach non-passive wheel listener directly to canvas for smooth trackpad zooming
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomChange = e.deltaY * 0.003;
      zoom.current = Math.max(2.5, Math.min(16.0, zoom.current + zoomChange));
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    // Upgraded 3D Vertices for High-Fidelity Drone
    const upperDeck: Point3D[] = [
      { x: -5, y: -9, z: -2 }, // Nose
      { x: 5, y: -9, z: -2 },
      { x: 8, y: -3, z: -3 }, // Mid outer
      { x: 8, y: 3, z: -3 },
      { x: 4, y: 9, z: -1.5 }, // Tail
      { x: -4, y: 9, z: -1.5 },
      { x: -8, y: 3, z: -3 },
      { x: -8, y: -3, z: -3 },
    ];

    const lowerDeck: Point3D[] = [
      { x: -4, y: -8, z: 2 },
      { x: 4, y: -8, z: 2 },
      { x: 6, y: -3, z: 3 },
      { x: 6, y: 3, z: 3 },
      { x: 3, y: 8, z: 2.5 },
      { x: -3, y: 8, z: 2.5 },
      { x: -6, y: 3, z: 3 },
      { x: -6, y: -3, z: 3 },
    ];

    const batteryPack: Point3D[] = [
      { x: -3, y: -5, z: 3 },
      { x: 3, y: -5, z: 3 },
      { x: 3, y: 6, z: 3 },
      { x: -3, y: 6, z: 3 },
      { x: -3, y: -5, z: 7 },
      { x: 3, y: -5, z: 7 },
      { x: 3, y: 6, z: 7 },
      { x: -3, y: 6, z: 7 },
    ];

    const armEndpoints = {
      fl: { x: -25, y: -23, z: -1 },
      fr: { x: 25, y: -23, z: -1 },
      rl: { x: -25, y: 23, z: 1 },
      rr: { x: 25, y: 23, z: 1 },
    };

    const landingLegs = [
      { start: { x: -5, y: -4, z: 3 }, joint: { x: -8, y: -5, z: 11 }, foot: { x: -9, y: -6, z: 12 } },
      { start: { x: 5, y: -4, z: 3 }, joint: { x: 8, y: -5, z: 11 }, foot: { x: 9, y: -6, z: 12 } },
      { start: { x: -5, y: 4, z: 3 }, joint: { x: -8, y: 5, z: 11 }, foot: { x: -9, y: 6, z: 12 } },
      { start: { x: 5, y: 4, z: 3 }, joint: { x: 8, y: 5, z: 11 }, foot: { x: 9, y: 6, z: 12 } },
    ];

    let rotorPhase = 0;

    // Responsive Canvas Size handling with ResizeObserver
    const resizeCanvas = () => {
      if (!canvas || !canvas.parentElement) return;
      const parent = canvas.parentElement;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (rect.width > 0 && rect.height > 0) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Main Simulation & Paint Loop
    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // CRITICAL FIX: Reset 2D transform matrix every frame to prevent exponential scaling on high-DPI displays!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2 + 5;

      // Auto-scale zoom based on viewport dimensions so drone never spills off screen on mobile
      const minDimension = Math.min(w, h);
      const responsiveScale = Math.min(1.15, Math.max(0.55, minDimension / 420));
      const effectiveZoom = zoom.current * responsiveScale;

      const strokeColorAlpha = (a: number) => `rgba(147, 197, 253, ${a})`;
      const mainWireColor = (a: number) => `rgba(255, 255, 255, ${a})`;

      // Idle subtle auto-rotation when user is not interacting
      if (!isInteracting.current) {
        cameraRot.current.yaw += 0.0015;
      }

      // Update Physics telemetry simulation
      rotorPhase += 0.75;
      droneState.current.simTime += 0.016;
      const time = droneState.current.simTime;

      // Drone state oscillation
      droneState.current.targetAltitude = 12.0 + Math.sin(time * 1.5) * 3.5;
      droneState.current.targetSpeed = 8.5 + Math.cos(time * 0.8) * 2.0;

      const altitudeDiff = droneState.current.targetAltitude - droneState.current.altitude;
      droneState.current.altitude += altitudeDiff * 0.04 * pidP;

      const speedDiff = droneState.current.targetSpeed - droneState.current.speed;
      droneState.current.speed += speedDiff * 0.03 * pidP;

      const headingSin = Math.sin(time * 0.3);
      droneState.current.heading = Math.round((90 + headingSin * 25 + 360) % 360);

      const noise = (Math.sin(time * 35) * 0.06 + Math.cos(time * 50) * 0.04) / (pidD + 0.1);
      droneState.current.pitch = Math.sin(time * 2.2) * 6 + droneState.current.speed * 0.7 + noise * 8;
      droneState.current.roll = Math.cos(time * 1.8) * 5 + headingSin * 6 + noise * 8;
      droneState.current.yaw = Math.sin(time * 0.6) * 10 + noise * 4;

      const baselineRPM = 7500 + droneState.current.altitude * 60;
      droneState.current.motorRPMs = [
        Math.round(baselineRPM + Math.sin(time * 8) * 150 + droneState.current.roll * 15),
        Math.round(baselineRPM + Math.cos(time * 8) * 150 - droneState.current.roll * 15),
        Math.round(baselineRPM - Math.sin(time * 8) * 150 + droneState.current.pitch * 15),
        Math.round(baselineRPM - Math.cos(time * 8) * 150 - droneState.current.pitch * 15),
      ];

      if (Math.floor(time * 60) % 6 === 0 && onTelemetryUpdateRef.current) {
        onTelemetryUpdateRef.current({
          altitude: parseFloat(droneState.current.altitude.toFixed(2)),
          speed: parseFloat(droneState.current.speed.toFixed(2)),
          heading: droneState.current.heading,
          pitch: parseFloat(droneState.current.pitch.toFixed(1)),
          roll: parseFloat(droneState.current.roll.toFixed(1)),
          yaw: parseFloat(droneState.current.yaw.toFixed(1)),
          motorRPMs: [...droneState.current.motorRPMs],
        });
      }

      // Camera Spherical Projection
      const cosP = Math.cos(cameraRot.current.pitch);
      const sinP = Math.sin(cameraRot.current.pitch);
      const cosY = Math.cos(cameraRot.current.yaw);
      const sinY = Math.sin(cameraRot.current.yaw);

      const project = (pt: Point3D): { x: number; y: number } => {
        const dCosP = Math.cos((droneState.current.pitch * Math.PI) / 180);
        const dSinP = Math.sin((droneState.current.pitch * Math.PI) / 180);
        const dCosR = Math.cos((droneState.current.roll * Math.PI) / 180);
        const dSinR = Math.sin((droneState.current.roll * Math.PI) / 180);
        const dCosY = Math.cos((droneState.current.yaw * Math.PI) / 180);
        const dSinY = Math.sin((droneState.current.yaw * Math.PI) / 180);

        let x1 = pt.x * dCosY - pt.y * dSinY;
        let y1 = pt.x * dSinY + pt.y * dCosY;
        let z1 = pt.z;

        let x2 = x1;
        let y2 = y1 * dCosP - z1 * dSinP;
        let z2 = y1 * dSinP + z1 * dCosP;

        let x3 = x2 * dCosR + z2 * dSinR;
        let y3 = y2;
        let z3 = -x2 * dSinR + z2 * dCosR;

        z3 -= Math.min(20, droneState.current.altitude * 1.6);

        let cx = x3 * cosY - y3 * sinY;
        let cy = x3 * sinY + y3 * cosY;
        let cz = -z3;

        let finalX = cx;
        let finalY = cy * cosP - cz * sinP;
        let finalZ = cy * sinP + cz * cosP;

        const distance = 260;
        const depthScale = distance / (distance + finalZ * effectiveZoom * 0.08);

        return {
          x: centerX + finalX * effectiveZoom * depthScale,
          y: centerY + finalY * effectiveZoom * depthScale,
        };
      };

      // Draw horizontal ground radar grid circles
      ctx.strokeStyle = "rgba(147, 197, 253, 0.06)";
      ctx.lineWidth = 1;
      const groundZ = 35;
      for (let r = 30; r <= 150; r += 30) {
        ctx.beginPath();
        for (let a = 0; a <= 360; a += 15) {
          const rad = (a * Math.PI) / 180;
          const p = project({ x: Math.cos(rad) * r, y: Math.sin(rad) * r, z: groundZ });
          if (a === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Ground radar axis ticks
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      for (let angleDeg = 0; angleDeg < 180; angleDeg += 45) {
        const rad = (angleDeg * Math.PI) / 180;
        const p1 = project({ x: Math.cos(rad) * 150, y: Math.sin(rad) * 150, z: groundZ });
        const p2 = project({ x: -Math.cos(rad) * 150, y: -Math.sin(rad) * 150, z: groundZ });
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // PROJECT DRONE VERTICES
      const projUpper = upperDeck.map(project);
      const projLower = lowerDeck.map(project);
      const projBattery = batteryPack.map(project);

      // 1. Draw Fuselage Decks
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = mainWireColor(0.85);

      ctx.beginPath();
      ctx.moveTo(projUpper[0].x, projUpper[0].y);
      for (let i = 1; i < projUpper.length; i++) ctx.lineTo(projUpper[i].x, projUpper[i].y);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(projLower[0].x, projLower[0].y);
      for (let i = 1; i < projLower.length; i++) ctx.lineTo(projLower[i].x, projLower[i].y);
      ctx.closePath();
      ctx.stroke();

      ctx.strokeStyle = mainWireColor(0.3);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        ctx.moveTo(projUpper[i].x, projUpper[i].y);
        ctx.lineTo(projLower[i].x, projLower[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = strokeColorAlpha(0.6);
      ctx.beginPath();
      ctx.moveTo(projUpper[0].x, projUpper[0].y);
      ctx.lineTo(projLower[1].x, projLower[1].y);
      ctx.moveTo(projUpper[1].x, projUpper[1].y);
      ctx.lineTo(projLower[0].x, projLower[0].y);
      ctx.stroke();

      // 2. Draw Battery Pack
      ctx.strokeStyle = mainWireColor(0.4);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(projBattery[0].x, projBattery[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(projBattery[i].x, projBattery[i].y);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(projBattery[4].x, projBattery[4].y);
      for (let i = 5; i < 8; i++) ctx.lineTo(projBattery[i].x, projBattery[i].y);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.moveTo(projBattery[i].x, projBattery[i].y);
        ctx.lineTo(projBattery[i + 4].x, projBattery[i + 4].y);
      }
      ctx.stroke();

      // 3. Draw Stabilization Camera Gimbal
      const gimbalPitch = (-droneState.current.pitch * 0.7 * Math.PI) / 180;
      const gimbalRoll = (-droneState.current.roll * 0.7 * Math.PI) / 180;

      const gimbalPivot: Point3D = { x: 0, y: -6, z: 4 };
      const projPivot = project(gimbalPivot);

      const cosGP = Math.cos(gimbalPitch);
      const sinGP = Math.sin(gimbalPitch);
      const sinGR = Math.sin(gimbalRoll);

      const lensRel: Point3D = {
        x: sinGR * 5,
        y: -cosGP * 6,
        z: sinGP * 5,
      };
      const cameraLensEnd: Point3D = {
        x: gimbalPivot.x + lensRel.x,
        y: gimbalPivot.y + lensRel.y,
        z: gimbalPivot.z + lensRel.z,
      };
      const projLensEnd = project(cameraLensEnd);

      ctx.strokeStyle = strokeColorAlpha(0.8);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(project({ x: 0, y: -6, z: 2.5 }).x, project({ x: 0, y: -6, z: 2.5 }).y);
      ctx.lineTo(projPivot.x, projPivot.y);
      ctx.stroke();

      ctx.strokeStyle = strokeColorAlpha(1);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(projPivot.x, projPivot.y);
      ctx.lineTo(projLensEnd.x, projLensEnd.y);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(projLensEnd.x, projLensEnd.y, 2, 0, 2 * Math.PI);
      ctx.fill();

      // 4. Draw Truss Arms
      ctx.lineWidth = 1.8;

      const drawTrussArm = (deckAttach1: Point3D, deckAttach2: Point3D, motorHub: Point3D, isFront: boolean) => {
        const pAttach1 = project(deckAttach1);
        const pAttach2 = project(deckAttach2);
        const pHub = project(motorHub);

        ctx.strokeStyle = isFront ? strokeColorAlpha(0.85) : mainWireColor(0.5);
        ctx.beginPath();
        ctx.moveTo(pAttach1.x, pAttach1.y);
        ctx.lineTo(pHub.x, pHub.y);
        ctx.moveTo(pAttach2.x, pAttach2.y);
        ctx.lineTo(pHub.x, pHub.y);
        ctx.stroke();

        ctx.strokeStyle = mainWireColor(0.2);
        ctx.lineWidth = 0.8;
        const trussSteps = 4;
        ctx.beginPath();
        for (let i = 1; i < trussSteps; i++) {
          const t = i / trussSteps;
          const pt1 = {
            x: deckAttach1.x + (motorHub.x - deckAttach1.x) * t,
            y: deckAttach1.y + (motorHub.y - deckAttach1.y) * t,
            z: deckAttach1.z + (motorHub.z - deckAttach1.z) * t,
          };
          const pt2 = {
            x: deckAttach2.x + (motorHub.x - deckAttach2.x) * t,
            y: deckAttach2.y + (motorHub.y - deckAttach2.y) * t,
            z: deckAttach2.z + (motorHub.z - deckAttach2.z) * t,
          };
          const projPt1 = project(pt1);
          const projPt2 = project(pt2);
          ctx.moveTo(projPt1.x, projPt1.y);
          ctx.lineTo(projPt2.x, projPt2.y);
        }
        ctx.stroke();
        ctx.lineWidth = 1.8;
      };

      drawTrussArm(upperDeck[7], lowerDeck[6], armEndpoints.fl, true);
      drawTrussArm(upperDeck[2], lowerDeck[2], armEndpoints.fr, true);
      drawTrussArm(upperDeck[5], lowerDeck[5], armEndpoints.rl, false);
      drawTrussArm(upperDeck[4], lowerDeck[4], armEndpoints.rr, false);

      // 5. Draw Motors & Rotor Guards
      const drawMotorAndDuct = (hub: Point3D, isFront: boolean) => {
        const motorTop: Point3D = { x: hub.x, y: hub.y, z: hub.z - 2.5 };
        const motorBottom: Point3D = { x: hub.x, y: hub.y, z: hub.z + 2.5 };
        const projMTop = project(motorTop);
        const projMBot = project(motorBottom);

        ctx.strokeStyle = mainWireColor(0.8);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(projMTop.x, projMTop.y);
        ctx.lineTo(projMBot.x, projMBot.y);
        ctx.stroke();

        const ductRadius = 13.5;
        ctx.strokeStyle = isFront ? strokeColorAlpha(0.4) : mainWireColor(0.2);
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        for (let a = 0; a <= 360; a += 15) {
          const rad = (a * Math.PI) / 180;
          const p = project({
            x: hub.x + Math.cos(rad) * ductRadius,
            y: hub.y + Math.sin(rad) * ductRadius,
            z: hub.z - 1.0,
          });
          if (a === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = mainWireColor(0.15);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let sa = 0; sa < 360; sa += 120) {
          const rad = (sa * Math.PI) / 180;
          const outerP = project({
            x: hub.x + Math.cos(rad) * ductRadius,
            y: hub.y + Math.sin(rad) * ductRadius,
            z: hub.z - 1.0,
          });
          ctx.moveTo(projMTop.x, projMTop.y);
          ctx.lineTo(outerP.x, outerP.y);
        }
        ctx.stroke();
      };

      drawMotorAndDuct(armEndpoints.fl, true);
      drawMotorAndDuct(armEndpoints.fr, true);
      drawMotorAndDuct(armEndpoints.rl, false);
      drawMotorAndDuct(armEndpoints.rr, false);

      // 6. Draw Spinning Propeller Blades
      const drawHighFidelityRotor = (hub: Point3D, color: string, index: number) => {
        const propHeight = hub.z - 3.2;
        const propCenter: Point3D = { x: hub.x, y: hub.y, z: propHeight };
        const projCenter = project(propCenter);

        const propRadius = 10.5;
        const rad1 = rotorPhase + (index * Math.PI) / 2;
        const rad2 = rad1 + Math.PI;

        const tip1: Point3D = {
          x: hub.x + Math.cos(rad1) * propRadius,
          y: hub.y + Math.sin(rad1) * propRadius,
          z: propHeight - 0.5,
        };
        const tip2: Point3D = {
          x: hub.x + Math.cos(rad2) * propRadius,
          y: hub.y + Math.sin(rad2) * propRadius,
          z: propHeight - 0.5,
        };

        const projTip1 = project(tip1);
        const projTip2 = project(tip2);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        const diskRadiusProj = Math.abs(project({ ...propCenter, x: propCenter.x + propRadius }).x - projCenter.x);
        ctx.ellipse(projCenter.x, projCenter.y, Math.max(1, diskRadiusProj), Math.max(1, diskRadiusProj * 0.4), 0, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.strokeStyle = color;
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1.8;

        const bladeOffsetAngle = 0.18;
        const trailingEdge1: Point3D = {
          x: hub.x + Math.cos(rad1 - bladeOffsetAngle) * (propRadius * 0.75),
          y: hub.y + Math.sin(rad1 - bladeOffsetAngle) * (propRadius * 0.75),
          z: propHeight + 0.3,
        };
        const projT1 = project(trailingEdge1);

        ctx.beginPath();
        ctx.moveTo(projCenter.x, projCenter.y);
        ctx.lineTo(projTip1.x, projTip1.y);
        ctx.lineTo(projT1.x, projT1.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const trailingEdge2: Point3D = {
          x: hub.x + Math.cos(rad2 - bladeOffsetAngle) * (propRadius * 0.75),
          y: hub.y + Math.sin(rad2 - bladeOffsetAngle) * (propRadius * 0.75),
          z: propHeight + 0.3,
        };
        const projT2 = project(trailingEdge2);

        ctx.beginPath();
        ctx.moveTo(projCenter.x, projCenter.y);
        ctx.lineTo(projTip2.x, projTip2.y);
        ctx.lineTo(projT2.x, projT2.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.arc(projCenter.x, projCenter.y, 2.2, 0, 2 * Math.PI);
        ctx.fill();
      };

      drawHighFidelityRotor(armEndpoints.fl, strokeColorAlpha(0.95), 0);
      drawHighFidelityRotor(armEndpoints.fr, strokeColorAlpha(0.95), 1);
      drawHighFidelityRotor(armEndpoints.rl, mainWireColor(0.75), 2);
      drawHighFidelityRotor(armEndpoints.rr, mainWireColor(0.75), 3);

      // 7. Draw Landing Stilts
      ctx.lineWidth = 1.5;
      landingLegs.forEach((leg) => {
        const pStart = project(leg.start);
        const pJoint = project(leg.joint);
        const pFoot = project(leg.foot);

        ctx.strokeStyle = mainWireColor(0.5);
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pJoint.x, pJoint.y);
        ctx.stroke();

        ctx.strokeStyle = strokeColorAlpha(0.7);
        ctx.beginPath();
        ctx.moveTo(pJoint.x, pJoint.y);
        ctx.lineTo(pFoot.x, pFoot.y);
        ctx.stroke();

        ctx.strokeStyle = mainWireColor(0.6);
        ctx.beginPath();
        const fp1 = project({ x: leg.foot.x - 1.5, y: leg.foot.y, z: leg.foot.z });
        const fp2 = project({ x: leg.foot.x + 1.5, y: leg.foot.y, z: leg.foot.z });
        ctx.moveTo(fp1.x, fp1.y);
        ctx.lineTo(fp2.x, fp2.y);
        ctx.stroke();
      });

      // Directional Nose Arrow vector indicator
      const pCenter = project({ x: 0, y: 0, z: 0 });
      const pHeading = project({ x: 0, y: -45, z: 0 });
      ctx.strokeStyle = "rgba(147, 197, 253, 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pCenter.x, pCenter.y);
      ctx.lineTo(pHeading.x, pHeading.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Static crosshairs in center
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY);
      ctx.lineTo(centerX + 10, centerY);
      ctx.moveTo(centerX, centerY - 10);
      ctx.lineTo(centerX, centerY + 10);
      ctx.stroke();

      // Responsive UI Text overlay telemetry stats
      const fontSize = Math.max(8, Math.min(10, Math.floor(w / 42)));
      ctx.font = `${fontSize}px monospace`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      const pad = 12;
      const bY = h - 12;

      ctx.textAlign = "left";
      ctx.fillText(`PITCH: ${droneState.current.pitch.toFixed(1)}°`, pad, bY - fontSize * 2 - 4);
      ctx.fillText(`ROLL: ${droneState.current.roll.toFixed(1)}°`, pad, bY - fontSize - 2);
      ctx.fillText(`YAW: ${droneState.current.yaw.toFixed(1)}°`, pad, bY);

      ctx.textAlign = "right";
      ctx.fillText(`HEADING: ${droneState.current.heading}°`, w - pad, bY - fontSize - 2);
      ctx.fillText(`ALTITUDE: ${droneState.current.altitude.toFixed(1)}M`, w - pad, bY);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isArmed, flightMode, pidP, pidI, pidD]);

  return (
    <div className="relative w-full h-full bg-stone-950/90 flex flex-col justify-between overflow-hidden touch-none select-none">
      {/* Simulation Watermark / Header */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10 select-none font-mono">
        <span className="inline-block w-2 h-2 rounded-none bg-sky-400 animate-pulse"></span>
        <span className="text-[9px] text-stone-200 tracking-wider font-bold font-mono">REAL-TIME 3D ROTATOR</span>
      </div>

      <div className="absolute top-3 right-3 font-mono text-[8px] text-stone-500 z-10 select-none tracking-wider">
        CHRONO-MESH_2.0
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none block"
      />

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[8px] text-stone-500 pointer-events-none text-center select-none uppercase tracking-[0.15em] whitespace-nowrap bg-stone-950/60 px-2 py-0.5 rounded">
        DRAG / PINCH TO ROTATE & ZOOM
      </div>
    </div>
  );
};
