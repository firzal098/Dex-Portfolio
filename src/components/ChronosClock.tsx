import React, { useState, useEffect } from "react";
import { translations, Language } from "../translations";

interface ChronosClockProps {
  language: Language;
  onEnter: () => void;
}

export const ChronosClock: React.FC<ChronosClockProps> = ({ language, onEnter }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [glitchText, setGlitchText] = useState("BEGIN YOUR JOURNEY");
  const [glitchActive, setGlitchActive] = useState(false);
  const [clockRotate, setClockRotate] = useState(0);

  const t = translations[language];

  // Animate spinning Roman Clock face
  useEffect(() => {
    const interval = setInterval(() => {
      setClockRotate((prev) => (prev + 0.05) % 360);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  // Glitch effect on button hover/trigger
  const triggerGlitchTransition = () => {
    setIsTransitioning(true);
    setGlitchActive(true);

    let stage = 0;
    const interval = setInterval(() => {
      stage++;
      if (stage === 1) {
        setGlitchText("FRAGMENTED MEMORIES");
      } else if (stage === 2) {
        setGlitchText("UPLINK: REPAIRING SECTORS");
      } else if (stage === 3) {
        setGlitchText("KING PHOENIX ONLINE...");
      } else if (stage >= 4) {
        clearInterval(interval);
        onEnter();
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-stone-950 flex flex-col items-center justify-center overflow-hidden z-50 select-none">
      {/* Absolute high-contrast wire grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40 pointer-events-none" />

      {/* Glitch CRT Lines overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stone-950/20 to-transparent pointer-events-none mix-blend-overlay z-20" />

      {/* Chronos Gate Clock Face (Large vector in background) */}
      <div
        className="absolute w-[600px] h-[600px] md:w-[750px] md:h-[750px] border border-stone-800 rounded-full flex items-center justify-center opacity-30 transition-transform duration-100"
        style={{ transform: `rotate(${clockRotate}deg)` }}
      >
        {/* Roman numerals position circles */}
        {["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"].map((num, idx) => {
          const angle = (idx * 30 * Math.PI) / 180;
          const r = 260; // radius of numbers
          const x = Math.sin(angle) * r;
          const y = -Math.cos(angle) * r;
          return (
            <div
              key={num}
              className="absolute font-serif text-lg md:text-xl text-stone-200"
              style={{
                transform: `translate(${x}px, ${y}px) rotate(${-clockRotate}deg)`,
              }}
            >
              {num}
            </div>
          );
        })}
        {/* Inner gears & circles */}
        <div className="absolute w-[80%] h-[80%] border border-dashed border-stone-800 rounded-full" />
        <div className="absolute w-[60%] h-[60%] border border-stone-900 rounded-full" />
        {/* Giant clock hour hand indicating forward motion */}
        <div className="absolute bottom-1/2 left-1/2 w-1.5 h-[160px] md:h-[220px] bg-stone-100 origin-bottom rounded-full -translate-x-1/2" />
        {/* Giant clock minute hand */}
        <div
          className="absolute bottom-1/2 left-1/2 w-0.5 h-[240px] md:h-[300px] bg-stone-400 origin-bottom -translate-x-1/2"
          style={{ transform: "rotate(45deg)" }}
        />
        {/* Clock center pin */}
        <div className="absolute w-8 h-8 rounded-full bg-stone-900 border-2 border-stone-400 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
        </div>
      </div>

      {/* Landing Content Interface */}
      <div className="relative text-center max-w-2xl px-6 z-30 font-serif flex flex-col items-center">
        {/* Subtle decorative crest */}
        <div className="mb-4 text-stone-400 text-[10px] tracking-[0.4em] uppercase font-mono">
          SECURE SECTOR ACCESS
        </div>

        {/* Glitch Title */}
        <h1
          id="chronos-main-title"
          className={`text-4xl md:text-6xl tracking-[0.15em] text-white font-serif leading-none transition-all ${
            glitchActive ? "animate-pulse" : ""
          }`}
          style={{ textShadow: "0 0 15px rgba(255,255,255,0.1)" }}
        >
          {isTransitioning ? "MEMORIES" : translations[language].title}
        </h1>

        <div className="w-24 h-px bg-stone-700 my-6" />

        <p className="text-stone-400 text-xs md:text-sm tracking-[0.25em] font-mono leading-relaxed mb-12 uppercase max-w-lg">
          {isTransitioning ? "REPAIRING FRAGMENTED SECTORS..." : translations[language].subtitle}
        </p>

        {/* BEGIN YOUR JOURNEY BUTTON */}
        <button
          onClick={triggerGlitchTransition}
          disabled={isTransitioning}
          className={`relative group border border-stone-200 text-stone-200 font-serif text-sm px-10 py-4.5 tracking-[0.2em] uppercase overflow-hidden hover:bg-stone-100 hover:text-stone-950 hover:border-stone-100 transition duration-300 ${
            isTransitioning ? "bg-stone-100 text-stone-950 border-stone-100" : ""
          }`}
        >
          <span className="relative z-10">{glitchText}</span>
          {/* Subtle button shadow/glitch effect block */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-stone-100 transition-transform duration-300 -z-0" />
        </button>

        {/* Multi-language Selector inside Clock Gate */}
        {!isTransitioning && (
          <div className="mt-16 flex items-center gap-6 font-mono text-xs text-stone-500">
            {["en", "id", "ja"].map((lang) => (
              <span key={lang} className="hover:text-stone-300 transition duration-150">
                LATCH_FREQ_{lang.toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Frame boundary aesthetics matching Chronicles of Perception */}
      <div className="absolute top-6 left-6 border-l-2 border-t-2 border-stone-800 w-12 h-12" />
      <div className="absolute top-6 right-6 border-r-2 border-t-2 border-stone-800 w-12 h-12" />
      <div className="absolute bottom-6 left-6 border-l-2 border-b-2 border-stone-800 w-12 h-12" />
      <div className="absolute bottom-6 right-6 border-r-2 border-b-2 border-stone-800 w-12 h-12" />
    </div>
  );
};
