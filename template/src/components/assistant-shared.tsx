"use client";

import React from "react";
import { ChevronDown, Loader2, CreditCard, Smartphone, Send, Shield, Building2, Code, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { solutions, Solution } from "@/lib/solutions";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  CreditCard, Smartphone, Send, Shield, Building2, Code, Plane,
};

export const getFallbackResponse = (prompt: string) => {
  const lower = prompt.toLowerCase();

  // Card tier questions
  if (lower.includes("traditional") && (lower.includes("card") || lower.includes("tier") || lower.includes("benefit"))) {
    return "Basic Tier is the essential credit card tier. It includes Zero Liability protection, emergency card replacement within 24-72 hours globally, emergency cash disbursement, 24/7 roadside dispatch, and lost/stolen card reporting. It may also offer rewards like cash back and points depending on your issuer.";
  }

  if (lower.includes("signature") && (lower.includes("card") || lower.includes("tier") || lower.includes("benefit"))) {
    return "Standard Tier offers enhanced benefits beyond Traditional: 24/7/365 travel emergency assistance in multiple languages, plus optional benefits your issuer may include like Auto Rental CDW, extended warranty, trip delay reimbursement up to $300, Global Entry credit of $120, baggage delay coverage, cellphone protection, and purchase security. Chase Sapphire Preferred is a popular Standard Tier card.";
  }

  if (lower.includes("infinite") && (lower.includes("card") || lower.includes("tier") || lower.includes("benefit"))) {
    return "Premium Tier is the highest tier with the most extensive benefits. All 15 standard benefits are included (not optional): Auto Rental CDW, extended warranty, purchase security for 90 days, return protection, lost luggage reimbursement, travel accident insurance, and trip delay reimbursement up to $500 for delays of 6+ hours. The Chase Sapphire Reserve is a top Premium Tier card.";
  }

  if (lower.includes("compare") && lower.includes("tier")) {
    return "Brand has three credit card tiers. Traditional has 6 core benefits including Zero Liability. Signature adds travel emergency assistance plus optional perks like CDW and trip delay ($300). Infinite includes all 15 benefits as standard, with higher trip delay coverage ($500 for 6+ hours vs $300 for 12+ hours on Signature). The higher the tier, the richer the benefits.";
  }

  // Product questions
  if (lower.includes("click to pay") || lower.includes("click-to-pay")) {
    return "Solution D is like contactless payments, but online. No need to enter card details at checkout. Just see the Solution D icon, verify your identity via email or phone, and complete checkout with your selected card. It works with Brand, Mastercard, Discover, and American Express.";
  }

  if (lower.includes("purchase alert") || lower.includes("transaction alert")) {
    return "Brand provides real-time notifications and alerts for your account activity.";
  }

  if (lower.includes("zero liability")) {
    return "Brand's Zero Liability Policy guarantees you won't be held responsible for unauthorized charges made with your Brand card. Your issuer must replace funds within 5 business days of notification. It covers most credit and debit cards with no enrollment required.";
  }

  if (lower.includes("atm") || lower.includes("cash") && lower.includes("travel")) {
    return "Brand provides global access and support across multiple markets and regions.";
  }

  if (lower.includes("debit")) {
    return "Debit cards let you make purchases and transfer funds in real-time (within minutes, vs 2-3+ business days for ACH). Use your 16-digit card number for online shopping, PIN or signature in-store. You also get Zero Liability protection and can send/receive money through apps with no Brand fee.";
  }

  if (lower.includes("prepaid")) {
    return "Prepaid cards provide easy access to your money without needing a bank account or credit check. Options include general prepaid, reloadable, payroll, and government payment cards. Load via direct deposit, ATM, bank branch, or mobile check deposit. Most include Zero Liability protection.";
  }

  if (lower.includes("travel") && (lower.includes("card") || lower.includes("credit"))) {
    return "Here are our top travel credit cards. The Chase Sapphire Preferred offers 2X points on travel and dining with a $95 annual fee. For premium travelers, the Chase Sapphire Reserve includes Priority Pass lounge access and a $300 travel credit. Southwest cards are great for earning Companion Pass.";
  }

  if (lower.includes("no annual fee") || lower.includes("no fee") || lower.includes("$0")) {
    return "Looking for cards with no annual fee? The Chase Freedom Unlimited offers 1.5% cash back on everything with $0 annual fee. The Chase Freedom Rise is also fee-free and great for building credit. The Ink Business Unlimited gives business owners 1.5% back with no annual fee.";
  }

  if (lower.includes("compare") && lower.includes("sapphire")) {
    return "Great comparison! The Sapphire Preferred ($95/yr) gives 2X on travel and dining with 60K bonus points. The Sapphire Reserve ($550/yr) upgrades to 3X on travel and dining, adds Priority Pass lounge access, a $300 travel credit, and Global Entry credit. The Reserve pays for itself if you travel frequently.";
  }

  if (lower.includes("business") && (lower.includes("card") || lower.includes("credit"))) {
    return "For business cards, the Ink Business Unlimited offers 1.5% cash back on every purchase with $0 annual fee and free employee cards. The Ramp Business Card is great for expense management with built-in controls and analytics.";
  }

  if (lower.includes("card") || lower.includes("credit") || lower.includes("debit")) {
    if (lower.includes("infinite") || lower.includes("premium")) {
      return "Premium Tier is our top-tier card offering premium benefits: 24/7 concierge, luxury hotel programs, comprehensive travel insurance, and purchase protection. The Chase Sapphire Reserve is one of the most popular Premium Tier cards.";
    }
    if (lower.includes("secured") || lower.includes("build credit")) {
      return "For building or rebuilding credit, the Self Brand Secured Card reports to all 3 bureaus with no hard credit check to apply. The Chase Freedom Rise is another great option with 1.5% cash back and $0 annual fee.";
    }
    return "Brand offers solutions for every need. What are you looking for?";
  }

  if (lower.includes("contactless") || lower.includes("tap")) {
    return "Brand enables fast, secure transactions with modern technology.";
  }

  if (lower.includes("send") || lower.includes("transfer") || lower.includes("direct")) {
    return "Solution A enables near real-time push payments to cards, accounts, and wallets worldwide. With 7+ billion endpoints across 200+ countries, it powers person-to-person transfers, business disbursements, and gig economy payouts.";
  }

  if (lower.includes("security") || lower.includes("fraud") || lower.includes("token")) {
    return "Solution B replaces sensitive card data with unique digital tokens, cutting fraud for e-commerce and mobile payments. Combined with Brand Advanced Authorization analyzing 500+ risk attributes per transaction, we help prevent billions in fraud annually.";
  }

  if (lower.includes("developer") || lower.includes("api")) {
    return "The Developer Platform offers REST APIs for payment processing, Solution A push payments, and Cybersource fraud detection. Start with our full sandbox environment for rapid prototyping at developer.example.com.";
  }

  if (lower.includes("travel")) {
    return "Brand provides comprehensive support for international operations and transactions.";
  }

  return "I can help you find the right Brand card, explore payment solutions, learn about security features, or access developer APIs. What are you looking for?";
};

