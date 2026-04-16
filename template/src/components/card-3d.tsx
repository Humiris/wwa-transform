"use client";

import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ProductItem } from "@/lib/cards";
import { motion } from "framer-motion";

interface Card3DProps {
  card: ProductItem;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

export const Card3D = ({ card, size = "md", onClick, className }: Card3DProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const sizes = {
    sm: { w: "w-[200px]", h: "h-[126px]", text: "text-[9px]", nameText: "text-xs", pad: "p-3" },
    md: { w: "w-[300px]", h: "h-[189px]", text: "text-[10px]", nameText: "text-sm", pad: "p-5" },
    lg: { w: "w-[400px]", h: "h-[252px]", text: "text-xs", nameText: "text-base", pad: "p-6" },
  };
  const s = sizes[size];

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;
    setRotation({ x: rotateX, y: rotateY });
  }, []);

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovering(false);
  };

  return (
    <div
      className={cn("perspective-[1000px] cursor-pointer", className)}
      onClick={() => onClick?.()}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
        animate={{
          rotateX: isFlipped ? 0 : rotation.x,
          rotateY: isFlipped ? 180 : rotation.y,
          scale: isHovering ? 1.05 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(s.w, s.h, "relative")}
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "center center",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Card background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1F71] via-[#1434CB] to-[#0d1147]">
            {/* Holographic effect */}
            <div
              className="absolute inset-0 opacity-30 transition-opacity"
              style={{
                background: isHovering
                  ? `radial-gradient(circle at ${50 + rotation.y * 2}% ${50 + rotation.x * 2}%, rgba(255,255,255,0.4) 0%, transparent 50%)`
                  : "none",
              }}
            />
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)",
            }} />
          </div>

          {/* Card image overlay */}
          <img
            src={card.image}
            alt={card.name}
            className="absolute inset-0 w-full h-full object-contain p-4 drop-shadow-lg"
            style={{ mixBlendMode: "screen", opacity: 0.9 }}
          />

          {/* Brand logo */}
          <div className="absolute top-3 right-4">
            <svg viewBox="0 0 1000 324" fill="white" className={cn(size === "sm" ? "w-10 h-3" : size === "md" ? "w-14 h-4" : "w-16 h-5")} style={{ opacity: 0.9 }}>
              <path d="M 413.58 1.58 L 311.01 322.38 L 255.72 322.38 L 204.73 52.56 C 201.87 39.32 199.37 34.53 189.23 29.02 C 172.72 20.14 145.51 11.83 121.62 6.61 L 122.88 1.58 L 223.3 1.58 C 236.26 1.58 247.77 10.17 250.76 25.14 L 276.07 160.11 L 330.8 1.58 L 413.58 1.58 Z M 748.96 217.49 C 749.29 127.03 625.29 122.14 626.17 81.29 C 626.44 69.58 637.55 57.12 661.8 54.01 C 673.83 52.48 706.34 51.24 743.31 68.19 L 758.1 6.04 C 738.25 -0.89 713.13 -7.55 682.53 -7.55 C 604.54 -7.55 550.03 33.42 549.6 92.89 C 549.1 137.67 589.48 162.53 620.15 177.35 C 651.79 192.51 662.39 202.21 662.26 215.66 C 662.01 236.1 637.94 245.17 615.46 245.52 C 574.53 246.13 550.77 234.6 531.59 225.85 L 516.37 289.99 C 535.69 298.63 572.68 306.11 611.08 306.46 C 694.12 306.46 748.71 266.03 748.96 217.49 Z M 891.33 322.38 L 963.17 322.38 L 900.24 1.58 L 835.6 1.58 C 824.11 1.58 814.42 8.78 810.29 19.2 L 693.87 322.38 L 776.85 322.38 L 793.32 275.67 L 894.17 275.67 L 891.33 322.38 Z M 814.62 213.62 L 856.32 99.29 L 880.55 213.62 L 814.62 213.62 Z M 514.7 1.58 L 449.94 322.38 L 371.08 322.38 L 435.88 1.58 L 514.7 1.58 Z" />
            </svg>
          </div>

          {/* Chip */}
          <div className={cn("absolute", size === "sm" ? "top-3 left-3" : "top-4 left-5")}>
            <div className={cn("rounded-md bg-gradient-to-br from-[#d4af37] via-[#f0d060] to-[#b8941e]", size === "sm" ? "w-7 h-5" : size === "md" ? "w-9 h-7" : "w-11 h-8")}>
              <div className="w-full h-full rounded-md" style={{
                background: "repeating-linear-gradient(90deg, transparent 0px, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 3px)",
              }} />
            </div>
          </div>

          {/* Contactless icon */}
          <div className={cn("absolute", size === "sm" ? "top-3 left-12" : size === "md" ? "top-5 left-16" : "top-5 left-[72px]")}>
            <svg className={cn("text-white/60", size === "sm" ? "w-3 h-3" : "w-4 h-4")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8.5 16.5a5 5 0 0 1 0-9" /><path d="M5 19a9 9 0 0 1 0-14" /><path d="M12 14a2 2 0 0 1 0-4" />
            </svg>
          </div>

          {/* Card info bottom */}
          <div className={cn("absolute bottom-0 left-0 right-0", s.pad)}>
            <p className={cn(s.nameText, "font-semibold text-white tracking-wide truncate")}>{card.name}</p>
            <div className="flex items-center justify-between mt-1">
              <p className={cn(s.text, "text-white/50 font-mono tracking-[0.2em]")}>•••• •••• •••• 4242</p>
              <p className={cn(s.text, "text-white/50")}>{card.tier.replace("Brand ", "")}</p>
            </div>
          </div>

          {/* Shine overlay on hover */}
          {isHovering && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: `linear-gradient(${105 + rotation.y * 2}deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)`,
              }}
            />
          )}
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0d1147] via-[#1A1F71] to-[#1434CB]"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Magnetic stripe */}
          <div className="mt-6 h-10 bg-[#111] w-full" />

          {/* Signature + CVV */}
          <div className={cn("mt-4 mx-5 flex items-center gap-3")}>
            <div className="flex-1 h-8 bg-white/90 rounded flex items-center px-3">
              <div className="w-full h-4 bg-[repeating-linear-gradient(45deg,#ddd,#ddd_2px,#eee_2px,#eee_4px)]" />
            </div>
            <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-xs font-mono font-bold text-neutral-900 italic">123</span>
            </div>
          </div>

          {/* Back info */}
          <div className={cn("mt-4 mx-5 space-y-2")}>
            <p className="text-[8px] text-white/40 leading-relaxed">
              This card is issued by {card.issuer}. Use of this card is subject to the cardholder agreement.
              For customer service, call 1-800-VISA (8472).
            </p>
            <div className="flex items-center justify-between">
              <p className="text-[8px] text-white/30">Annual fee: {card.annualFee}</p>
              <svg viewBox="0 0 1000 324" fill="white" className="w-10 h-3" style={{ opacity: 0.4 }}>
                <path d="M 413.58 1.58 L 311.01 322.38 L 255.72 322.38 L 204.73 52.56 C 201.87 39.32 199.37 34.53 189.23 29.02 C 172.72 20.14 145.51 11.83 121.62 6.61 L 122.88 1.58 L 223.3 1.58 C 236.26 1.58 247.77 10.17 250.76 25.14 L 276.07 160.11 L 330.8 1.58 L 413.58 1.58 Z M 748.96 217.49 C 749.29 127.03 625.29 122.14 626.17 81.29 C 626.44 69.58 637.55 57.12 661.8 54.01 C 673.83 52.48 706.34 51.24 743.31 68.19 L 758.1 6.04 C 738.25 -0.89 713.13 -7.55 682.53 -7.55 C 604.54 -7.55 550.03 33.42 549.6 92.89 C 549.1 137.67 589.48 162.53 620.15 177.35 C 651.79 192.51 662.39 202.21 662.26 215.66 C 662.01 236.1 637.94 245.17 615.46 245.52 C 574.53 246.13 550.77 234.6 531.59 225.85 L 516.37 289.99 C 535.69 298.63 572.68 306.11 611.08 306.46 C 694.12 306.46 748.71 266.03 748.96 217.49 Z M 891.33 322.38 L 963.17 322.38 L 900.24 1.58 L 835.6 1.58 C 824.11 1.58 814.42 8.78 810.29 19.2 L 693.87 322.38 L 776.85 322.38 L 793.32 275.67 L 894.17 275.67 L 891.33 322.38 Z M 814.62 213.62 L 856.32 99.29 L 880.55 213.62 L 814.62 213.62 Z M 514.7 1.58 L 449.94 322.38 L 371.08 322.38 L 435.88 1.58 L 514.7 1.58 Z" />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Shadow */}
      <div
        className={cn(s.w, "h-4 mx-auto -mt-2 rounded-full transition-all duration-300", isHovering ? "opacity-30 blur-xl scale-90" : "opacity-15 blur-lg")}
        style={{ background: "radial-gradient(ellipse, rgba(26,31,113,0.5) 0%, transparent 70%)" }}
      />

      {/* Double-click hint */}
      {isHovering && (
        <p className="text-center text-[9px] text-neutral-400 mt-1 animate-in fade-in duration-300">Double-click to flip</p>
      )}
    </div>
  );
};
