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
  
  // Camera perspective settings
  const [cameraRot, setCameraRot] = useState({ pitch: 0.4, yaw: 0.5 });
  const [zoom, setZoom] = useState(7.0);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

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

  // Handle Drag & Orbit
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    setCameraRot((prev) => ({
      pitch: Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, prev.pitch + deltaY * 0.007)),
      yaw: prev.yaw + deltaX * 0.007,
    }));

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  // Zoom control
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.max(3.0, Math.min(15.0, prev + e.deltaY * 0.005)));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    // Upgraded 3D Vertices for a High-Fidelity Drone
    // Dual-deck chassis plates
    const upperDeck: Point3D[] = [
      { x: -5, y: -9, z: -2 }, // Nose
      { x: 5, y: -9, z: -2 },
      { x: 8, y: -3, z: -3 },  // Mid outer
      { x: 8, y: 3, z: -3 },
      { x: 4, y: 9, z: -1.5 },  // Tail
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

    // Under-body Battery pack
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

    // Motor Hub centers (X-Configuration, wide layout)
    const armEndpoints = {
      fl: { x: -25, y: -23, z: -1 }, // Front Left
      fr: { x: 25, y: -23, z: -1 },  // Front Right
      rl: { x: -25, y: 23, z: 1 },   // Rear Left
      rr: { x: 25, y: 23, z: 1 },    // Rear Right
    };

    // Four landing stilts connecting to under-chassis
    const landingLegs = [
      { start: { x: -5, y: -4, z: 3 }, joint: { x: -8, y: -5, z: 11 }, foot: { x: -9, y: -6, z: 12 } }, // FL
      { start: { x: 5, y: -4, z: 3 }, joint: { x: 8, y: -5, z: 11 }, foot: { x: 9, y: -6, z: 12 } },  // FR
      { start: { x: -5, y: 4, z: 3 }, joint: { x: -8, y: 5, z: 11 }, foot: { x: -9, y: 6, z: 12 } },  // RL
      { start: { x: 5, y: 4, z: 3 }, joint: { x: 8, y: 5, z: 11 }, foot: { x: 9, y: 6, z: 12 } },   // RR
    ];

    // Rotor spinner phase (in radians)
    let rotorPhase = 0;

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

    // Main Simulation and Paint Loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scaleFactor = window.devicePixelRatio;
      ctx.scale(scaleFactor, scaleFactor);

      const w = canvas.width / scaleFactor;
      const h = canvas.height / scaleFactor;
      const centerX = w / 2;
      const centerY = h / 2 + 10;

      // Dynamic theme checks for high contrast
      const isDarkMode = document.documentElement.classList.contains("dark") || true; 
      const strokeColorAlpha = (a: number) => `rgba(147, 197, 253, ${a})`; // Cool light blue signature accent
      const mainWireColor = (a: number) => `rgba(255, 255, 255, ${a})`;
      
      // Update Physics telemetry simulation based on Armed state
      rotorPhase += 0.75;
      droneState.current.simTime += 0.016;
      const time = droneState.current.simTime;

      if (true) {
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
        droneState.current.pitch = Math.sin(time * 2.2) * 6 + (droneState.current.speed * 0.7) + noise * 8;
        droneState.current.roll = Math.cos(time * 1.8) * 5 + (headingSin * 6) + noise * 8;
        droneState.current.yaw = Math.sin(time * 0.6) * 10 + noise * 4;

        const baselineRPM = 7500 + droneState.current.altitude * 60;
        droneState.current.motorRPMs = [
          Math.round(baselineRPM + Math.sin(time * 8) * 150 + (droneState.current.roll * 15)),
          Math.round(baselineRPM + Math.cos(time * 8) * 150 - (droneState.current.roll * 15)),
          Math.round(baselineRPM - Math.sin(time * 8) * 150 + (droneState.current.pitch * 15)),
          Math.round(baselineRPM - Math.cos(time * 8) * 150 - (droneState.current.pitch * 15)),
        ];
      } else {
        droneState.current.altitude = Math.max(0, droneState.current.altitude - 0.4);
        droneState.current.speed = Math.max(0, droneState.current.speed - 0.15);
        droneState.current.pitch *= 0.82;
        droneState.current.roll *= 0.82;
        droneState.current.yaw *= 0.82;
        droneState.current.motorRPMs = [0, 0, 0, 0];
      }

      if (Math.floor(time * 60) % 6 === 0) {
        onTelemetryUpdate({
          altitude: parseFloat(droneState.current.altitude.toFixed(2)),
          speed: parseFloat(droneState.current.speed.toFixed(2)),
          heading: droneState.current.heading,
          pitch: parseFloat(droneState.current.pitch.toFixed(1)),
          roll: parseFloat(droneState.current.roll.toFixed(1)),
          yaw: parseFloat(droneState.current.yaw.toFixed(1)),
          motorRPMs: [...droneState.current.motorRPMs],
        });
      }

      // Setup Rotation Matrix around Camera's View Axis (Spherical Pitch/Yaw)
      const cosP = Math.cos(cameraRot.pitch);
      const sinP = Math.sin(cameraRot.pitch);
      const cosY = Math.cos(cameraRot.yaw);
      const sinY = Math.sin(cameraRot.yaw);

      // Project 3D coordinate to 2D Screen Canvas
      const project = (pt: Point3D): { x: number; y: number } => {
        // Drone self-rotation matrices
        const dCosP = Math.cos(droneState.current.pitch * Math.PI / 180);
        const dSinP = Math.sin(droneState.current.pitch * Math.PI / 180);
        const dCosR = Math.cos(droneState.current.roll * Math.PI / 180);
        const dSinR = Math.sin(droneState.current.roll * Math.PI / 180);
        const dCosY = Math.cos(droneState.current.yaw * Math.PI / 180);
        const dSinY = Math.sin(droneState.current.yaw * Math.PI / 180);

        // Yaw -> Pitch -> Roll
        let x1 = pt.x * dCosY - pt.y * dSinY;
        let y1 = pt.x * dSinY + pt.y * dCosY;
        let z1 = pt.z;

        let x2 = x1;
        let y2 = y1 * dCosP - z1 * dSinP;
        let z2 = y1 * dSinP + z1 * dCosP;

        let x3 = x2 * dCosR + z2 * dSinR;
        let y3 = y2;
        let z3 = -x2 * dSinR + z2 * dCosR;

        // Hover offset translation
        z3 -= Math.min(20, droneState.current.altitude * 1.6);

        // Camera orbit translation
        let cx = x3 * cosY - y3 * sinY;
        let cy = x3 * sinY + y3 * cosY;
        let cz = -z3; // Correct 3D orientation so the drone is right side up

        let finalX = cx;
        let finalY = cy * cosP - cz * sinP;
        let finalZ = cy * sinP + cz * cosP;

        const distance = 260;
        const depthScale = distance / (distance + finalZ * zoom * 0.08);
        
        return {
          x: centerX + finalX * zoom * depthScale,
          y: centerY + finalY * zoom * depthScale,
        };
      };

      // Draw elegant concentric horizontal radar circles below drone on the "ground"
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

      // Upper canopy ring
      ctx.beginPath();
      ctx.moveTo(projUpper[0].x, projUpper[0].y);
      for (let i = 1; i < projUpper.length; i++) ctx.lineTo(projUpper[i].x, projUpper[i].y);
      ctx.closePath();
      ctx.stroke();

      // Lower frame loop
      ctx.beginPath();
      ctx.moveTo(projLower[0].x, projLower[0].y);
      for (let i = 1; i < projLower.length; i++) ctx.lineTo(projLower[i].x, projLower[i].y);
      ctx.closePath();
      ctx.stroke();

      // Vertical structural ribs connecting upper and lower decks
      ctx.strokeStyle = mainWireColor(0.3);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        ctx.moveTo(projUpper[i].x, projUpper[i].y);
        ctx.lineTo(projLower[i].x, projLower[i].y);
      }
      ctx.stroke();

      // Sleek diagonal structural cross on nose
      ctx.strokeStyle = strokeColorAlpha(0.6);
      ctx.beginPath();
      ctx.moveTo(projUpper[0].x, projUpper[0].y);
      ctx.lineTo(projLower[1].x, projLower[1].y);
      ctx.moveTo(projUpper[1].x, projUpper[1].y);
      ctx.lineTo(projLower[0].x, projLower[0].y);
      ctx.stroke();

      // 2. Draw Battery Prismatic Box
      ctx.strokeStyle = mainWireColor(0.4);
      ctx.lineWidth = 1;
      // Bottom loop
      ctx.beginPath();
      ctx.moveTo(projBattery[0].x, projBattery[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(projBattery[i].x, projBattery[i].y);
      ctx.closePath();
      ctx.stroke();
      // Top loop
      ctx.beginPath();
      ctx.moveTo(projBattery[4].x, projBattery[4].y);
      for (let i = 5; i < 8; i++) ctx.lineTo(projBattery[i].x, projBattery[i].y);
      ctx.closePath();
      ctx.stroke();
      // Pillars
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.moveTo(projBattery[i].x, projBattery[i].y);
        ctx.lineTo(projBattery[i+4].x, projBattery[i+4].y);
      }
      ctx.stroke();

      // 3. Draw Dynamic Stabilization Camera Gimbal under nose
      // Center gimbal pivot: { x: 0, y: -6, z: 4 }
      // Actively stabilized gimbal angle (opposing pitch and roll)
      const gimbalPitch = -droneState.current.pitch * 0.7 * Math.PI / 180;
      const gimbalRoll = -droneState.current.roll * 0.7 * Math.PI / 180;

      const gimbalPivot: Point3D = { x: 0, y: -6, z: 4 };
      const projPivot = project(gimbalPivot);

      // Draw camera pod housing as a 3D sphere-like cage
      ctx.strokeStyle = strokeColorAlpha(0.8);
      ctx.lineWidth = 1.2;
      const podRadius = 3.5;
      
      // Draw camera lens cylinder extending forward relative to active gimbal tilt
      const cosGP = Math.cos(gimbalPitch);
      const sinGP = Math.sin(gimbalPitch);
      const cosGR = Math.cos(gimbalRoll);
      const sinGR = Math.sin(gimbalRoll);

      // Camera lens tip relative to gimbal pivot
      const lensRel: Point3D = {
        x: sinGR * 5,
        y: -cosGP * 6,
        z: sinGP * 5
      };
      const cameraLensEnd: Point3D = {
        x: gimbalPivot.x + lensRel.x,
        y: gimbalPivot.y + lensRel.y,
        z: gimbalPivot.z + lensRel.z
      };
      const projLensEnd = project(cameraLensEnd);

      // Draw Gimbal neck strut
      ctx.beginPath();
      ctx.moveTo(project({ x: 0, y: -6, z: 2.5 }).x, project({ x: 0, y: -6, z: 2.5 }).y);
      ctx.lineTo(projPivot.x, projPivot.y);
      ctx.stroke();

      // Draw Camera Lens Tube
      ctx.strokeStyle = strokeColorAlpha(1);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(projPivot.x, projPivot.y);
      ctx.lineTo(projLensEnd.x, projLensEnd.y);
      ctx.stroke();

      // Small high-gloss camera glass aperture ring at the tip
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(projLensEnd.x, projLensEnd.y, 2, 0, 2 * Math.PI);
      ctx.fill();

      // 4. Draw Double-Tube Truss Arms (Wide Cinematic Cinewhoop Style)
      ctx.lineWidth = 1.8;
      
      const drawTrussArm = (deckAttach1: Point3D, deckAttach2: Point3D, motorHub: Point3D, isFront: boolean) => {
        const pAttach1 = project(deckAttach1);
        const pAttach2 = project(deckAttach2);
        const pHub = project(motorHub);

        // Two primary arm support tubes
        ctx.strokeStyle = isFront ? strokeColorAlpha(0.85) : mainWireColor(0.5);
        ctx.beginPath();
        ctx.moveTo(pAttach1.x, pAttach1.y);
        ctx.lineTo(pHub.x, pHub.y);
        ctx.moveTo(pAttach2.x, pAttach2.y);
        ctx.lineTo(pHub.x, pHub.y);
        ctx.stroke();

        // Structural lattice trusses between the two tubes
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
        ctx.lineWidth = 1.8; // restore
      };

      // Front Left Arm
      drawTrussArm(upperDeck[7], lowerDeck[6], armEndpoints.fl, true);
      // Front Right Arm
      drawTrussArm(upperDeck[2], lowerDeck[2], armEndpoints.fr, true);
      // Rear Left Arm
      drawTrussArm(upperDeck[5], lowerDeck[5], armEndpoints.rl, false);
      // Rear Right Arm
      drawTrussArm(upperDeck[4], lowerDeck[4], armEndpoints.rr, false);

      // 5. Draw 3D Cylindrical Motor Housings and ducted Rotor Guard Rings
      const drawMotorAndDuct = (hub: Point3D, isFront: boolean) => {
        const projHub = project(hub);

        // Cylindrical motor body canister
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

        // Draw Propeller Duct Guard Ring surrounding the motor
        // Large outer carbon circle
        const ductRadius = 13.5;
        ctx.strokeStyle = isFront ? strokeColorAlpha(0.4) : mainWireColor(0.2);
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        for (let a = 0; a <= 360; a += 15) {
          const rad = (a * Math.PI) / 180;
          const p = project({
            x: hub.x + Math.cos(rad) * ductRadius,
            y: hub.y + Math.sin(rad) * ductRadius,
            z: hub.z - 1.0
          });
          if (a === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();

        // Duct spokes holding it to the motor hub (3 spokes spaced 120deg)
        ctx.strokeStyle = mainWireColor(0.15);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let sa = 0; sa < 360; sa += 120) {
          const rad = (sa * Math.PI) / 180;
          const outerP = project({
            x: hub.x + Math.cos(rad) * ductRadius,
            y: hub.y + Math.sin(rad) * ductRadius,
            z: hub.z - 1.0
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

      // 6. Draw High-Fidelity Detailed Spinning Propeller Blades
      const drawHighFidelityRotor = (hub: Point3D, color: string, index: number) => {
        const propHeight = hub.z - 3.2; // sitting slightly above motor
        const propCenter: Point3D = { x: hub.x, y: hub.y, z: propHeight };
        const projCenter = project(propCenter);

        const propRadius = 10.5;
        // Swept propeller blade 1 tip and trailing edges
        const rad1 = rotorPhase + (index * Math.PI / 2);
        const rad2 = rad1 + Math.PI;

        const tip1: Point3D = {
          x: hub.x + Math.cos(rad1) * propRadius,
          y: hub.y + Math.sin(rad1) * propRadius,
          z: propHeight - 0.5, // dynamic aerodynamic dihedral chord
        };
        const tip2: Point3D = {
          x: hub.x + Math.cos(rad2) * propRadius,
          y: hub.y + Math.sin(rad2) * propRadius,
          z: propHeight - 0.5,
        };

        const projTip1 = project(tip1);
        const projTip2 = project(tip2);

        // Translucent rotor disc spinning motion blur sweep
        ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        const diskRadiusProj = Math.abs(project({ ...propCenter, x: propCenter.x + propRadius }).x - projCenter.x);
        ctx.ellipse(projCenter.x, projCenter.y, diskRadiusProj, diskRadiusProj * 0.4, 0, 0, 2 * Math.PI);
        ctx.stroke();

        // 3D physical wing blades (triangular outline chord to look like carbon fiber blades)
        ctx.strokeStyle = color;
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1.8;

        // Blade 1 loop
        const bladeOffsetAngle = 0.18; // chord thickness width
        const trailingEdge1: Point3D = {
          x: hub.x + Math.cos(rad1 - bladeOffsetAngle) * (propRadius * 0.75),
          y: hub.y + Math.sin(rad1 - bladeOffsetAngle) * (propRadius * 0.75),
          z: propHeight + 0.3
        };
        const projT1 = project(trailingEdge1);

        ctx.beginPath();
        ctx.moveTo(projCenter.x, projCenter.y);
        ctx.lineTo(projTip1.x, projTip1.y);
        ctx.lineTo(projT1.x, projT1.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Blade 2 loop
        const trailingEdge2: Point3D = {
          x: hub.x + Math.cos(rad2 - bladeOffsetAngle) * (propRadius * 0.75),
          y: hub.y + Math.sin(rad2 - bladeOffsetAngle) * (propRadius * 0.75),
          z: propHeight + 0.3
        };
        const projT2 = project(trailingEdge2);

        ctx.beginPath();
        ctx.moveTo(projCenter.x, projCenter.y);
        ctx.lineTo(projTip2.x, projTip2.y);
        ctx.lineTo(projT2.x, projT2.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Core central spinner spinner dome cap
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.arc(projCenter.x, projCenter.y, 2.2, 0, 2 * Math.PI);
        ctx.fill();
      };

      drawHighFidelityRotor(armEndpoints.fl, strokeColorAlpha(0.95), 0);
      drawHighFidelityRotor(armEndpoints.fr, strokeColorAlpha(0.95), 1);
      drawHighFidelityRotor(armEndpoints.rl, mainWireColor(0.75), 2);
      drawHighFidelityRotor(armEndpoints.rr, mainWireColor(0.75), 3);

      // 7. Draw Carbon Landing Stilts and Feet Pads
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = mainWireColor(0.4);
      landingLegs.forEach((leg) => {
        const pStart = project(leg.start);
        const pJoint = project(leg.joint);
        const pFoot = project(leg.foot);

        // draw hip connection segment
        ctx.strokeStyle = mainWireColor(0.5);
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pJoint.x, pJoint.y);
        ctx.stroke();

        // draw shock absorber stilt to foot
        ctx.strokeStyle = strokeColorAlpha(0.7);
        ctx.beginPath();
        ctx.moveTo(pJoint.x, pJoint.y);
        ctx.lineTo(pFoot.x, pFoot.y);
        ctx.stroke();

        // Draw small horizontal circular foot pad
        ctx.strokeStyle = mainWireColor(0.6);
        ctx.beginPath();
        const fp1 = project({ x: leg.foot.x - 1.5, y: leg.foot.y, z: leg.foot.z });
        const fp2 = project({ x: leg.foot.x + 1.5, y: leg.foot.y, z: leg.foot.z });
        ctx.moveTo(fp1.x, fp1.y);
        ctx.lineTo(fp2.x, fp2.y);
        ctx.stroke();
      });

      // Directional Nose Arrow vector indicator (flickering cool light blue path)
      const pCenter = project({ x: 0, y: 0, z: 0 });
      const pHeading = project({ x: 0, y: -45, z: 0 });
      ctx.strokeStyle = "rgba(147, 197, 253, 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pCenter.x, pCenter.y);
      ctx.lineTo(pHeading.x, pHeading.y);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Static crosshairs in dead center
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY);
      ctx.lineTo(centerX + 10, centerY);
      ctx.moveTo(centerX, centerY - 10);
      ctx.lineTo(centerX, centerY + 10);
      ctx.stroke();

      // UI Text overlay stats
      ctx.font = "8px monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.textAlign = "left";
      ctx.fillText(`PITCH: ${droneState.current.pitch.toFixed(1)}°`, 16, h - 45);
      ctx.fillText(`ROLL: ${droneState.current.roll.toFixed(1)}°`, 16, h - 33);
      ctx.fillText(`YAW: ${droneState.current.yaw.toFixed(1)}°`, 16, h - 21);

      ctx.textAlign = "right";
      ctx.fillText(`HEADING: ${droneState.current.heading}°`, w - 16, h - 33);
      ctx.fillText(`HEIGHT: ${droneState.current.altitude.toFixed(1)}M`, w - 16, h - 21);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [isArmed, flightMode, cameraRot, zoom, pidP, pidI, pidD]);

  return (
    <div className="relative w-full h-full bg-stone-950/80 flex flex-col justify-between overflow-hidden">
      {/* Simulation Watermark / Borders */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10 select-none font-mono">
        <span className="inline-block w-2.5 h-2.5 rounded-none bg-stone-100 animate-pulse"></span>
        <span className="text-[10px] text-stone-100 tracking-widest font-bold font-mono">REAL-TIME FLIGHT ROTATOR</span>
      </div>

      <div className="absolute top-4 right-4 font-mono text-[9px] text-stone-500 z-10 select-none tracking-wider">
        CORE-MATRIX_PROJ_2.0
      </div>

      <canvas
         ref={canvasRef}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUpOrLeave}
         onMouseLeave={handleMouseUpOrLeave}
         onWheel={handleWheel}
         className="w-full h-full cursor-grab active:cursor-grabbing touch-none block"
      />

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[9px] text-stone-600 pointer-events-none text-center select-none uppercase tracking-[0.2em]">
        DRAG MOUSE OR SWIPE TO ROTATE VIEW
      </div>
    </div>
  );
};
