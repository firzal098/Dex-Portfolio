import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Play,
  Square,
  Sliders,
  Send,
  RefreshCw,
  Clock,
  Eye,
  Settings,
  Languages,
  ArrowRight,
  Maximize2,
  Github,
  ExternalLink,
  Mail
} from "lucide-react";
import { translations, Language } from "./translations";
import { WireframeDrone } from "./components/WireframeDrone";
import { KineticGears } from "./components/KineticGears";
import { LaserScanTransition } from "./components/LaserScanTransition";

function TypewriterText({
  text,
  speed = 100,
  delay = 0,
  className = "",
  showCursor = true,
  start = true,
}: {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  showCursor?: boolean;
  start?: boolean;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!start) {
      setDisplayedText("");
      setIsDone(false);
      return;
    }

    setDisplayedText("");
    setIsDone(false);
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    timeoutId = setTimeout(() => {
      let currentIndex = 0;
      intervalId = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsDone(true);
          clearInterval(intervalId);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [text, speed, delay, start]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && (
        <span
          className={`inline-block w-[0.25em] h-[0.8em] ml-1 bg-current align-baseline transition-opacity duration-300 ${
            isDone ? "animate-pulse" : "opacity-100"
          }`}
        />
      )}
    </span>
  );
}

function ScrollFade({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: "-20px 0px -20px 0px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-8 scale-[0.98] pointer-events-none"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showWhiteFlash, setShowWhiteFlash] = useState(false);
  const [transitionStage, setTransitionStage] = useState<number>(0);
  const [language, setLanguage] = useState<Language>("id");
  const [isInverted, setIsInverted] = useState(false); // Color Inversion State (SHAFT Style)
  const [timeSpeed, setTimeSpeed] = useState<number>(1.0); // Kinetic speed controller
  const [isArmed, setIsArmed] = useState(true);
  const [flightMode, setFlightMode] = useState<string>("RL_CONTROL");
  
  // PID Controller gains (influences the 3D drone rotor rotations and wobble)
  const [pidP, setPidP] = useState<number>(2.4);
  const [pidI, setPidI] = useState<number>(0.8);
  const [pidD, setPidD] = useState<number>(1.2);

  // Contact Form Inputs
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [formResponseMsg, setFormResponseMsg] = useState("");

  const [activeSection, setActiveSection] = useState<string>("sector-introduction");

  const t = translations[language];

  useEffect(() => {
    const sections = ["sector-introduction", "sector-skills-experiences", "sector-curated-projects", "sector-contact"];
    
    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Simple telemetry sync for drone visual output
  const [telemetry, setTelemetry] = useState({
    altitude: 10.0,
    speed: 5.0,
    heading: 90,
    pitch: 0.0,
    roll: 0.0,
    yaw: 0.0,
    motorRPMs: [7500, 7500, 7500, 7500],
  });

  // Scroll tracking states for interactive HUD
  const [scrollPercent, setScrollPercent] = useState(0);
  const [activeSector, setActiveSector] = useState("01 // APEX_OVERVIEW");

  const handleTelemetryUpdate = (newTelemetry: typeof telemetry) => {
    setTelemetry(newTelemetry);
  };

  // Scroll depth tracking
  useEffect(() => {
    if (!hasEntered) return;

    const handleAppScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const pct = Math.min(100, Math.max(0, Math.round((currentScroll / (totalHeight || 1)) * 100)));
      setScrollPercent(pct);

      if (currentScroll < 800) {
        setActiveSector("01 // APEX_HERO");
      } else if (currentScroll < 1800) {
        setActiveSector("02 // FLIGHT_SIMULATOR");
      } else if (currentScroll < 2800) {
        setActiveSector("03 // PROJECT_ARCHIVES");
      } else {
        setActiveSector("04 // TRANSMISSION_LOGS");
      }
    };

    window.addEventListener("scroll", handleAppScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleAppScroll);
  }, [hasEntered]);

  // Lock document scroll while on the intro screen
  useEffect(() => {
    if (!hasEntered) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [hasEntered]);

  // Contact form mailto redirect
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formMessage.trim()) return;

    setFormStatus("sending");

    const mailSubject = encodeURIComponent(formSubject.trim() || "Portfolio Inquiry");
    const mailBody = encodeURIComponent(
      `From: ${formName.trim()} (${formEmail.trim()})\n\nMessage:\n${formMessage.trim()}`
    );
    const mailtoUrl = `mailto:me@firzal.space?subject=${mailSubject}&body=${mailBody}`;

    const redirectNotice =
      language === "ja"
        ? "メールクライアントにリダイレクトしています (me@firzal.space)..."
        : language === "id"
        ? "Anda akan diarahkan ke aplikasi email Anda untuk mengirim pesan ke me@firzal.space..."
        : "You will be redirected to your default email client to send your message to me@firzal.space...";

    setFormResponseMsg(redirectNotice);

    setTimeout(() => {
      window.location.href = mailtoUrl;
      setFormStatus("success");
    }, 300);
  };

  return (
    <div className={`min-h-screen transition-all duration-1000 ${
      isInverted 
        ? "bg-[#faf9f6] text-stone-900 selection:bg-stone-200 selection:text-black" 
        : "bg-gradient-to-br from-[#050914] via-[#090f23] to-[#020409] text-stone-100 selection:bg-stone-800 selection:text-white"
    } font-sans antialiased relative overflow-x-hidden`}>

      {/* LASER HORIZON SCAN LINES OVERLAY UPON ENTERING */}
      <LaserScanTransition isEntering={isEntering} hasEntered={hasEntered} isFadingOut={isFadingOut} stage={transitionStage} />

      {/* BACKGROUND KINETIC CLOCKWORK GEARS - Unified across intro and portfolio pages */}
      <div className="fixed inset-0 z-0 opacity-80 pointer-events-none overflow-hidden">
        <KineticGears speed={isEntering ? 4.5 : timeSpeed * 0.7} isInverted={isInverted} />
      </div>

      {/* INTRO GATE OVERLAY - Visible only when hasEntered is false */}
      {!hasEntered && (
        <div className={`fixed inset-0 bg-gradient-to-br from-[#060a17] via-[#090f23] to-[#03060c] flex flex-col items-center justify-center overflow-hidden z-50 select-none touch-none overscroll-none transition-all duration-1000 ${
          isEntering ? "opacity-0 scale-[1.05] pointer-events-none blur-2xl" : "opacity-100 scale-100"
        } ${isEntering ? "animate-glitch-vibrate" : ""}`}>
          
          {/* BACKGROUND KINETIC CLOCKWORK GEARS for Chronos Intro page */}
          <div className="absolute inset-0 z-0 opacity-80 pointer-events-none overflow-hidden">
            <KineticGears speed={isEntering ? 4.5 : 1.1} isInverted={false} />
          </div>
          
          {/* Intricate high-tech blueprint overlay systems - strictly cool slate and blue */}
          <div className="absolute inset-0 pointer-events-none opacity-65">
            {/* Central rotating vector dials */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-sky-400/30 rounded-full animate-spin" style={{ animationDuration: "120s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] border border-dashed border-sky-400/20 rounded-full animate-spin" style={{ animationDuration: "90s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-sky-300/30 rounded-full animate-spin" style={{ animationDuration: "45s" }} />
            
            {/* Major alignment grid crosshair markings */}
            <div className="absolute top-12 left-12 font-mono text-[9px] text-sky-300/80 space-y-1">
              <p>GRID_SYS_SEC: // ALPHA-03</p>
              <p>CHRONO_LOCK: ARMED</p>
              <p>COORD: 34.0522° N, 118.2437° W</p>
              <p className="text-stone-400">REF_ID: 0x8FA92B2D</p>
            </div>
            
            <div className="absolute top-12 right-12 font-mono text-[9px] text-sky-300/80 text-right space-y-1">
              <p>BEARING: 184.22° SSE</p>
              <p>TIME_STYLIZATION_RATIO: 1.000</p>
              <p>HZ_STREAM: 60FPS // V-SYNC</p>
              <p className="text-stone-400">ENGINE_VERSION: V2.1.0_PROT</p>
            </div>

            <div className="absolute bottom-12 right-12 font-mono text-[9px] text-sky-300/80 text-right space-y-1">
              <p>STATUS: SYSTEM_STABILIZED</p>
              <p>NOISE_INTERPOLATOR: ENABLED</p>
              <p>CHRONOS_COEFFICIENT: 1.4142</p>
            </div>

            {/* Additional decorative tech lines and ticks */}
            <div className="absolute top-1/4 left-10 w-20 h-px bg-sky-400/50" />
            <div className="absolute top-1/4 left-10 h-8 w-px bg-sky-400/50" />
            <div className="absolute bottom-1/4 right-10 w-20 h-px bg-sky-400/50" />
            <div className="absolute bottom-1/4 right-10 h-8 w-px bg-sky-400/50" />

            {/* Concentric rings in quadrants */}
            <div className="absolute -top-40 -left-40 w-80 h-80 border border-sky-400/20 rounded-full" />
            <div className="absolute -top-40 -left-40 w-96 h-96 border border-dashed border-sky-400/20 rounded-full" />
            <div className="absolute -bottom-40 -right-40 w-80 h-80 border border-sky-400/20 rounded-full" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 border border-dashed border-sky-400/20 rounded-full" />
          </div>

          {/* Dramatic high-contrast SHAFT color cards in background - subtle blue/slate tints */}
          <div className="absolute top-0 left-0 w-1/3 h-full bg-sky-500/5 skew-x-12 transform origin-top pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-1/4 h-1/2 bg-sky-500/5 -skew-x-12 transform origin-bottom pointer-events-none" />
          
          {/* Floating language selector */}
          <div className="absolute top-8 right-8 z-50 flex gap-2">
            {["en", "id", "ja"].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang as Language)}
                className={`px-3 py-1 font-mono text-xs border transition-all duration-300 ${
                  language === lang
                    ? "bg-white text-black border-white font-bold"
                    : "bg-black/40 text-stone-400 border-stone-800 hover:text-stone-100 hover:border-stone-600"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Entry Gate Card */}
          <div className="relative text-center max-w-2xl px-6 z-30 font-serif flex flex-col items-center">
            <span className="text-sky-300 text-[10px] tracking-[0.5em] font-mono uppercase mb-4 animate-pulse">
              // INTERACTIVE KINETIC GATE
            </span>
            
            <h1 className="text-5xl md:text-7xl font-cinzel text-white font-black tracking-[0.2em] uppercase leading-none">
              FIRZAL // DEX
            </h1>
    
            <div className="w-20 h-0.5 bg-white my-6" />
    
            <p className="text-stone-400 text-xs md:text-sm tracking-[0.3em] font-mono uppercase leading-relaxed mb-12 max-w-md">
              {t.subtitle}
            </p>
    
            <button
              onClick={() => {
                setIsEntering(true);
                setIsFadingOut(false);
                setShowWhiteFlash(false);
                setTransitionStage(1);
                
                setTimeout(() => {
                  setTransitionStage(2);
                }, 750);

                setTimeout(() => {
                  setTransitionStage(3);
                }, 1500);

                setTimeout(() => {
                  setTransitionStage(4);
                }, 2250);

                // Trigger full white flash right at peak of Stage 4
                setTimeout(() => {
                  setShowWhiteFlash(true);
                }, 3000);

                // Reveal main page beneath and start smooth fade out
                setTimeout(() => {
                  setHasEntered(true);
                  setIsFadingOut(true);
                }, 3300);

                // Cleanup transition overlay after fade out completes completely
                setTimeout(() => {
                  setIsEntering(false);
                  setIsFadingOut(false);
                  setShowWhiteFlash(false);
                  setTransitionStage(0);
                }, 4050);
              }}
              className="group relative border-2 border-stone-100 text-white font-serif text-sm px-12 py-5 tracking-[0.25em] uppercase overflow-hidden hover:bg-white hover:text-black hover:border-white transition-all duration-500 cursor-pointer"
            >
              <span className="relative z-10 font-bold tracking-[0.3em]">{t.beginJourney}</span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-white transition-transform duration-500 -z-0" />
            </button>
          </div>

          {/* Stylistic SHAFT borders */}
          <div className="absolute top-10 left-10 border-l border-t border-stone-800 w-16 h-16 pointer-events-none" />
          <div className="absolute top-10 right-10 border-r border-t border-stone-800 w-16 h-16 pointer-events-none" />
          <div className="absolute bottom-10 left-10 border-l border-b border-stone-800 w-16 h-16 pointer-events-none" />
          <div className="absolute bottom-10 right-10 border-r border-b border-stone-800 w-16 h-16 pointer-events-none" />
        </div>
      )}

      {/* FULL WHITE FLASH OVERLAY - Flashes solid white before fading out to reveal main page */}
      {isEntering && showWhiteFlash && (
        <div className={`fixed inset-0 bg-white z-[110] pointer-events-none transition-opacity duration-800 ease-out ${
          isFadingOut ? "opacity-0" : "opacity-100"
        }`} />
      )}

      {/* MULTI-STAGE CINEMATIC REWIND TRANSITION OVERLAY - Renders on top during transitions */}
      {isEntering && !showWhiteFlash && !isFadingOut && (
        <div className={`fixed inset-0 flex items-center justify-center pointer-events-none z-50 backdrop-blur-md transition-colors duration-500 ease-out ${
          (transitionStage === 1 || transitionStage === 3)
            ? "bg-[#faf9f6] text-stone-900"
            : "bg-[#02040a]/90 text-stone-100"
        }`}>
          
          {/* STAGE 1: Glitch scanline bar, digital grids & slices - White Space Theme */}
          {transitionStage === 1 && (
            <div className="absolute inset-0 flex flex-col justify-between overflow-hidden animate-slide-from-top">
              <div className="w-full h-[30%] bg-sky-600/10 border-b border-sky-600/30 animate-glitch-slice" />
              <div className="w-full h-1 bg-sky-600 shadow-[0_0_20px_rgba(2,132,199,0.8)] animate-glitch-scanline" />
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Floating vector grids */}
                <div className="w-96 h-96 border border-dashed border-sky-600/30 rounded-full animate-ping" style={{ animationDuration: "0.75s" }} />
                <div className="absolute text-center space-y-1 font-mono text-sky-700 text-[10px]">
                  <p className="tracking-[0.5em]">// DECRYPTING_CHRONO_MESH_CORES</p>
                  <p className="text-stone-700 animate-pulse font-bold">KINETIC_FLOW: OVERLOAD_SPEED (16.0x)</p>
                </div>
              </div>
              <div className="w-full h-[25%] bg-sky-600/10 border-t border-sky-600/30 animate-glitch-slice" />
            </div>
          )}

          {/* STAGE 2: Spinning Roman Numeral Clock face & Backward rotating runic arrows */}
          {transitionStage === 2 && (
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden animate-scale-down">
              {/* Horizontal glitch stripes behind */}
              <div className="absolute w-full h-[5%] bg-sky-500/20 animate-glitch-slice" style={{ top: "25%" }} />
              <div className="absolute w-full h-[8%] bg-sky-500/10 animate-glitch-slice" style={{ top: "65%" }} />

              {/* Outer Runic circle rotating counter-clockwise */}
              <div className="absolute w-[620px] h-[620px] border border-dashed border-sky-500/15 rounded-full animate-spin-slow-reverse flex items-center justify-center">
                <span className="font-mono text-[10px] text-sky-500/30 tracking-[0.8em] uppercase">᚛ᛉᛖᛗᛚᛟᚦᚧᚩᚪᚫᚬᚭᚮᚯᚰᚱᚲᚳᚴ᚛ᛉᛖᛗᛚᛟ</span>
              </div>

              {/* Spinning Dial Plate with Roman marks */}
              <div className="absolute w-[500px] h-[500px] border border-sky-400/30 rounded-full flex items-center justify-center animate-spin-fast">
                <div className="absolute inset-4 border border-dashed border-sky-400/20 rounded-full" />
                <div className="absolute font-serif text-sky-300/80 text-xl select-none tracking-[0.2em] transform -translate-y-[210px]">XII</div>
                <div className="absolute font-serif text-sky-300/80 text-xl select-none tracking-[0.2em] transform translate-x-[210px]">III</div>
                <div className="absolute font-serif text-sky-300/80 text-xl select-none tracking-[0.2em] transform translate-y-[210px]">VI</div>
                <div className="absolute font-serif text-sky-300/80 text-xl select-none tracking-[0.2em] transform -translate-x-[210px]">IX</div>
              </div>

              {/* Concentric spinning inner Runic wheel */}
              <div className="absolute w-[360px] h-[360px] border border-sky-400/40 rounded-full flex items-center justify-center animate-spin-slow-reverse">
                <span className="font-mono text-[9px] text-sky-400/60 tracking-[0.6em]">᚛ᛉᛖᛗᛚᛟᚦᚧᚩᚪᚫᚬᚭᚮᚯᚰᚱᚲᚳᚴ</span>
              </div>

              {/* Ticking hands spinning backwards violently */}
              <div className="absolute w-2 h-[180px] bg-gradient-to-t from-transparent via-sky-400 to-sky-300 origin-bottom transform -translate-y-[90px] animate-spin-clock-hands" style={{ animationDuration: "1.2s" }} />
              <div className="absolute w-[140px] h-1 bg-gradient-to-r from-transparent via-sky-400/80 to-sky-300 origin-left transform translate-x-[70px] animate-spin-clock-hands" style={{ animationDuration: "0.8s" }} />

              {/* Pulsing Word REWIND with complex celestial vector circle */}
              <div className="z-10 text-center space-y-3">
                <h2 className="text-white font-cinzel text-5xl md:text-7xl font-black tracking-[0.8em] animate-pulse">REWIND</h2>
                <span className="text-sky-300 text-[10px] tracking-[0.5em] font-mono block uppercase">
                  // CHRONO_GATEWAY_SYNC
                </span>
              </div>
            </div>
          )}

          {/* STAGE 3: Clock iris / Eye aperture lens scan with sacred geometries - White Space Theme */}
          {transitionStage === 3 && (
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden animate-slide-from-bottom">
              
              {/* Spinning Sacred Metatron geometry behind */}
              <div className="absolute w-[440px] h-[440px] border border-dashed border-sky-600/25 rounded-full animate-spin-fast flex items-center justify-center" style={{ animationDuration: "12s" }}>
                {/* Visual Heptagram overlay lines */}
                <svg className="w-full h-full opacity-25 text-sky-700" viewBox="0 0 100 100">
                  <polygon points="50,5 95,35 75,90 25,90 5,35" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <polygon points="50,5 75,90 5,35 95,35 25,90" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </svg>
              </div>

              {/* Expanding aperture lens mask */}
              <div className="absolute w-[340px] h-[340px] border-[16px] border-double border-sky-600/80 rounded-full animate-iris" />
              <div className="absolute w-[240px] h-[240px] border-4 border-dashed border-sky-600/70 rounded-full animate-iris" style={{ animationDelay: "150ms" }} />
              <div className="absolute w-[160px] h-[160px] border-2 border-sky-600/60 rounded-full animate-iris" style={{ animationDelay: "300ms" }} />
              
              {/* Compass coordinate lines intersecting */}
              <div className="absolute w-[95%] h-px bg-sky-600/50 animate-pulse" />
              <div className="absolute h-[95%] w-px bg-sky-600/50 animate-pulse" />

              {/* Runic glyphs floating */}
              <div className="text-center font-mono space-y-2 z-10">
                <span className="text-stone-900 text-xs font-bold tracking-[0.8em] uppercase block">
                  // ALIGNING_COGNITIVE_GRID
                </span>
                <span className="text-sky-700 text-[10px] tracking-[0.4em] uppercase block animate-pulse font-bold">
                  PORTAL_STABILIZED // SYSTEM_READY
                </span>
              </div>
            </div>
          )}

          {/* STAGE 4: Sleek Arcane Inversion & Horizon Laser Scan Transition ("ENTERED" state) */}
          {transitionStage === 4 && (
            <div className="absolute inset-0 bg-[#020409]/95 flex flex-col items-center justify-center pointer-events-none transition-all duration-500 z-50 animate-flicker-inversion overflow-hidden">
              {/* Soft Horizon Scan Beam Covering Screen */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-sky-300/40 to-transparent shadow-[0_0_80px_#38bdf8] animate-horizon-laser-expand z-30 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-sky-500/0 via-sky-400/20 to-sky-500/0 animate-horizon-scan-cover z-20 pointer-events-none" />

              {/* Glitch chromatic lines passing by */}
              <div className="absolute inset-0 overflow-hidden opacity-25 z-10">
                <div className="w-full h-1 bg-red-500/40 absolute top-1/4 animate-glitch-slice" />
                <div className="w-full h-2 bg-cyan-500/40 absolute top-2/3 animate-glitch-slice" />
                <div className="w-full h-1.5 bg-sky-400/30 absolute top-1/2 animate-glitch-slice" />
              </div>

              {/* BLUEPRINT GRID BACKGROUND */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c712_1px,transparent_1px),linear-gradient(to_bottom,#0284c712_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none opacity-80 z-0" />

              {/* SCALING CONTAINER FOR CIRCLES & ENTERED TEXT */}
              <div className="absolute inset-0 flex flex-col items-center justify-center origin-center z-40 pointer-events-none">
                {/* TECHNICAL BLUEPRINT CIRCLE & VECTOR SYSTEM - SPREAD ACROSS ENTIRE SCREEN */}
                <svg className="absolute inset-0 w-full h-full text-sky-400 pointer-events-none opacity-80" viewBox="-600 -100 2200 1200" preserveAspectRatio="xMidYMid slice">
                  {/* 1. Global Connecting Blueprint Axis Lines across Screen */}
                  <line x1="-500" y1="500" x2="1500" y2="500" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.4" />
                  <line x1="500" y1="-50" x2="500" y2="1050" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.4" />
                  <line x1="-400" y1="200" x2="1400" y2="800" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" opacity="0.35" />
                  <line x1="-400" y1="800" x2="1400" y2="200" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 4" opacity="0.35" />

                  {/* 2. Main Central Double Concentric Ring System */}
                  <g style={{ transformOrigin: "500px 500px", animation: "circleScaleUp 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0s forwards", "--target-scale": "1.8" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "500px 500px", animationDuration: "50s" }}>
                      <circle cx="500" cy="500" r="280" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="500" cy="500" r="255" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 4" />
                      <circle cx="500" cy="500" r="150" fill="none" stroke="currentColor" strokeWidth="0.8" />
                      <circle cx="500" cy="500" r="50" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      {Array.from({ length: 24 }).map((_, i) => {
                        const angle = (i * 15 * Math.PI) / 180;
                        const x1 = 500 + 255 * Math.cos(angle);
                        const y1 = 500 + 255 * Math.sin(angle);
                        const x2 = 500 + 280 * Math.cos(angle);
                        const y2 = 500 + 280 * Math.sin(angle);
                        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1" opacity="0.7" />;
                      })}
                    </g>
                  </g>

                  {/* --- LEFT SIDE CIRCLE SYSTEMS (Dense Left Coverage) --- */}

                  {/* Left System 1: Far Left Main Hub (-480, 500) - Slow scale (1.8s) -> 2.5x */}
                  <g style={{ transformOrigin: "-480px 500px", animation: "circleScaleUp 1.8s cubic-bezier(0.16, 1, 0.3, 1) 0.05s forwards", "--target-scale": "2.5" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "-480px 500px", animationDuration: "35s", animationDirection: "reverse" }}>
                      <circle cx="-480" cy="500" r="260" fill="none" stroke="currentColor" strokeWidth="1.4" />
                      <circle cx="-480" cy="500" r="220" fill="none" stroke="currentColor" strokeWidth="0.9" strokeDasharray="6 3" />
                      <circle cx="-480" cy="500" r="140" fill="none" stroke="currentColor" strokeWidth="0.6" />
                      <circle cx="-480" cy="500" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      {Array.from({ length: 16 }).map((_, i) => {
                        const angle = (i * 22.5 * Math.PI) / 180;
                        return <line key={i} x1={-480 + 220 * Math.cos(angle)} y1={500 + 220 * Math.sin(angle)} x2={-480 + 260 * Math.cos(angle)} y2={500 + 260 * Math.sin(angle)} stroke="currentColor" strokeWidth="0.8" opacity="0.6" />;
                      })}
                    </g>
                  </g>

                  {/* Left System 2: Far Left Top (-360, 200) - Medium scale (1.1s) -> 1.2x */}
                  <g style={{ transformOrigin: "-360px 200px", animation: "circleScaleUp 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.12s forwards", "--target-scale": "1.2" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "-360px 200px", animationDuration: "28s" }}>
                      <circle cx="-360" cy="200" r="170" fill="none" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="-360" cy="200" r="130" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 2" />
                      <circle cx="-360" cy="200" r="70" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </g>
                  </g>

                  {/* Left System 3: Far Left Bottom (-380, 800) - Extended scale (2.2s) -> 2.1x */}
                  <g style={{ transformOrigin: "-380px 800px", animation: "circleScaleUp 2.2s cubic-bezier(0.16, 1, 0.3, 1) 0.18s forwards", "--target-scale": "2.1" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "-380px 800px", animationDuration: "42s" }}>
                      <circle cx="-380" cy="800" r="210" fill="none" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="-380" cy="800" r="170" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="8 4" />
                      <circle cx="-380" cy="800" r="95" fill="none" stroke="currentColor" strokeWidth="0.6" />
                    </g>
                  </g>

                  {/* Left System 4: Mid Left Top (-180, 150) - Fast scale (0.6s) -> 1.0x */}
                  <g style={{ transformOrigin: "-180px 150px", animation: "circleScaleUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.08s forwards", "--target-scale": "1.0" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "-180px 150px", animationDuration: "20s" }}>
                      <circle cx="-180" cy="150" r="110" fill="none" stroke="currentColor" strokeWidth="1" />
                      <circle cx="-180" cy="150" r="80" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 3" />
                    </g>
                  </g>

                  {/* Left System 5: Mid Left Center (-150, 500) - Mid-range scale (1.4s) -> 1.6x */}
                  <g style={{ transformOrigin: "-150px 500px", animation: "circleScaleUp 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards", "--target-scale": "1.6" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "-150px 500px", animationDuration: "32s", animationDirection: "reverse" }}>
                      <circle cx="-150" cy="500" r="180" fill="none" stroke="currentColor" strokeWidth="1.1" />
                      <circle cx="-150" cy="500" r="140" fill="none" stroke="currentColor" strokeWidth="0.7" strokeDasharray="5 2" />
                      <circle cx="-150" cy="500" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </g>
                  </g>

                  {/* Left System 6: Mid Left Lower (-180, 850) - Punchy scale (1.0s) -> 2.3x */}
                  <g style={{ transformOrigin: "-180px 850px", animation: "circleScaleUp 1.0s cubic-bezier(0.16, 1, 0.3, 1) 0.22s forwards", "--target-scale": "2.3" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "-180px 850px", animationDuration: "24s" }}>
                      <circle cx="-180" cy="850" r="130" fill="none" stroke="currentColor" strokeWidth="1" />
                      <circle cx="-180" cy="850" r="95" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="4 4" />
                    </g>
                  </g>

                  {/* Left System 7: Inner Left Upper (150, 250) - Quick scale (0.75s) -> 1.4x */}
                  <g style={{ transformOrigin: "150px 250px", animation: "circleScaleUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards", "--target-scale": "1.4" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "150px 250px", animationDuration: "26s" }}>
                      <circle cx="150" cy="250" r="140" fill="none" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="150" cy="250" r="105" fill="none" stroke="currentColor" strokeWidth="0.7" strokeDasharray="3 2" />
                    </g>
                  </g>

                  {/* Left System 8: Inner Left Lower (220, 750) - Deep scale (1.6s) -> 2.0x */}
                  <g style={{ transformOrigin: "220px 750px", animation: "circleScaleUp 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.14s forwards", "--target-scale": "2.0" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "220px 750px", animationDuration: "38s" }}>
                      <circle cx="220" cy="750" r="210" fill="none" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="220" cy="750" r="170" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 3" />
                      <circle cx="220" cy="750" r="100" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </g>
                  </g>


                  {/* --- RIGHT SIDE CIRCLE SYSTEMS (Dense Right Coverage) --- */}

                  {/* Right System 1: Far Right Main Hub (1480, 500) - Ultra slow scale (2.0s) -> 2.5x */}
                  <g style={{ transformOrigin: "1480px 500px", animation: "circleScaleUp 2.0s cubic-bezier(0.16, 1, 0.3, 1) 0.06s forwards", "--target-scale": "2.5" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "1480px 500px", animationDuration: "36s", animationDirection: "reverse" }}>
                      <circle cx="1480" cy="500" r="270" fill="none" stroke="currentColor" strokeWidth="1.4" />
                      <circle cx="1480" cy="500" r="230" fill="none" stroke="currentColor" strokeWidth="0.9" strokeDasharray="6 3" />
                      <circle cx="1480" cy="500" r="150" fill="none" stroke="currentColor" strokeWidth="0.6" />
                      <circle cx="1480" cy="500" r="70" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      {Array.from({ length: 16 }).map((_, i) => {
                        const angle = (i * 22.5 * Math.PI) / 180;
                        return <line key={i} x1={1480 + 230 * Math.cos(angle)} y1={500 + 230 * Math.sin(angle)} x2={1480 + 270 * Math.cos(angle)} y2={500 + 270 * Math.sin(angle)} stroke="currentColor" strokeWidth="0.8" opacity="0.6" />;
                      })}
                    </g>
                  </g>

                  {/* Right System 2: Far Right Top (1360, 200) - Medium scale (1.25s) -> 1.5x */}
                  <g style={{ transformOrigin: "1360px 200px", animation: "circleScaleUp 1.25s cubic-bezier(0.16, 1, 0.3, 1) 0.11s forwards", "--target-scale": "1.5" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "1360px 200px", animationDuration: "30s" }}>
                      <circle cx="1360" cy="200" r="180" fill="none" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="1360" cy="200" r="140" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 2" />
                      <circle cx="1360" cy="200" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </g>
                  </g>

                  {/* Right System 3: Far Right Bottom (1380, 800) - Longest scale (2.4s) -> 2.2x */}
                  <g style={{ transformOrigin: "1380px 800px", animation: "circleScaleUp 2.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards", "--target-scale": "2.2" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "1380px 800px", animationDuration: "44s" }}>
                      <circle cx="1380" cy="800" r="220" fill="none" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="1380" cy="800" r="180" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="8 4" />
                      <circle cx="1380" cy="800" r="110" fill="none" stroke="currentColor" strokeWidth="0.6" />
                    </g>
                  </g>

                  {/* Right System 4: Mid Right Top (1180, 150) - Fast scale (0.7s) -> 1.1x */}
                  <g style={{ transformOrigin: "1180px 150px", animation: "circleScaleUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.07s forwards", "--target-scale": "1.1" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "1180px 150px", animationDuration: "22s" }}>
                      <circle cx="1180" cy="150" r="120" fill="none" stroke="currentColor" strokeWidth="1" />
                      <circle cx="1180" cy="150" r="85" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 3" />
                    </g>
                  </g>

                  {/* Right System 5: Mid Right Center (1150, 500) - Mid-range scale (1.5s) -> 1.9x */}
                  <g style={{ transformOrigin: "1150px 500px", animation: "circleScaleUp 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.16s forwards", "--target-scale": "1.9" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "1150px 500px", animationDuration: "34s", animationDirection: "reverse" }}>
                      <circle cx="1150" cy="500" r="190" fill="none" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="1150" cy="500" r="150" fill="none" stroke="currentColor" strokeWidth="0.7" strokeDasharray="5 2" />
                      <circle cx="1150" cy="500" r="90" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </g>
                  </g>

                  {/* Right System 6: Mid Right Lower (1180, 850) - Sharp scale (1.15s) -> 2.4x */}
                  <g style={{ transformOrigin: "1180px 850px", animation: "circleScaleUp 1.15s cubic-bezier(0.16, 1, 0.3, 1) 0.24s forwards", "--target-scale": "2.4" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "1180px 850px", animationDuration: "25s" }}>
                      <circle cx="1180" cy="850" r="140" fill="none" stroke="currentColor" strokeWidth="1" />
                      <circle cx="1180" cy="850" r="100" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="4 4" />
                    </g>
                  </g>

                  {/* Right System 7: Inner Right Upper (850, 250) - Snappy scale (0.8s) -> 1.3x */}
                  <g style={{ transformOrigin: "850px 250px", animation: "circleScaleUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.09s forwards", "--target-scale": "1.3" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "850px 250px", animationDuration: "27s" }}>
                      <circle cx="850" cy="250" r="150" fill="none" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="850" cy="250" r="115" fill="none" stroke="currentColor" strokeWidth="0.7" strokeDasharray="3 2" />
                      <circle cx="850" cy="250" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </g>
                  </g>

                  {/* Right System 8: Inner Right Lower (780, 750) - Deep scale (1.7s) -> 1.7x */}
                  <g style={{ transformOrigin: "780px 750px", animation: "circleScaleUp 1.7s cubic-bezier(0.16, 1, 0.3, 1) 0.17s forwards", "--target-scale": "1.7" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "780px 750px", animationDuration: "40s" }}>
                      <circle cx="780" cy="750" r="200" fill="none" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="780" cy="750" r="160" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 3" />
                      <circle cx="780" cy="750" r="95" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </g>
                  </g>


                  {/* --- TOP AND BOTTOM CENTER SATELLITE CLUSTERS --- */}

                  {/* Top Center Cluster (500, 120) - Fast scale (0.5s) -> 1.0x */}
                  <g style={{ transformOrigin: "500px 120px", animation: "circleScaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.04s forwards", "--target-scale": "1.0" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "500px 120px", animationDuration: "18s" }}>
                      <circle cx="500" cy="120" r="120" fill="none" stroke="currentColor" strokeWidth="1" />
                      <circle cx="500" cy="120" r="90" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 2" />
                    </g>
                  </g>

                  {/* Bottom Center Cluster (500, 880) - Moderate scale (1.3s) -> 1.8x */}
                  <g style={{ transformOrigin: "500px 880px", animation: "circleScaleUp 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.13s forwards", "--target-scale": "1.8" } as React.CSSProperties}>
                    <g className="animate-spin" style={{ transformOrigin: "500px 880px", animationDuration: "31s" }}>
                      <circle cx="500" cy="880" r="140" fill="none" stroke="currentColor" strokeWidth="1.1" />
                      <circle cx="500" cy="880" r="105" fill="none" stroke="currentColor" strokeWidth="0.7" strokeDasharray="4 3" />
                    </g>
                  </g>

                </svg>

                <div className="relative text-center space-y-4 z-40 animate-glitch-vibrate">
                  <div className="text-white font-cinzel text-5xl md:text-7xl font-black tracking-[0.6em] uppercase animate-chromatic drop-shadow-[0_0_20px_rgba(56,189,248,0.7)]">
                    ENTERED
                  </div>
                  <p className="text-cyan-300 font-mono text-[10px] md:text-xs tracking-[0.5em] uppercase animate-pulse font-bold">
                    // HORIZON_SCAN_COMPLETE // PORTAL_STABILIZED
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADDITIONAL HIGH-TECH OVERLAYS FOR THE MAIN PORTFOLIO */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-45">
        {/* Large rotating alignment rings */}
        <div className={`absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] border rounded-full animate-spin ${isInverted ? 'border-stone-400/20' : 'border-sky-400/25'}`} style={{ animationDuration: "140s" }} />
        <div className={`absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[530px] h-[530px] border border-dashed rounded-full animate-spin ${isInverted ? 'border-stone-400/15' : 'border-sky-400/20'}`} style={{ animationDuration: "100s" }} />
        <div className={`absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] border rounded-full animate-spin ${isInverted ? 'border-stone-400/20' : 'border-sky-300/25'}`} style={{ animationDuration: "180s" }} />
        <div className={`absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[580px] h-[580px] border border-dashed rounded-full animate-spin ${isInverted ? 'border-stone-400/15' : 'border-sky-400/15'}`} style={{ animationDuration: "120s" }} />

        {/* Scattered technical alignment markings */}
        <div className={`absolute top-1/4 right-12 font-mono text-[8px] space-y-1 text-right ${isInverted ? 'text-stone-500' : 'text-sky-300/60'}`}>
          <p>SYSTEM_CHRONOS: ONLINE</p>
          <p>CALIB_GRID: CLOCKWORK_V3</p>
          <p>PORTFOLIO_LATENCY: 0.00ms</p>
        </div>

        <div className={`absolute bottom-1/3 left-12 font-mono text-[8px] space-y-1 ${isInverted ? 'text-stone-500' : 'text-sky-300/60'}`}>
          <p>STYLIZATION_RATIO: 1.4142</p>
          <p>KINETIC_SPEED_COEF: {timeSpeed.toFixed(2)}</p>
          <p>GRID_SYS: ACTIVE</p>
        </div>
      </div>

      {/* STYLISTIC VERTICAL RIBBONS (Studio SHAFT Signature Layout) */}
      <div className="fixed top-0 bottom-0 left-6 md:left-12 w-px bg-stone-500/10 z-10 pointer-events-none" />
      <div className="fixed top-0 bottom-0 right-6 md:right-12 w-px bg-stone-500/10 z-10 pointer-events-none" />

      {/* STYLISTIC FIXED/STICKY STATUS HEADER WITH NAVIGATION (Visible only on main page) */}
      {hasEntered && (
        <header className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md transition-all duration-500 ${
          isInverted ? "bg-[#faf9f6]/95 border-stone-200/90 shadow-sm" : "bg-[#070b12]/95 border-stone-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
        }`}>
          <div className="max-w-7xl mx-auto px-4 md:px-12 py-3 flex items-center justify-between gap-2">
            
            {/* Logo / Title */}
            <button 
              onClick={() => scrollToSection("sector-introduction")}
              className="flex items-center gap-3 group text-left cursor-pointer"
            >
              <div className={`w-9 h-9 border flex items-center justify-center font-cinzel text-md font-black transition-all duration-500 group-hover:scale-105 ${
                isInverted 
                  ? "border-stone-950 bg-stone-950 text-white group-hover:bg-sky-600 group-hover:border-sky-600" 
                  : "border-stone-200 bg-transparent text-white group-hover:border-sky-400 group-hover:text-sky-400 group-hover:shadow-[0_0_12px_rgba(56,189,248,0.5)]"
              }`}>
                Ø
              </div>
              <div>
                <h1 className="text-base md:text-lg tracking-[0.25em] font-cinzel font-black uppercase text-inherit leading-none transition-colors duration-300 group-hover:text-sky-400">
                  {t.introTitle}
                </h1>
                <p className="text-[8px] font-mono tracking-widest text-stone-400 uppercase mt-1">
                  KINETIC COOPERATIVE ENGINE
                </p>
              </div>
            </button>

            {/* DESKTOP NAVIGATION BAR */}
            <nav className={`hidden lg:flex items-center gap-1 border p-1 transition-colors duration-500 ${
              isInverted ? "border-stone-300/80 bg-stone-200/50" : "border-stone-800/80 bg-stone-950/80"
            }`}>
              {[
                { id: "sector-introduction", label: t.menuHome },
                { id: "sector-skills-experiences", label: t.menuSkills },
                { id: "sector-curated-projects", label: t.menuProjects },
                { id: "sector-contact", label: t.menuContact },
              ].map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest uppercase transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? isInverted
                          ? "bg-stone-900 text-white shadow-sm"
                          : "bg-sky-400 text-stone-950 shadow-[0_0_12px_rgba(56,189,248,0.6)] font-black"
                        : isInverted
                          ? "text-stone-600 hover:text-stone-950 hover:bg-stone-300/50"
                          : "text-stone-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isActive 
                        ? (isInverted ? "bg-white" : "bg-black") 
                        : "bg-stone-500/40"
                    }`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Controls: Inversion Toggle & Language Toggle */}
            <div className="flex items-center justify-end gap-2 md:gap-3">
              
              {/* INVERT COLOR BUTTON (The centerpiece of SHAFT theme cuts) */}
              <button
                onClick={() => setIsInverted(!isInverted)}
                className={`px-2.5 md:px-3 py-1.5 md:py-2 text-[9px] md:text-[10px] font-mono border tracking-widest font-bold transition-all duration-300 uppercase flex items-center gap-1.5 cursor-pointer ${
                  isInverted
                    ? "bg-stone-900 text-[#faf9f6] border-stone-900 hover:bg-stone-800"
                    : "bg-white text-stone-950 border-white hover:bg-sky-400 hover:border-sky-400"
                }`}
              >
                <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: "12s" }} />
                <span className="hidden sm:inline">{isInverted ? "BLACK SPACE" : "WHITE SPACE"}</span>
                <span className="sm:hidden">{isInverted ? "DARK" : "LIGHT"}</span>
              </button>

              {/* Language Panel */}
              <div className={`flex items-center gap-0.5 border p-0.5 transition-colors duration-500 ${
                isInverted ? "border-stone-200 bg-stone-100" : "border-stone-800 bg-stone-950"
              }`}>
                {["en", "id", "ja"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang as Language)}
                    className={`px-1.5 md:px-2 py-1 font-mono text-[9px] transition-all duration-300 cursor-pointer ${
                      language === lang
                        ? "bg-white text-black font-bold"
                        : "text-stone-500 hover:text-inherit"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>

            </div>

          </div>

          {/* MOBILE & TABLET NAVIGATION STRIP */}
          <div className={`lg:hidden flex items-center justify-around border-t py-1.5 px-2 overflow-x-auto gap-1 scrollbar-none transition-colors duration-500 ${
            isInverted ? "border-stone-200/80 bg-stone-100/90" : "border-stone-900/80 bg-stone-950/90"
          }`}>
            {[
              { id: "sector-introduction", label: t.menuHome },
              { id: "sector-skills-experiences", label: t.menuSkills },
              { id: "sector-curated-projects", label: t.menuProjects },
              { id: "sector-contact", label: t.menuContact },
            ].map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`px-2 py-1 font-mono text-[9px] font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-300 cursor-pointer ${
                    isActive
                      ? isInverted
                        ? "bg-stone-900 text-white"
                        : "bg-sky-400 text-stone-950 font-black shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

        </header>
      )}

      {/* CORE SINGLE SCREEN WORKSPACE */}
      <main className="relative max-w-7xl mx-auto px-6 md:px-16 pt-32 lg:pt-24 pb-10 space-y-24 z-10">

        {/* SECTION 1: HERO OVERVIEW & DETAILED DRONE SPLIT (No multi-pages) */}
        <section id="sector-introduction" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* LEFT COLUMN: Highly Stylistic Editorial Intro with vertical text bars */}
          <ScrollFade className="lg:col-span-6 space-y-6 relative z-10">
            
            {/* Floating vertical aesthetics on the left side of block */}
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-white text-black font-mono text-[9px] tracking-widest uppercase">
                ACTIVE COGNITIVE ARCHITECT
              </span>
              <span className="w-12 h-px bg-white" />
              <span className="font-mono text-[9px] text-stone-400 tracking-widest">
                UAD_SOPHOMORE_NODE
              </span>
            </div>

            {/* Massive headline block with typewriter effect */}
            <div className="space-y-1">
              <h2 className="text-6xl md:text-8xl font-cinzel font-black tracking-tight leading-none uppercase select-none">
                <TypewriterText
                  text={t.introTitle}
                  speed={100}
                  delay={200}
                  showCursor={true}
                  start={hasEntered && !isEntering}
                />
              </h2>
              <p className="text-xs md:text-sm font-mono tracking-[0.4em] text-stone-400 uppercase leading-none pl-1">
                <TypewriterText
                  text="AHMAD DAHLAN UNIVERSITY"
                  speed={55}
                  delay={200 + (t.introTitle ? t.introTitle.length * 100 : 600) + 150}
                  showCursor={true}
                  start={hasEntered && !isEntering}
                />
              </p>
            </div>

            <div className="h-0.5 bg-white/20 w-1/3" />

            {/* Stylized Portrait / Bio card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Studio Portrait Badge for Firzal */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div 
                  title="Aesthetic Identity Badge"
                  className="relative w-28 h-28 border-2 border-white/60 bg-stone-900/50 overflow-hidden flex items-center justify-center select-none"
                >
                  {/* Vector Portrait of Firzal as a glowing drone pilot logo */}
                  <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                    <line x1="2" y1="8" x2="6" y2="8" strokeWidth="2" />
                    <line x1="18" y1="8" x2="22" y2="8" strokeWidth="2" />
                    <circle cx="2" cy="8" r="1" fill="currentColor" />
                    <circle cx="22" cy="8" r="1" fill="currentColor" />
                  </svg>
                  
                  {/* Subtle decorative crosshair */}
                  <div className="absolute inset-0 bg-[radial-gradient(transparent_65%,rgba(255,255,255,0.05)_100%)]" />
                  <div className="absolute top-1 left-1 font-mono text-[5px] text-stone-400/60">PILOT_ID</div>
                  <div className="absolute bottom-1 right-1 font-mono text-[5px] text-stone-500">FRZ_02</div>
                </div>
                <div className="mt-2 text-[8px] font-mono text-stone-500 uppercase tracking-widest text-center">
                  FIRZAL // SEC_01
                </div>
              </div>

              {/* Bio descriptions */}
              <div className="md:col-span-8 space-y-3">
                <p className="text-xl md:text-2xl font-serif text-inherit leading-relaxed italic pl-3 border-l-2 border-white">
                  "{t.introText}"
                </p>
                <p className="text-stone-400 text-xs md:text-sm font-sans leading-relaxed">
                  {t.introAbout}
                </p>
              </div>

            </div>

          </ScrollFade>

          {/* RIGHT COLUMN: Upgraded, Highly Detailed 3D Wireframe Drone Box alongside introduction */}
          <ScrollFade delay={100} className="lg:col-span-6 flex flex-col gap-4 relative z-10">
            
            {/* Elegant container layout with absolute border rules */}
            <div className={`h-[380px] md:h-[450px] border relative transition-all duration-500 group ${
              isInverted 
                ? "border-stone-300 bg-[#faf9f6] hover:border-sky-500 hover:shadow-[0_10px_30px_rgba(14,165,233,0.18)]" 
                : "border-stone-800/80 bg-[#070b14]/70 backdrop-blur-md hover:border-sky-400/80 hover:shadow-[0_0_30px_rgba(56,189,248,0.22)]"
            }`}>
              
              <WireframeDrone
                isArmed={true}
                flightMode={flightMode}
                pidP={pidP}
                pidI={pidI}
                pidD={pidD}
                onTelemetryUpdate={handleTelemetryUpdate}
              />
              
            </div>

            {/* Social Profile Links (GitHub) below 3D Drone */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="https://github.com/firzal098"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center gap-2.5 px-5 py-3 border font-mono text-xs font-bold tracking-widest uppercase transition-all duration-300 group cursor-pointer ${
                  isInverted
                    ? "border-stone-400 bg-white text-stone-900 hover:bg-stone-900 hover:text-white hover:border-stone-900 shadow-sm hover:shadow-md"
                    : "border-sky-500/40 bg-[#0d1322]/80 text-white hover:bg-sky-500/20 hover:border-sky-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                }`}
              >
                <Github className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 text-sky-400 group-hover:text-inherit" />
                <span>GITHUB PROFILE</span>
                <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 ml-auto" />
              </a>
            </div>

          </ScrollFade>

        </section>

        {/* SECTION: TECHNICAL SKILLS & EXPERIENCES MATRIX */}
        <section id="sector-skills-experiences" className="space-y-12 pt-8">
          
          <ScrollFade className="text-center max-w-xl mx-auto space-y-2">
            <span className="px-2 py-0.5 bg-white text-black font-mono text-[9px] tracking-widest uppercase border border-stone-200/50">
              {t.skillsTitle}
            </span>
            <h3 className="text-3xl md:text-4xl font-cinzel font-bold text-inherit uppercase leading-none tracking-wider font-bold">
              {t.skillsSubtitle}
            </h3>
            <p className="text-stone-400 text-xs md:text-sm font-sans">
              {language === "ja" 
                ? "自律開発、物理シミュレーション、インテリジェントな意思決定のための専門技術ポートフォリオ。" 
                : language === "id" 
                ? "Portofolio teknik khusus untuk pengembangan otonom, simulasi fisik, dan keputusan cerdas." 
                : "Specialized engineering portfolio for autonomous development, physical simulations, and intelligent decision systems."}
            </p>
          </ScrollFade>

          {/* Grid Layout of skills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Column 1: Programming & Web Systems */}
            <ScrollFade delay={0}>
              <div className={`border p-6 space-y-6 relative transition-all duration-500 group h-full ${
                isInverted 
                  ? "border-stone-300 bg-white/95 shadow-sm hover:border-sky-500 hover:shadow-[0_12px_35px_rgba(14,165,233,0.2)] hover:-translate-y-1.5" 
                  : "border-stone-800/80 bg-[#0d1322]/50 backdrop-blur-md hover:border-sky-400/80 hover:shadow-[0_0_35px_rgba(56,189,248,0.25)] hover:-translate-y-1.5"
              }`}>
                <h4 className="font-cinzel text-lg font-black border-b border-white/20 pb-2 text-white tracking-widest font-bold group-hover:text-sky-400 transition-colors duration-300">
                  01 // CORE LANGUAGES & WEB
                </h4>
                
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <span className="text-stone-500 block text-[9px] tracking-wider mb-1 uppercase font-bold">{t.skillsCategoryLang}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["C++", "Javascript", "JS/TS", "Luau", "GDScript", "Python"].map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-white/5 text-inherit border border-white/10 text-[10px] uppercase font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-500 block text-[9px] tracking-wider mb-1 uppercase font-bold">FRONTEND MATRIX</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Streamlit", "React", "HTML5/CSS3", "TailwindCSS"].map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-stone-500/5 text-inherit border border-stone-500/10 text-[10px] uppercase font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-500 block text-[9px] tracking-wider mb-1 uppercase font-bold">BACKEND SYSTEMS</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["NodeJS", "FastAPI", "Flask"].map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-stone-500/5 text-inherit border border-stone-500/10 text-[10px] uppercase font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollFade>

            {/* Column 2: Robotics & Reinforcement Learning */}
            <ScrollFade delay={100}>
              <div className={`border p-6 space-y-6 relative transition-all duration-500 group h-full ${
                isInverted 
                  ? "border-stone-300 bg-white/95 shadow-sm hover:border-sky-500 hover:shadow-[0_12px_35px_rgba(14,165,233,0.2)] hover:-translate-y-1.5" 
                  : "border-stone-800/80 bg-[#0d1322]/50 backdrop-blur-md hover:border-sky-400/80 hover:shadow-[0_0_35px_rgba(56,189,248,0.25)] hover:-translate-y-1.5"
              }`}>
                <h4 className="font-cinzel text-lg font-black border-b border-white/20 pb-2 text-white tracking-widest font-bold group-hover:text-sky-400 transition-colors duration-300">
                  02 // ROBOTICS & INTEL
                </h4>
                
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <span className="text-stone-500 block text-[9px] tracking-wider mb-1 uppercase font-bold">PHYSICAL SIMULATORS</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Webots", "Gazebo", "MuJoCo"].map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-white/5 text-inherit border border-white/10 text-[10px] uppercase font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-500 block text-[9px] tracking-wider mb-1 uppercase font-bold">RL & NEURAL LIBRARIES</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Stable Baselines 3", "YOLO Box/Pose", "OpenCV", "Gymnasium", "Mediapipe", "MAVLink"].map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-stone-500/5 text-inherit border border-stone-500/10 text-[10px] uppercase font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-500 block text-[9px] tracking-wider mb-1 uppercase font-bold">FRAMEWORKS & FIRMWARE</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["ROS Jazzy", "Ardupilot"].map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-stone-500/5 text-inherit border border-stone-500/10 text-[10px] uppercase font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollFade>

            {/* Column 3: Storage, Containers & Design */}
            <ScrollFade delay={200}>
              <div className={`border p-6 space-y-6 relative transition-all duration-500 group h-full ${
                isInverted 
                  ? "border-stone-300 bg-white/95 shadow-sm hover:border-sky-500 hover:shadow-[0_12px_35px_rgba(14,165,233,0.2)] hover:-translate-y-1.5" 
                  : "border-stone-800/80 bg-[#0d1322]/50 backdrop-blur-md hover:border-sky-400/80 hover:shadow-[0_0_35px_rgba(56,189,248,0.25)] hover:-translate-y-1.5"
              }`}>
                <h4 className="font-cinzel text-lg font-black border-b border-white/20 pb-2 text-white tracking-widest font-bold group-hover:text-sky-400 transition-colors duration-300">
                  03 // CLOUD, INFRA & DESIGN
                </h4>
                
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <span className="text-stone-500 block text-[9px] tracking-wider mb-1 uppercase font-bold">CONTAINERIZATION</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Docker"].map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-white/5 text-inherit border border-white/10 text-[10px] uppercase font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-500 block text-[9px] tracking-wider mb-1 uppercase font-bold">STORAGE & DATABASES</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["PostgreSQL", "MongoDB"].map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-stone-500/5 text-inherit border border-stone-500/10 text-[10px] uppercase font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-500 block text-[9px] tracking-wider mb-1 uppercase font-bold">HARDWARE & DESIGN</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Raspberry Pi", "Khadas", "Figma", "Adobe Photoshop", "Adobe Premiere Pro"].map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-stone-500/5 text-inherit border border-stone-500/10 text-[10px] uppercase font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollFade>

          </div>

          {/* Chronological Experience Archive */}
          <div className="max-w-5xl mx-auto space-y-6 pt-4">
            <ScrollFade>
              <h4 className="font-cinzel text-xl font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 font-bold">
                <span className="w-6 h-px bg-stone-500/20" />
                {t.expTitle}
                <span className="w-6 h-px bg-stone-500/20" />
              </h4>
            </ScrollFade>
            
            <div className="space-y-4">
              
              {/* Game Dev Block */}
              <ScrollFade delay={0}>
                <div className={`p-6 border flex flex-col md:flex-row gap-4 justify-between transition-all duration-500 group ${
                  isInverted 
                    ? "border-stone-300 bg-white/95 shadow-sm hover:border-sky-500 hover:shadow-[0_10px_30px_rgba(14,165,233,0.18)] hover:-translate-y-1" 
                    : "border-stone-800/80 bg-[#0d1322]/50 backdrop-blur-md hover:border-sky-400/80 hover:shadow-[0_0_30px_rgba(56,189,248,0.22)] hover:-translate-y-1"
                }`}>
                  <div className="md:w-1/4">
                    <span className="font-mono text-xs text-stone-400 font-bold block">7+ YEARS ACTIVE</span>
                    <h5 className="font-cinzel text-md font-bold uppercase tracking-wider mt-1 font-bold group-hover:text-sky-400 transition-colors duration-300">{t.expGameDev}</h5>
                    <span className="font-mono text-[9px] text-stone-500 block mt-1">ROBLOX, GODOT, UNITY</span>
                  </div>
                  <div className="md:w-3/4 space-y-2">
                    <p className="text-stone-400 text-xs md:text-sm leading-relaxed">
                      {t.expGameDevDesc}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {["Roblox Studio (7 Years)", "Godot", "Unity", "Luau Scripting", "Custom Solvers"].map((tag) => (
                        <span key={tag} className="text-[9px] font-mono text-stone-500 border border-stone-500/10 px-1.5 py-0.5 uppercase font-bold group-hover:border-sky-400/30 group-hover:text-sky-300 transition-colors duration-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollFade>

              {/* Robotics & AI Block */}
              <ScrollFade delay={100}>
                <div className={`p-6 border flex flex-col md:flex-row gap-4 justify-between transition-all duration-500 group ${
                  isInverted 
                    ? "border-stone-300 bg-white/95 shadow-sm hover:border-sky-500 hover:shadow-[0_10px_30px_rgba(14,165,233,0.18)] hover:-translate-y-1" 
                    : "border-stone-800/80 bg-[#0d1322]/50 backdrop-blur-md hover:border-sky-400/80 hover:shadow-[0_0_30px_rgba(56,189,248,0.22)] hover:-translate-y-1"
                }`}>
                  <div className="md:w-1/4">
                    <span className="font-mono text-xs text-stone-400 font-bold block">AUTONOMOUS & AI</span>
                    <h5 className="font-cinzel text-md font-bold uppercase tracking-wider mt-1 font-bold group-hover:text-sky-400 transition-colors duration-300">Robotics & Vision</h5>
                    <span className="font-mono text-[9px] text-stone-500 block mt-1">SIMULATOR, RL, CNN, FIRMWARE</span>
                  </div>
                  <div className="md:w-3/4 space-y-2">
                    <p className="text-stone-400 text-xs md:text-sm leading-relaxed">
                      {t.expRoboticsDesc}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {["Webots", "Gazebo", "MuJoCo", "SB3 PPO", "YOLO Box/Pose", "ROS Jazzy", "Ardupilot", "Mavlink", "OpenCV", "Mediapipe"].map((tag) => (
                        <span key={tag} className="text-[9px] font-mono text-stone-500 border border-stone-500/10 px-1.5 py-0.5 uppercase font-bold group-hover:border-sky-400/30 group-hover:text-sky-300 transition-colors duration-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollFade>

              {/* Containerization Block */}
              <ScrollFade delay={200}>
                <div className={`p-6 border flex flex-col md:flex-row gap-4 justify-between transition-all duration-500 group ${
                  isInverted 
                    ? "border-stone-300 bg-white/95 shadow-sm hover:border-sky-500 hover:shadow-[0_10px_30px_rgba(14,165,233,0.18)] hover:-translate-y-1" 
                    : "border-stone-800/80 bg-[#0d1322]/50 backdrop-blur-md hover:border-sky-400/80 hover:shadow-[0_0_30px_rgba(56,189,248,0.22)] hover:-translate-y-1"
                }`}>
                  <div className="md:w-1/4">
                    <span className="font-mono text-xs text-stone-400 font-bold block">INFRASTRUCTURE</span>
                    <h5 className="font-cinzel text-md font-bold uppercase tracking-wider mt-1 font-bold group-hover:text-sky-400 transition-colors duration-300">Containerization</h5>
                    <span className="font-mono text-[9px] text-stone-500 block mt-1 font-bold">ENVIRONMENT ISOLATION</span>
                  </div>
                  <div className="md:w-3/4 space-y-2">
                    <p className="text-stone-400 text-xs md:text-sm leading-relaxed">
                      {t.expDockerDesc}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {["Docker", "Isolated Environments", "Simulation Sandbox", "Microservices"].map((tag) => (
                        <span key={tag} className="text-[9px] font-mono text-stone-500 border border-stone-500/10 px-1.5 py-0.5 uppercase font-bold group-hover:border-sky-400/30 group-hover:text-sky-300 transition-colors duration-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollFade>

            </div>

          </div>

        </section>

        {/* SECTION 2: ROBLOX PROJECTS (High-performance multiplayer games) */}
        <section id="sector-curated-projects" className="space-y-8">
          
          <ScrollFade className="text-center max-w-xl mx-auto space-y-2">
            <span className="px-2 py-0.5 bg-white text-black font-mono text-[9px] tracking-widest uppercase border border-stone-200/50">
              {language === "ja" ? "ROBLOXプロジェクト" : language === "id" ? "PROYEK ROBLOX" : "ROBLOX PROJECTS"}
            </span>
            <h3 className="text-3xl md:text-4xl font-cinzel font-bold text-inherit uppercase leading-none tracking-wider">
              {language === "ja" ? "ROBLOXプロジェクト" : language === "id" ? "Proyek Roblox" : "Roblox Projects"}
            </h3>
            <p className="text-stone-400 text-xs md:text-sm font-sans">
              High-performance multiplayer games developed using Luau constraints, custom physics, and client-side interpolation.
            </p>
          </ScrollFade>

          {/* Clean Editorial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Card 1: Response London */}
            <ScrollFade delay={0}>
              <div className={`border p-8 flex flex-col justify-between space-y-6 relative overflow-hidden transition-all duration-500 group h-full ${
                isInverted 
                  ? "border-stone-300 bg-white/95 shadow-sm hover:border-sky-500 hover:shadow-[0_12px_35px_rgba(14,165,233,0.22)] hover:-translate-y-1.5" 
                  : "border-stone-800/80 bg-[#0d1322]/50 backdrop-blur-md hover:border-sky-400/80 hover:shadow-[0_0_35px_rgba(56,189,248,0.25)] hover:-translate-y-1.5"
              }`}>
                {/* Massive backplate text number (SHAFT style) */}
                <div className="absolute top-2 right-4 font-cinzel text-8xl font-black text-stone-500/5 group-hover:text-sky-400/10 transition-colors duration-500 select-none pointer-events-none">
                  01
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-mono text-[9px] text-stone-400 font-bold uppercase select-none">
                    <span>METROPOLIS FLIGHT</span>
                    <span className="w-1.5 h-1.5 bg-stone-400 group-hover:bg-sky-400 transition-colors duration-300" />
                    <span>ONLINE ARCHITECTURE</span>
                  </div>
                  <h4 className="text-3xl font-cinzel font-black text-inherit tracking-wider uppercase group-hover:text-sky-400 transition-colors duration-300">
                    RESPONSE LONDON
                  </h4>
                  <p className="text-[10px] font-mono text-stone-500 italic uppercase">
                    {t.projectResponseLondonRole}
                  </p>
                  <p className="text-stone-400 text-xs md:text-sm leading-relaxed font-sans">
                    {t.projectResponseLondonDesc}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-500/10 flex items-center justify-between font-mono text-[10px]">
                  <span className="text-stone-500 font-mono">71.3M+ ID VERIFIED</span>
                  <a
                    href="https://www.roblox.com/games/71350675430720/Response-London"
                    target="_blank"
                    rel="noreferrer referrer"
                    className="inline-flex items-center gap-1.5 border border-white/60 text-white px-4 py-2 font-bold uppercase tracking-wider hover:bg-sky-400 hover:text-black hover:border-sky-400 transition duration-300 shadow-md"
                  >
                    {t.visitProject}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </ScrollFade>

            {/* Card 2: Gasing Blade */}
            <ScrollFade delay={150}>
              <div className={`border p-8 flex flex-col justify-between space-y-6 relative overflow-hidden transition-all duration-500 group h-full ${
                isInverted 
                  ? "border-stone-300 bg-white/95 shadow-sm hover:border-sky-500 hover:shadow-[0_12px_35px_rgba(14,165,233,0.22)] hover:-translate-y-1.5" 
                  : "border-stone-800/80 bg-[#0d1322]/50 backdrop-blur-md hover:border-sky-400/80 hover:shadow-[0_0_35px_rgba(56,189,248,0.25)] hover:-translate-y-1.5"
              }`}>
                {/* Massive backplate text number */}
                <div className="absolute top-2 right-4 font-cinzel text-8xl font-black text-stone-500/5 group-hover:text-sky-400/10 transition-colors duration-500 select-none pointer-events-none">
                  02
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-mono text-[9px] text-stone-400 font-bold uppercase select-none">
                    <span>PHYSICS SOLVER</span>
                    <span className="w-1.5 h-1.5 bg-stone-400 group-hover:bg-sky-400 transition-colors duration-300" />
                    <span>SPINNING INTERACTIVES</span>
                  </div>
                  <h4 className="text-3xl font-cinzel font-black text-inherit tracking-wider uppercase group-hover:text-sky-400 transition-colors duration-300">
                    GASING BLADE
                  </h4>
                  <p className="text-[10px] font-mono text-stone-500 italic uppercase">
                    {t.projectGasingBladeRole}
                  </p>
                  <p className="text-stone-400 text-xs md:text-sm leading-relaxed font-sans">
                    {t.projectGasingBladeDesc}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-500/10 flex items-center justify-between font-mono text-[10px]">
                  <span className="text-stone-500 font-mono">134.3M+ SOLVES DEPLOYED</span>
                  <a
                    href="https://www.roblox.com/games/134374526434831/Gasing-Blade"
                    target="_blank"
                    rel="noreferrer referrer"
                    className="inline-flex items-center gap-1.5 border border-white/60 text-white px-4 py-2 font-bold uppercase tracking-wider hover:bg-sky-400 hover:text-black hover:border-sky-400 transition duration-300 shadow-md"
                  >
                    {t.visitProject}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </ScrollFade>

          </div>

        </section>

        {/* SECTION 4: CONTACT ME (Clean geometric contact form) */}
        <section id="sector-contact" className="max-w-3xl mx-auto space-y-8">
          
          <ScrollFade className="text-center space-y-3">
            <span className="px-2.5 py-1 bg-white text-black font-mono text-[9px] tracking-widest uppercase border border-stone-200/50">
              {language === "ja" ? "連絡を取る" : language === "id" ? "HUBUNGI SAYA" : "GET IN TOUCH"}
            </span>
            <h3 className="text-3xl md:text-4xl font-cinzel font-bold text-inherit uppercase leading-none tracking-wider">
              {t.contactTitle}
            </h3>
            <p className="text-stone-400 text-xs md:text-sm font-sans max-w-lg mx-auto">
              {language === "ja"
                ? "フィルザル (me@firzal.space) に直接メッセージを送信します。できるだけ早くお返事いたします。"
                : language === "id"
                ? "Kirim pesan langsung ke Firzal (me@firzal.space). Saya akan membalas Anda secepat mungkin."
                : "Send a direct message to Firzal (me@firzal.space). I will get back to you as soon as possible."}
            </p>

            {/* Target Email & Mailto Info Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 font-mono text-[10px]">
              <a
                href="mailto:me@firzal.space"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-sky-400/40 text-sky-400 bg-sky-400/10 hover:bg-sky-400 hover:text-black transition duration-300 font-bold tracking-wider"
              >
                <span>TARGET: me@firzal.space</span>
                <Mail className="w-3 h-3" />
              </a>
              <span className="px-3 py-1.5 border border-stone-700/60 text-stone-400 bg-stone-900/40 tracking-wider">
                OPENS DEFAULT MAIL CLIENT
              </span>
            </div>
          </ScrollFade>

          <ScrollFade delay={100}>
            <form onSubmit={handleFormSubmit} className={`border p-8 space-y-6 relative transition-all duration-500 ${
              isInverted 
                ? "border-stone-300 bg-white/95 shadow-sm hover:border-sky-500 hover:shadow-[0_10px_30px_rgba(14,165,233,0.18)]" 
                : "border-stone-800/80 bg-[#0d1322]/60 backdrop-blur-md hover:border-sky-400/80 hover:shadow-[0_0_35px_rgba(56,189,248,0.22)]"
            }`}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              
              {/* Callsign / Name */}
              <div className="space-y-2">
                <label className="block text-stone-400 uppercase tracking-widest font-bold">
                  {t.contactName}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.contactPlaceholderName}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full p-3 border rounded-none bg-transparent outline-none transition-all duration-300 ${
                    isInverted 
                      ? "border-stone-200 text-stone-900 focus:border-stone-900" 
                      : "border-stone-800 text-stone-100 focus:border-white"
                  }`}
                />
              </div>

              {/* Email / Frequency */}
              <div className="space-y-2">
                <label className="block text-stone-400 uppercase tracking-widest font-bold">
                  {t.contactEmail}
                </label>
                <input
                  type="email"
                  required
                  placeholder={t.contactPlaceholderEmail}
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className={`w-full p-3 border rounded-none bg-transparent outline-none transition-all duration-300 ${
                    isInverted 
                      ? "border-stone-200 text-stone-900 focus:border-stone-900" 
                      : "border-stone-800 text-stone-100 focus:border-white"
                  }`}
                />
              </div>

            </div>

            {/* Subject */}
            <div className="space-y-2 font-mono text-xs">
              <label className="block text-stone-400 uppercase tracking-widest font-bold">
                {t.contactSubject}
              </label>
              <input
                type="text"
                placeholder={t.contactPlaceholderSubject}
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className={`w-full p-3 border rounded-none bg-transparent outline-none transition-all duration-300 ${
                  isInverted 
                    ? "border-stone-200 text-stone-900 focus:border-stone-900" 
                    : "border-stone-800 text-stone-100 focus:border-white"
                }`}
              />
            </div>

            {/* Message Payload */}
            <div className="space-y-2 font-mono text-xs">
              <label className="block text-stone-400 uppercase tracking-widest font-bold">
                {t.contactMessage}
              </label>
              <textarea
                required
                rows={5}
                placeholder={t.contactPlaceholderMessage}
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                className={`w-full p-3 border rounded-none bg-transparent outline-none transition-all duration-300 resize-none ${
                  isInverted 
                    ? "border-stone-200 text-stone-900 focus:border-stone-900" 
                    : "border-stone-800 text-stone-100 focus:border-white"
                }`}
              />
            </div>

            {/* Form Response message alerts */}
            {formStatus !== "idle" && formResponseMsg && (
              <div className={`p-4 border font-mono text-xs ${
                formStatus === "success" 
                  ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/30" 
                  : "bg-red-950/20 text-red-400 border-red-500/30"
              }`}>
                {formResponseMsg}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="font-mono text-[9px] text-stone-500 tracking-widest uppercase">
                {t.contactUplinkStatus}
              </span>
              <button
                type="submit"
                disabled={formStatus === "sending"}
                className={`group border-2 font-mono text-[10px] font-bold px-8 py-3.5 tracking-widest uppercase overflow-hidden relative cursor-pointer transition-all duration-500 ${
                  isInverted
                    ? "border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white hover:border-stone-900"
                    : "border-white text-white hover:bg-white hover:text-black hover:border-white"
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Send className="w-3 h-3" />
                  {formStatus === "sending" ? t.contactSending : t.contactSendBtn}
                </span>
                <div className={`absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 -z-0 ${isInverted ? "bg-stone-900" : "bg-white"}`} />
              </button>
            </div>

          </form>
          </ScrollFade>

        </section>

      </main>

      {/* FOOTER */}
      <footer className={`border-t py-12 mt-20 text-center font-mono text-[10px] text-stone-500 transition-colors duration-1000 ${
        isInverted ? "border-stone-200 bg-[#faf9f6]" : "border-stone-900 bg-black/40"
      }`}>
        <div className="max-w-7xl mx-auto px-6 space-y-3">
          <p className="uppercase tracking-[0.3em]">
            FIRZAL — DRONE KINETICS & ARTIFICIAL INTELLIGENCE PORTFOLIO
          </p>
          <p className="text-[8px] text-stone-400 tracking-[0.4em] font-bold">
            時 の 軌 跡 // 空 中 芸 術 // 人 工 知 能
          </p>
          <p className="opacity-60">
            © {new Date().getFullYear()} ALL CHRONOS PARAMETERS ENGAGED. AHMED DAHLAN UNIVERSITY.
          </p>
        </div>
      </footer>

      {/* INTERACTIVE CYBER SCROLL RADAR HUD WIDGET (Bottom Right) */}
      {hasEntered && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 select-none pointer-events-auto">
          {/* Detailed Sector & Depth Telemetry Badge */}
          <div className={`hidden sm:flex flex-col text-right font-mono text-[9px] px-3 py-2 border backdrop-blur-md transition-all duration-500 shadow-xl ${
            isInverted 
              ? "bg-stone-100/90 border-stone-300 text-stone-800" 
              : "bg-[#0a0f1d]/90 border-sky-500/30 text-sky-200"
          }`}>
            <span className="font-bold tracking-widest text-[8px] opacity-75 uppercase">SECTOR_DEPTH</span>
            <span className="font-black text-sky-400 tracking-wider">{activeSector}</span>
            <span className="text-[8px] opacity-60 tracking-widest">NAV_ALTITUDE: {scrollPercent * 38}m</span>
          </div>

          {/* Interactive Circular Progress & Scroll-to-Top trigger */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            title="Return to Apex"
            className={`group relative w-14 h-14 rounded-full border backdrop-blur-lg flex items-center justify-center cursor-pointer transition-all duration-500 hover:scale-105 shadow-2xl ${
              isInverted
                ? "border-stone-300 bg-stone-100/90 text-stone-900 hover:border-stone-900"
                : "border-sky-500/40 bg-[#080d1a]/90 text-sky-300 hover:border-sky-400 hover:shadow-sky-500/20"
            }`}
          >
            {/* SVG Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={isInverted ? "rgba(120,113,108,0.2)" : "rgba(56,189,248,0.15)"}
                strokeWidth="2"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={isInverted ? "#1c1917" : "#38bdf8"}
                strokeWidth="2.5"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (125.6 * scrollPercent) / 100}
                className="transition-all duration-200 ease-out"
              />
            </svg>

            {/* Inner Content: Scroll % or Hover Arrow */}
            <div className="flex flex-col items-center justify-center z-10 font-mono">
              <ArrowRight className="w-4 h-4 -rotate-90 group-hover:-translate-y-1 transition-transform duration-300" />
              <span className="text-[8px] font-black tracking-tighter mt-0.5">
                {scrollPercent}%
              </span>
            </div>

            {/* Pulsing kinetic outer ring when scrolled down */}
            {scrollPercent > 5 && (
              <div className="absolute -inset-1 rounded-full border border-sky-400/20 animate-ping pointer-events-none" style={{ animationDuration: "3s" }} />
            )}
          </button>
        </div>
      )}

    </div>
  );
}
