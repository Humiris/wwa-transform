"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Globe, CreditCard, Building2, Users, MapPin } from "lucide-react";

const REGIONS = [
  { id: "na", name: "North America", x: 22, y: 35, countries: 3, merchants: "12M+", banks: "5,000+", cards: "800M+", color: "#1A1F71" },
  { id: "latam", name: "Latin America", x: 28, y: 62, countries: 33, merchants: "15M+", banks: "3,500+", cards: "600M+", color: "#1434CB" },
  { id: "eu", name: "Europe", x: 52, y: 30, countries: 44, merchants: "35M+", banks: "8,000+", cards: "900M+", color: "#0d47a1" },
  { id: "mea", name: "Middle East & Africa", x: 55, y: 55, countries: 70, merchants: "10M+", banks: "4,000+", cards: "300M+", color: "#1565c0" },
  { id: "ap", name: "Asia Pacific", x: 78, y: 42, countries: 50, merchants: "60M+", banks: "10,000+", cards: "1.4B+", color: "#0d1147" },
];

const GLOBAL_STATS = [
  { icon: Globe, value: "200+", label: "Countries & territories", detail: "Brand operates in virtually every country" },
  { icon: CreditCard, value: "4B+", label: "Cards worldwide", detail: "More than half the world's population" },
  { icon: Building2, value: "150M+", label: "Merchant locations", detail: "Accepted almost everywhere" },
  { icon: Users, value: "14,500+", label: "Bank partners", detail: "Issuers and acquirers globally" },
];

export const WorldMap = () => {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const active = REGIONS.find(r => r.id === activeRegion);

  return (
    <div className="flex-1 h-full bg-[#050a1a] flex flex-col text-white overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 md:px-10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#F7B600] font-semibold mb-2">Global Presence</p>
        <h1 className="text-2xl md:text-3xl font-semibold">Brand Around the World</h1>
        <p className="text-sm text-white/50 mt-2">Tap a region to explore global presence. 200+ countries, 180 currencies, everywhere you want to be.</p>
      </div>

      {/* Map Area */}
      <div className="relative flex-1 min-h-[320px] mx-6 md:mx-10 my-4 rounded-2xl bg-[#0a1128] border border-white/5 overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "30px 30px"
        }} />

        {/* World map outline (simplified SVG) */}
        <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Simplified continent shapes */}
          <g opacity="0.15" fill="white">
            {/* North America */}
            <path d="M10,18 L18,12 L28,14 L32,20 L30,28 L28,35 L22,38 L18,36 L12,30 L10,24Z" />
            {/* South America */}
            <path d="M22,40 L28,38 L32,42 L34,50 L30,56 L26,54 L22,48 L20,44Z" />
            {/* Europe */}
            <path d="M44,14 L48,12 L54,14 L58,16 L56,22 L52,26 L48,24 L44,20Z" />
            {/* Africa */}
            <path d="M44,28 L50,26 L56,28 L58,35 L56,44 L52,50 L48,48 L44,40 L42,34Z" />
            {/* Asia */}
            <path d="M58,10 L68,8 L78,12 L86,16 L88,22 L84,28 L78,32 L72,30 L66,26 L60,20 L58,14Z" />
            {/* Australia */}
            <path d="M78,42 L86,40 L90,44 L88,48 L82,50 L78,46Z" />
          </g>
        </svg>

        {/* Region dots */}
        {REGIONS.map((region) => (
          <motion.button
            key={region.id}
            onClick={() => setActiveRegion(activeRegion === region.id ? null : region.id)}
            className="absolute z-10"
            style={{ left: `${region.x}%`, top: `${region.y}%`, transform: "translate(-50%, -50%)" }}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
          >
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={activeRegion === region.id ? {
                scale: [1, 2.5, 1],
                opacity: [0.5, 0, 0.5],
              } : {
                scale: [1, 1.8],
                opacity: [0.3, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ background: region.color }}
            />
            {/* Dot */}
            <div className={`w-4 h-4 rounded-full relative z-10 border-2 transition-all ${
              activeRegion === region.id
                ? "bg-[#F7B600] border-[#F7B600] scale-125"
                : "bg-white/80 border-white/40 hover:bg-[#F7B600] hover:border-[#F7B600]"
            }`} />
            {/* Label */}
            <div className={`absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold transition-all ${
              activeRegion === region.id ? "text-[#F7B600]" : "text-white/40"
            }`}>
              {region.name}
            </div>
          </motion.button>
        ))}

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 60">
          {REGIONS.map((r, i) => {
            const next = REGIONS[(i + 1) % REGIONS.length];
            return (
              <motion.line
                key={`${r.id}-${next.id}`}
                x1={r.x} y1={r.y} x2={next.x} y2={next.y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.3"
                strokeDasharray="2 2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: i * 0.3 }}
              />
            );
          })}
        </svg>
      </div>

      {/* Region Detail Card */}
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 md:mx-10 mb-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-[#F7B600]" />
            <h3 className="text-lg font-semibold">{active.name}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xl font-bold text-[#F7B600]">{active.countries}</p>
              <p className="text-[10px] text-white/40">Countries</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xl font-bold text-white">{active.merchants}</p>
              <p className="text-[10px] text-white/40">Merchants</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xl font-bold text-white">{active.banks}</p>
              <p className="text-[10px] text-white/40">Bank Partners</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xl font-bold text-white">{active.cards}</p>
              <p className="text-[10px] text-white/40">Cards</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Global Stats */}
      <div className="px-6 md:px-10 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {GLOBAL_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <stat.icon className="w-5 h-5 text-[#F7B600] mb-2" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-[10px] text-white/50 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