export const formatSteps = (url?: string | null) => [
  "Analyzing your request...",
  url ? `Reviewing ${url}...` : "Exploring Brand solutions...",
  "Matching solutions to your needs...",
  "Preparing recommendation...",
];

export const EmptyState = ({ onOpen }: { onOpen: () => void }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
    <div className="relative">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full bg-[#1A1F71]/20"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
        />
      ))}
      <button
        onClick={onOpen}
        className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-white shadow-xl transition-transform hover:scale-105 active:scale-95 z-10"
      >
        <span className="absolute inset-0 rounded-full bg-[#1A1F71]/5 blur-xl" />
        <div className="relative flex items-center justify-center text-[#1A1F71] w-10 h-10 md:w-12 md:h-12">
          <svg viewBox="0 0 1000 324" fill="currentColor" className="w-full h-full">
            <path d="M 413.58 1.58 L 311.01 322.38 L 255.72 322.38 L 204.73 52.56 C 201.87 39.32 199.37 34.53 189.23 29.02 C 172.72 20.14 145.51 11.83 121.62 6.61 L 122.88 1.58 L 223.3 1.58 C 236.26 1.58 247.77 10.17 250.76 25.14 L 276.07 160.11 L 330.8 1.58 L 413.58 1.58 Z M 748.96 217.49 C 749.29 127.03 625.29 122.14 626.17 81.29 C 626.44 69.58 637.55 57.12 661.8 54.01 C 673.83 52.48 706.34 51.24 743.31 68.19 L 758.1 6.04 C 738.25 -0.89 713.13 -7.55 682.53 -7.55 C 604.54 -7.55 550.03 33.42 549.6 92.89 C 549.1 137.67 589.48 162.53 620.15 177.35 C 651.79 192.51 662.39 202.21 662.26 215.66 C 662.01 236.1 637.94 245.17 615.46 245.52 C 574.53 246.13 550.77 234.6 531.59 225.85 L 516.37 289.99 C 535.69 298.63 572.68 306.11 611.08 306.46 C 694.12 306.46 748.71 266.03 748.96 217.49 Z M 891.33 322.38 L 963.17 322.38 L 900.24 1.58 L 835.6 1.58 C 824.11 1.58 814.42 8.78 810.29 19.2 L 693.87 322.38 L 776.85 322.38 L 793.32 275.67 L 894.17 275.67 L 891.33 322.38 Z M 814.62 213.62 L 856.32 99.29 L 880.55 213.62 L 814.62 213.62 Z M 514.7 1.58 L 449.94 322.38 L 371.08 322.38 L 435.88 1.58 L 514.7 1.58 Z" />
          </svg>
        </div>
      </button>
    </div>
    <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">How can Brand help you?</h2>
    <p className="max-w-xs text-sm text-neutral-500">
      Ask about payment solutions, card benefits, security features, or developer APIs.
    </p>
  </div>
);

