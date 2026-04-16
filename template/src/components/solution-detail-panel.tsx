"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ArrowLeft,
  Zap,
  Shield,
  Globe,
  Cpu,
  CreditCard,
  Smartphone,
  Send,
  Building2,
  Code,
  Plane,
} from "lucide-react";
import { Solution, solutions } from "@/lib/solutions";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  CreditCard, Smartphone, Send, Shield, Building2, Code, Plane,
};

interface SolutionDetailPanelProps {
  solution: Solution;
  onBack?: () => void;
  onSolutionClick?: (solutionId: string) => void;
  onNavPage?: (page: string) => void;
  onBookDemo?: () => void;
}

export const SolutionDetailPanel = ({ solution, onBack, onSolutionClick, onNavPage, onBookDemo }: SolutionDetailPanelProps) => {
  const IconComp = iconMap[solution.icon] || CreditCard;

  return (
    <div className="flex-1 h-full bg-[#f5f5f7] flex flex-col text-neutral-900 overflow-y-auto animate-in fade-in duration-500">
      {onBack && (
        <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-neutral-500 transition hover:text-neutral-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Solutions</span>
          </button>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative min-h-[350px] md:min-h-[450px] overflow-hidden">
        <img
          src={solution.image}
          alt={solution.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1F71]/90 via-[#1A1F71]/40 to-transparent" />
        <div className="relative z-10 px-6 py-16 md:px-12 md:py-24 flex flex-col justify-end min-h-[350px] md:min-h-[450px]">
          <div className="max-w-4xl mx-auto text-center text-white space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">{solution.category}</p>
            <h1 className="text-3xl md:text-5xl font-semibold leading-tight drop-shadow-lg">{solution.name}</h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto drop-shadow">{solution.tagline}</p>
          </div>
        </div>
      </div>

      <div className="space-y-12 px-6 py-10 md:px-12 md:py-12">
        {/* Description */}
        <section className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900 md:text-3xl">Overview</h2>
          <p className="text-base leading-relaxed text-neutral-600 md:text-lg">{solution.description}</p>
        </section>

        {/* Specs */}
        {solution.specs && Array.isArray(solution.specs) && solution.specs.length > 0 && (
          <section className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-semibold text-neutral-900 md:text-3xl">Key Specs</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {solution.specs.map((spec, i) => (
                <div key={i} className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">{spec.label}</p>
                  <p className="text-sm font-medium text-neutral-800">{spec.value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Features */}
        <section className="max-w-4xl mx-auto space-y-6 border-t border-neutral-200 pt-12">
          <h2 className="text-2xl font-semibold text-neutral-900 md:text-3xl">Key Features</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {solution.features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1F71]/10">
                  <Zap className="h-5 w-5 text-[#1A1F71]" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-neutral-800 md:text-base">{feature.title}</p>
                  <p className="text-sm text-neutral-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Compare Section */}
        <section className="max-w-4xl mx-auto space-y-10 border-t border-neutral-200 pt-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-semibold text-neutral-900 md:text-4xl">Explore more solutions.</h2>
            <p className="text-sm text-neutral-500">Find the right Brand solution for your needs.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {solutions
              .filter((s) => s.id !== solution.id)
              .slice(0, 3)
              .map((s) => (
                  <button key={s.id} onClick={() => onSolutionClick?.(s.id)} className="space-y-4 rounded-3xl border border-neutral-200 bg-white overflow-hidden text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group">
                    <div className="h-36 overflow-hidden">
                      <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="space-y-1 p-4 pt-0">
                      <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-[#1A1F71]">{s.name}</h3>
                      <p className="text-xs text-neutral-500">{s.tagline}</p>
                    </div>
                  </button>
              ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto border-t border-neutral-200 pb-8 pt-12">
          <div className="rounded-3xl border border-neutral-200 bg-gradient-to-r from-[#eef0ff] to-[#fffdf5] p-6 shadow-sm md:p-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-neutral-900 md:text-3xl">Ready to get started?</h3>
                <p className="text-sm text-neutral-500 md:text-base">
                  Contact Us to learn how {solution.name} can transform your payments experience.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => onBookDemo?.()}
                    className="rounded-full bg-[#1A1F71] px-6 py-5 text-base font-semibold text-white transition hover:bg-[#141963] hover:shadow md:px-8 md:py-6"
                  >
                    Book a Demo
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => onNavPage?.("developer")}
                    className="rounded-full border border-transparent px-6 py-5 text-base font-semibold text-[#1A1F71] transition hover:border-[#1A1F71]/20 hover:bg-[#1A1F71]/10 md:px-8 md:py-6"
                  >
                    Talk to an Expert
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
