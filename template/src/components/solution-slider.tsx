"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { cn } from "@/lib/utils";
import { solutions } from "@/lib/solutions";
import { CreditCard, Smartphone, Send, Shield, Building2, Code, Plane } from "lucide-react";

const infiniteSolutions = [...solutions, ...solutions, ...solutions, ...solutions];

const iconMap: Record<string, React.ElementType> = {
  CreditCard, Smartphone, Send, Shield, Building2, Code, Plane,
};

interface SolutionSliderProps {
  onSelect: (id: string) => void;
}

export const SolutionSlider = ({ onSelect }: SolutionSliderProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimationControls();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startAnimation = async () => {
      await controls.start({
        x: [0, -1500],
        transition: {
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 40,
            ease: "linear",
          },
        },
      });
    };

    if (!isHovered) {
      startAnimation();
    } else {
      controls.stop();
    }
  }, [isHovered, controls]);

  return (
    <div className="relative w-full overflow-hidden bg-white py-12">
      <div
        className="flex overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          ref={containerRef}
          className="flex gap-6 px-8 md:gap-10 md:px-12"
          animate={controls}
          style={{ width: "fit-content" }}
        >
          {infiniteSolutions.map((solution, index) => (
              <div
                key={`${solution.id}-${index}`}
                onClick={() => onSelect(solution.id)}
                className="group flex-shrink-0 cursor-pointer space-y-6"
              >
                <div
                  className={cn(
                    "relative flex h-[460px] w-[320px] items-center justify-center overflow-hidden rounded-[38px] border border-neutral-200 bg-white transition-transform duration-500 md:h-[520px] md:w-[360px]",
                    "group-hover:-translate-y-3 group-hover:border-neutral-300"
                  )}
                >
                  <img
                    src={solution.image}
                    alt={solution.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-x-5 bottom-5 rounded-3xl bg-white/95 backdrop-blur-sm px-7 py-6 text-left ring-1 ring-neutral-200">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-primary)]/50">
                      {solution.category}
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold text-neutral-900">
                      {solution.name}
                    </h3>
                  </div>
                </div>
              </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
