"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, ChevronDown, CreditCard, Shield, Globe, Zap, Smartphone, Lock, ArrowLeftRight } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { solutions, Solution } from "@/lib/solutions";

interface HeroSectionProps {
  state: 1 | 2 | 3 | 4;
  onSelect?: (solution: Solution) => void;
  onFindCard?: () => void;
  onTierClick?: (tier: string) => void;
  onBookDemo?: () => void;
}

const heroSolutions = solutions.length > 0 ? solutions.slice(0, 6) : [];

const STATS = [
  { value: "200+", label: "Countries & territories" },
  { value: "4B+", label: "Cards worldwide" },
  { value: "100M+", label: "Merchant locations" },
  { value: "65K+", label: "Transactions/second" },
];

const CARD_TIERS = [
  { name: "Basic Tier", desc: "Essential features and everyday rewards", icon: CreditCard },
  { name: "Standard Tier", desc: "Enhanced benefits and premium perks", icon: Shield },
  { name: "Premium Tier", desc: "The most extensive luxury benefits", icon: Globe },
];

export const HeroSection = ({ onSelect, onFindCard, onTierClick, onBookDemo }: HeroSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const current = heroSolutions[currentIndex] || { id: "", name: "Welcome", tagline: "Explore our solutions", category: "", icon: "", image: "", features: [], description: "" };
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });
  const tiersRef = useRef<HTMLDivElement>(null);
  const tiersInView = useInView(tiersRef, { once: true, margin: "-100px" });
  const featuresRef = useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === heroSolutions.length - 1 ? 0 : prev + 1));
    setProgress(0);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const step = 100 / (6000 / 100);
      progressInterval.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) { handleNext(); return 0; }
          return prev + step;
        });
      }, 100);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [isPlaying, handleNext]);

  const handleDotClick = (idx: number) => {
    setCurrentIndex(idx);
    setProgress(0);
    setIsPlaying(false);
  };

  return (
    <div className="bg-white">
      {/* Hero with video background */}
      <div className="relative w-full min-h-[calc(100vh-48px)] overflow-hidden flex flex-col justify-center">
        {/* Video background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            poster="/images/hero-image.jpg"
          >
            <source src="/videos/hero-montage.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>

        <div className="relative z-10 px-6 md:px-16 pt-20 md:pt-24 pb-20 max-w-6xl w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
                  className="space-y-6"
                >
                  <div>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[14px] uppercase tracking-[0.25em] font-semibold text-[#1A1F71]/60 mb-3"
                    >
                      {current.category}
                    </motion.p>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-neutral-900 leading-[1.08]">
                      {current.name}
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-500 mt-4 max-w-xl leading-relaxed">
                      {current.tagline}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={() => onBookDemo?.()}
                      className="rounded-full bg-[#1A1F71] hover:bg-[#141963] text-white text-[15px] md:text-[16px] font-semibold px-6 md:px-8 py-4 md:py-5 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#1A1F71]/20"
                    >
                      Book a Demo
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => onFindCard?.()}
                      className="rounded-full text-[#1A1F71] text-[15px] font-semibold px-6 py-4 hover:bg-[#1A1F71]/5"
                    >
                      Find a Card
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex gap-3 items-center">
                  {heroSolutions.map((_, idx) => (
                    <button key={idx} onClick={() => handleDotClick(idx)} className="group relative h-8 flex items-center justify-center">
                      <div className="w-12 h-[2px] bg-neutral-300 overflow-hidden rounded-full transition-colors group-hover:bg-neutral-400">
                        {idx === currentIndex && (
                          <motion.div className="h-full bg-[#1A1F71]" initial={{ width: "0%" }} animate={{ width: isPlaying ? `${progress}%` : "100%" }} transition={{ duration: isPlaying ? 0.1 : 0.3 }} />
                        )}
                      </div>
                      <div className="absolute inset-0 -inset-y-2 cursor-pointer" />
                    </button>
                  ))}
                </div>
                <button onClick={() => setIsPlaying(!isPlaying)} className="ml-2 w-9 h-9 rounded-full bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-100 transition-all flex items-center justify-center shadow-sm">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Hero image card */}
            <div className="relative flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, scale: 0.9, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -40 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="relative w-full max-w-[420px] md:max-w-[480px]"
                >
                  <button onClick={() => onSelect?.(current)} className="w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative group cursor-pointer text-left">
                    <img src={current.image} alt={current.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1F71]/70 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <h3 className="text-2xl font-bold drop-shadow-lg">{current.name}</h3>
                      <p className="text-white/80 text-sm mt-1 drop-shadow">{current.tagline}</p>
                    </div>
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 1, repeat: Infinity, repeatType: "reverse" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-neutral-400 z-10"
        >
          <span className="text-[10px] uppercase tracking-[0.25em] font-medium">Scroll to explore</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </div>

      {/* Stats Section - Animated counters */}
      <div ref={statsRef} className="py-16 md:py-20 bg-[#1A1F71]">
        <div className="max-w-6xl mx-auto px-6 md:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Credit Card Tiers Section */}
      <div ref={tiersRef} className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={tiersInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-4">Choose the right card for you</h2>
            <p className="text-neutral-500 max-w-2xl mx-auto">Every Brand card comes with built-in benefits. The higher your card tier, the more perks you unlock.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {CARD_TIERS.map((tier, i) => {
              const Icon = tier.icon;
              return (
                <motion.button
                  key={tier.name}
                  onClick={() => onTierClick?.(tier.name)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={tiersInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.15, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="group rounded-3xl border border-neutral-200 bg-white p-8 text-center hover:shadow-xl hover:border-[#1A1F71]/20 hover:-translate-y-2 transition-all duration-500 cursor-pointer"
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#1A1F71] to-[#1434CB] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">{tier.name}</h3>
                  <p className="text-sm text-neutral-500">{tier.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features Section with video */}
      <div ref={featuresRef} className="py-16 md:py-24 bg-[#f8f9fc]">
        <div className="max-w-6xl mx-auto px-6 md:px-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={featuresInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <div className="rounded-3xl overflow-hidden shadow-xl">
                <video autoPlay loop muted playsInline className="w-full aspect-video object-cover" poster="/images/woman-shopping.jpg">
                  <source src="/videos/traditional-card.mp4" type="video/mp4" />
                </video>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={featuresInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="space-y-8"
            >
              <div>
                <p className="text-[12px] uppercase tracking-[0.2em] font-semibold text-[#1A1F71]/60 mb-3">Why Us</p>
                <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-4">Wherever life takes you</h2>
                <p className="text-neutral-500 text-lg">Brand cards are designed to protect your purchases, simplify payments and offer peace of mind wherever you shop.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { Icon: Smartphone, title: "Convenience", desc: "Tap, swipe or dip — pay your way" },
                  { Icon: Lock, title: "Security", desc: "Lost card replaced within 1-3 days" },
                  { Icon: Globe, title: "Acceptance", desc: "Millions of merchants worldwide" },
                  { Icon: ArrowLeftRight, title: "Flexibility", desc: "Pay monthly or over time" },
                ].map((feat, i) => (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                    className="rounded-2xl border border-neutral-200 bg-white p-4 hover:shadow-md hover:border-[#1A1F71]/20 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#1A1F71]/10 flex items-center justify-center mb-3">
                      <feat.Icon className="w-5 h-5 text-[#1A1F71]" />
                    </div>
                    <h4 className="text-sm font-semibold text-neutral-900 mb-1">{feat.title}</h4>
                    <p className="text-xs text-neutral-500">{feat.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      {/* Card Showcase Video */}
      <div className="py-16 md:py-24 bg-[#1A1F71]">
        <div className="max-w-6xl mx-auto px-6 md:px-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 space-y-6">
              <p className="text-[12px] uppercase tracking-[0.2em] font-semibold text-[#F7B600] mb-3">The Brand Card</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Designed for every moment</h2>
              <p className="text-white/60 text-lg leading-relaxed">From the chip to the contactless symbol, every detail of your Brand card is engineered for security, speed, and global acceptance.</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { val: "< 1 sec", label: "Tap to pay speed" },
                  { val: "3 layers", label: "Security protection" },
                  { val: "24/7", label: "Fraud monitoring" },
                  { val: "180", label: "Currencies supported" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-lg font-bold text-white">{s.val}</p>
                    <p className="text-[10px] text-white/40">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="w-[280px] md:w-[320px] rounded-3xl overflow-hidden shadow-2xl shadow-black/30">
                <video autoPlay loop muted playsInline className="w-full h-auto">
                  <source src="/videos/credit-card-showcase.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
