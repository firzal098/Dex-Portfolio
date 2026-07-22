import React, { useState, useEffect, useRef } from "react";

interface ContactMessage {
  id: string;
  timestamp: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface MavlinkTerminalProps {
  isArmed: boolean;
  flightMode: string;
  telemetry: {
    altitude: number;
    speed: number;
    heading: number;
    pitch: number;
    roll: number;
    yaw: number;
  };
}

export const MavlinkTerminal: React.FC<MavlinkTerminalProps> = ({
  isArmed,
  flightMode,
  telemetry,
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize with some boot sequence
  useEffect(() => {
    const initialLogs = [
      `[SYSTEM] BOOT SEQUENCE INITIATED...`,
      `[SYSTEM] PLATFORM TARGET: ROS JAZZY ON KHADAS VIM4`,
      `[DOCKER] CONE_ID: d03b29ac8 - MOUNTING VOLUMES [OK]`,
      `[FIRMWARE] LOADING ARDUPILOT APM::COOP_STABLE_v4.5.2`,
      `[HARDWARE] GYRO_LSM6DSOX CALIBRATED - BIAS: [0.002, -0.001, 0.004]`,
      `[MAVLINK] LISTENING ON PORT: udp:12.24.12.114:14555`,
      `[RL_ENGINE] GYMNASIUM WRAPPER READY - MODEL: SB3_PPO_DRONE_HOVER_v2`,
      `[YOLO] COGNITIVE NEURAL NETWORK LOADED. BASE: YOLOv11n-pose.onnx`,
      `[YOLO] TENSORRT CONTEXT GENERATED SUCCESSFULLY. INFERENCE TIME: ~4.6ms`,
      `[SYSTEM] ALL MATRICES GREEN. STANDING BY FOR PILOT UPLINK ARM SIGNAL...`,
    ];
    setLogs(initialLogs);
  }, []);

  // Fetch actual contact form submissions to feed as live terminal data
  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data: ContactMessage[] = await res.json();
        setContactMessages(data);
      }
    } catch (err) {
      // Fail silently, fall back
    }
  };

  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 4000);
    return () => clearInterval(interval);
  }, []);

  // Generate live sensor logs matching armed telemetry state
  useEffect(() => {
    const logTimer = setInterval(() => {
      if (!isArmed) {
        if (Math.random() > 0.7) {
          const passiveMsgs = [
            `[MAVLINK] HEARTBEAT [DISARMED] - SAT_COUNT: 18 - RSSI: -48dBm`,
            `[IMU] GYRO DRIFT COMPENSATION RE-CALIBRATING...`,
            `[ROS] /tf tree validated. Nodes active: [/imu_node, /yolo_perception]`,
            `[DOCKER] Container health: 100% - RAM: 1.2GB/4.0GB`,
          ];
          setLogs((prev) => [...prev, passiveMsgs[Math.floor(Math.random() * passiveMsgs.length)]].slice(-100));
        }
        return;
      }

      const simLogs = [
        `[MAVLINK] TELEMETRY UPLINK - ALT: ${telemetry.altitude}m - SPEED: ${telemetry.speed}m/s - MODE: ${flightMode}`,
        `[IMU] ATTITUDE STATE: [P: ${telemetry.pitch}°, R: ${telemetry.roll}°, Y: ${telemetry.yaw}°]`,
        `[YOLO] Bounding box update: Gate detected. Heading correlation calculated.`,
        `[RL_PPO] Policy inference executed. Control action: [T: ${(0.6 + telemetry.altitude * 0.02).toFixed(3)}, P: ${(telemetry.pitch * -0.01).toFixed(3)}]`,
        `[MAVLINK] STATUSTEXT: "SATELLITE HANDSHAKE MATCHED [STABLE] [RSSI: -42dBm]"`,
      ];

      // Add one of the simulated logs at random interval
      if (Math.random() > 0.4) {
        setLogs((prev) => [...prev, simLogs[Math.floor(Math.random() * simLogs.length)]].slice(-100));
      }
    }, 1500);

    return () => clearInterval(logTimer);
  }, [isArmed, flightMode, telemetry]);

  // Push received contact messages into the log stream when they are updated!
  const processedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    contactMessages.forEach((msg) => {
      if (!processedMessageIds.current.has(msg.id)) {
        processedMessageIds.current.add(msg.id);
        const contactLog = `[MAVLINK SATELLITE UPLINK RECEIVED] [Callsign: ${msg.name.toUpperCase()}] <${msg.email}> -> SUBJECT: "${msg.subject.toUpperCase()}" | PAYLOAD: "${msg.message}"`;
        setLogs((prev) => [...prev, `[SATELLITE] --- INCOMING TRANSMISSION INTRUSION ---`, contactLog, `[SATELLITE] --- TRANSMISSION STORED TO DATABASE LEDGER ---`].slice(-100));
      }
    });
  }, [contactMessages]);

  // Scroll to bottom of terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Command input handler
  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const cmd = inputText.trim().toLowerCase();
    const cmdLogs = [`$ ${inputText}`];

    if (cmd === "help") {
      cmdLogs.push(
        "Available terminal triggers:",
        "  help         - Display system operational instructions",
        "  clear        - Clear console history buffer",
        "  reboot       - Perform hot-start firmware reboot on Khadas node",
        "  arm          - Trigger motor ignition",
        "  disarm       - Emergency throttle cutoff",
        "  telemetry    - Log static snapshot of current attitude matrices",
        "  transmissions- Fetch current contact form database log"
      );
    } else if (cmd === "clear") {
      setLogs([]);
      setInputText("");
      return;
    } else if (cmd === "reboot") {
      cmdLogs.push(
        "[SYSTEM] HARD REBOOT SEQUENCE STARTED...",
        "[SYSTEM] UNMOUNTING FILE SYSTEMS...",
        "[DOCKER] STOPPING STACKS...",
        "[FIRMWARE] SHUTTING DOWN ARDUPILOT...",
        "[SYSTEM] WARM RESTART COMPLETED. ALL STACKS ONLINE."
      );
    } else if (cmd === "arm") {
      cmdLogs.push("[MAVLINK] COMMAND_LONG [ARM] RECEIVED. BOOTING CORE MOTORS.");
    } else if (cmd === "disarm") {
      cmdLogs.push("[MAVLINK] COMMAND_LONG [DISARM] RECEIVED. INITIATING CUTOFF.");
    } else if (cmd === "transmissions") {
      cmdLogs.push(`--- INBOX DATABASE DUMP (${contactMessages.length} ENTRIES) ---`);
      if (contactMessages.length === 0) {
        cmdLogs.push("No transmissions recorded in local database file.");
      } else {
        contactMessages.forEach((msg, idx) => {
          cmdLogs.push(`  [${idx + 1}] CALLSIGN: ${msg.name} | MSG: "${msg.message.substring(0, 50)}..."`);
        });
      }
    } else if (cmd === "telemetry") {
      cmdLogs.push(
        `--- TELEMETRY ATTITUDE MATRIX ---`,
        `  ALT: ${telemetry.altitude} m`,
        `  SPD: ${telemetry.speed} m/s`,
        `  HDG: ${telemetry.heading}°`,
        `  P: ${telemetry.pitch}° | R: ${telemetry.roll}° | Y: ${telemetry.yaw}°`
      );
    } else {
      cmdLogs.push(`bash: command not found: ${inputText}. Type 'help' for instructions.`);
    }

    setLogs((prev) => [...prev, ...cmdLogs].slice(-100));
    setInputText("");
  };

  return (
    <div className="flex flex-col h-full bg-stone-950 font-mono text-[11px] text-green-400 border border-stone-800">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-900 border-b border-stone-800 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[10px] text-green-500 font-bold tracking-wider uppercase">MAVLINK TELEMETRY CONSOLE</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setLogs([])}
            className="text-[9px] text-stone-500 hover:text-green-400 transition"
            title="Clear Terminal Output"
          >
            [CLEAR]
          </button>
          <button
            onClick={fetchContacts}
            className="text-[9px] text-stone-500 hover:text-green-400 transition"
            title="Pull Messages"
          >
            [PULL_COMMS]
          </button>
        </div>
      </div>

      {/* Logs Scrollbox */}
      <div className="flex-1 p-3 overflow-y-auto leading-relaxed select-text scrollbar-thin scrollbar-thumb-stone-800">
        <div className="space-y-0.5">
          {logs.map((log, index) => {
            let textColor = "text-green-400";
            if (log.startsWith("[SYSTEM]") || log.startsWith("$")) {
              textColor = "text-stone-300";
            } else if (log.startsWith("[YOLO]")) {
              textColor = "text-blue-400";
            } else if (log.startsWith("[RL_PPO]")) {
              textColor = "text-indigo-400";
            } else if (log.startsWith("[SATELLITE]")) {
              textColor = "text-amber-500 font-bold";
            } else if (log.includes("UPLINK RECEIVED")) {
              textColor = "text-amber-400";
            } else if (log.startsWith("[FIRMWARE]") || log.startsWith("[HARDWARE]")) {
              textColor = "text-stone-400";
            }
            return (
              <div key={index} className={`${textColor} break-all tracking-wide whitespace-pre-wrap`}>
                {log}
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Input Command Line */}
      <form onSubmit={handleSendCommand} className="flex items-center px-3 py-1 bg-stone-900 border-t border-stone-800">
        <span className="text-stone-400 select-none mr-2 font-bold">$</span>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type 'help' or execute commands..."
          className="flex-1 bg-transparent text-green-400 focus:outline-none placeholder-stone-600 border-none p-1 font-mono text-[11px]"
        />
      </form>
    </div>
  );
};