export const RecommendationCard = ({ solution, onLearnMore }: { solution: Solution; onLearnMore: (id: string) => void }) => {
  return (
    <div className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white shadow-lg">
      <div className="h-40 overflow-hidden rounded-t-3xl">
        <img src={solution.image} alt={solution.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-6 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">{solution.name}</h3>
          <p className="text-sm text-neutral-500">{solution.tagline}</p>
        </div>
        <div className="space-y-2">
          <Button
            onClick={() => onLearnMore(solution.id)}
            className="w-full rounded-full bg-[#1A1F71] hover:bg-[#141963]"
          >
            Explore Solution
          </Button>
        </div>
      </div>
    </div>
  );
};

export const CatalogGrid = ({ ids, onLearnMore }: { ids: string[]; onLearnMore: (id: string) => void }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {ids.map((id) => {
      const solution = solutions.find((s) => s.id === id);
      if (!solution) return null;
      return (
        <button
          key={solution.id}
          onClick={() => onLearnMore(solution.id)}
          className="rounded-2xl border border-neutral-200 bg-white text-left shadow-sm transition hover:shadow-md"
        >
          <div className="h-32 overflow-hidden rounded-t-2xl">
            <img src={solution.image} alt={solution.name} className="w-full h-full object-cover" />
          </div>
          <div className="p-4 space-y-1.5">
            <h4 className="text-base font-semibold text-neutral-900">{solution.name}</h4>
            <p className="text-xs text-neutral-500 line-clamp-1">{solution.tagline}</p>
          </div>
        </button>
      );
    })}
  </div>
);

export const ThinkingPanel = ({ steps }: { steps: string[] }) => (
  <div className="max-w-[85%] rounded-3xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-neutral-400">
      <span>Thinking</span>
      <ChevronDown className="h-4 w-4" />
    </div>
    <ul className="mt-4 space-y-3 text-sm text-neutral-600">
      {steps.map((step, index) => (
        <li key={step + index} className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[#1A1F71] shadow-[0_0_8px_rgba(26,31,113,0.4)]" />
          {step}
        </li>
      ))}
      {steps.length < 4 && (
        <li className="flex items-center gap-3 text-neutral-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </li>
      )}
    </ul>
  </div>
);
