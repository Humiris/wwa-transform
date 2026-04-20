"use client";

import React from "react";
import { ArrowLeft, Check, X, Minus } from "lucide-react";
import { ProductItem, productItems } from "@/lib/cards";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CardComparisonProps {
  cardIds: string[];
  title: string;
  onBack: () => void;
  onSelectCard?: (cardIds: string[], title: string) => void;
}

// TEMPLATE NOTE: the TIER_FEATURES data below is a placeholder shape only.
// The 20 rows ship empty so card-comparison compiles for any brand. Populate
// this array with your brand's tier benefits — three columns keyed by tier
// name (e.g. traditional/signature/infinite for fintech, or essentials/
// signature/elite for luxury, or daily/trainer/race for sportswear). Each
// row value may be `true`, `false`, `"optional"`, or a custom string.
//
// The three tier column keys are wired into the JSX later in this file as
// .traditional / .signature / .infinite — if you rename the columns, also
// rename the keys in your rows and the column headers below.
const TIER_FEATURES: Array<{
  name: string;
  traditional: boolean | string;
  signature: boolean | string;
  infinite: boolean | string;
}> = [];

const StatusCell = ({ value }: { value: boolean | string }) => {
  if (value === true) return <div className="flex justify-center"><Check className="w-4 h-4 text-green-600" /></div>;
  if (value === false) return <div className="flex justify-center"><Minus className="w-4 h-4 text-neutral-300" /></div>;
  if (value === "optional") return <span className="text-[10px] text-amber-600 font-medium">Issuer opt.</span>;
  return <span className="text-[10px] text-[var(--color-brand-primary)] font-semibold">{value}</span>;
};

export const CardComparison = ({ cardIds, title, onBack, onSelectCard }: CardComparisonProps) => {
  const cards = cardIds.map(id => productItems.find(c => c.id === id)!).filter(Boolean);
  const isTierComparison = title.toLowerCase().includes("traditional") || title.toLowerCase().includes("tier");

  // ===== TIER COMPARISON =====
  if (isTierComparison) {
    return (
      <div className="flex-1 h-full bg-white flex flex-col text-neutral-900 overflow-y-auto animate-in fade-in duration-300">
        <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
          <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-800">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        <div className="px-4 py-8 md:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-brand-primary)]/50 mb-2">Comparison</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Product Tiers</h1>
            <p className="text-sm text-neutral-500 mt-2">Compare benefits across Traditional, Signature, and Infinite.</p>
          </motion.div>

          {/* Sticky header */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b-2 border-[var(--color-brand-primary)]/10">
                  <th className="text-left py-3 pr-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider w-[40%]">Benefit</th>
                  <th className="text-center py-3 px-2 w-[20%]">
                    <div className="rounded-xl bg-neutral-50 p-3">
                      <p className="text-xs font-bold text-neutral-900">Traditional</p>
                      <p className="text-[10px] text-neutral-400">6 benefits</p>
                    </div>
                  </th>
                  <th className="text-center py-3 px-2 w-[20%]">
                    <div className="rounded-xl bg-[var(--color-brand-primary)]/5 p-3 border border-[var(--color-brand-primary)]/10">
                      <p className="text-xs font-bold text-[var(--color-brand-primary)]">Signature</p>
                      <p className="text-[10px] text-neutral-400">7+ benefits</p>
                    </div>
                  </th>
                  <th className="text-center py-3 px-2 w-[20%]">
                    <div className="rounded-xl bg-[var(--color-brand-primary)] p-3">
                      <p className="text-xs font-bold text-white">Infinite</p>
                      <p className="text-[10px] text-white/60">15 standard</p>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {TIER_FEATURES.map((feat, i) => (
                  <motion.tr
                    key={feat.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    className={cn("border-b border-neutral-100", i % 2 === 0 ? "bg-white" : "bg-neutral-50/50")}
                  >
                    <td className="py-2.5 pr-4 text-xs text-neutral-700">{feat.name}</td>
                    <td className="py-2.5 px-2 text-center"><StatusCell value={feat.traditional} /></td>
                    <td className="py-2.5 px-2 text-center"><StatusCell value={feat.signature} /></td>
                    <td className="py-2.5 px-2 text-center"><StatusCell value={feat.infinite} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex gap-3">
            <Button onClick={() => onSelectCard?.(productItems.filter(c => c.tier.includes("Signature")).map(c => c.id), "Standard Tier Cards")} variant="outline" className="rounded-full text-sm border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]">
              Browse Signature Cards
            </Button>
            <Button onClick={() => onSelectCard?.(productItems.filter(c => c.tier.includes("Infinite")).map(c => c.id), "Premium Tier Cards")} className="rounded-full text-sm bg-[var(--color-brand-primary)]">
              Browse Infinite Cards
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ===== CARD-BY-CARD COMPARISON (e.g., Sapphire Preferred vs Reserve) =====
  if (cards.length < 2) return null;

  const COMPARE_ROWS = [
    { label: "Annual Fee", key: "annualFee" as const },
    { label: "Card Tier", key: "tier" as const },
    { label: "Category", key: "category" as const },
    { label: "Issuer", key: "issuer" as const },
    { label: "Reward Rate", key: "rewardRate" as const },
    { label: "Sign-Up Bonus", key: "signUpBonus" as const },
    { label: "APR", key: "apr" as const },
  ];

  return (
    <div className="flex-1 h-full bg-white flex flex-col text-neutral-900 overflow-y-auto animate-in fade-in duration-300">
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
        <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-800">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      <div className="px-4 py-8 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-brand-primary)]/50 mb-2">Comparison</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">{title}</h1>
        </motion.div>

        {/* Card images header */}
        <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `180px repeat(${cards.length}, 1fr)` }}>
          <div />
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-full h-20 bg-neutral-50 rounded-xl flex items-center justify-center p-3 mb-3">
                <img src={card.image} alt={card.name} className="h-full object-contain" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">{card.name}</h3>
              <p className="text-[10px] text-neutral-400">{card.issuer}</p>
            </motion.div>
          ))}
        </div>

        {/* Comparison rows */}
        <div className="border-t border-neutral-200">
          {COMPARE_ROWS.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={cn("grid gap-4 py-3 border-b border-neutral-100", i % 2 === 0 ? "bg-white" : "bg-neutral-50/50")}
              style={{ gridTemplateColumns: `180px repeat(${cards.length}, 1fr)` }}
            >
              <div className="text-xs font-medium text-neutral-500 flex items-center px-2">{row.label}</div>
              {cards.map(card => {
                const val = card[row.key];
                return (
                  <div key={card.id} className="text-sm font-semibold text-neutral-900 text-center flex items-center justify-center">
                    {val || <Minus className="w-4 h-4 text-neutral-300" />}
                  </div>
                );
              })}
            </motion.div>
          ))}
        </div>

        {/* Highlights comparison */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Key Highlights</h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cards.length}, 1fr)` }}>
            {cards.map((card, ci) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + ci * 0.1 }}
                className="rounded-2xl border border-neutral-200 p-4 space-y-3"
              >
                <h4 className="text-sm font-semibold text-[var(--color-brand-primary)]">{card.name}</h4>
                <ul className="space-y-2">
                  {card.features.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-neutral-600">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                      {h}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
