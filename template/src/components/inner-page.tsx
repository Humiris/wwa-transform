"use client";

import React from "react";
import { ArrowLeft, CreditCard, Shield, Globe, Zap, Code, Building2, Plane, ChevronRight, Lock, Smartphone, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { productItems } from "@/lib/cards";
import { solutions } from "@/lib/solutions";
import { motion } from "framer-motion";

export type NavPage = string;

interface InnerPageProps {
  page: NavPage;
  onBack: () => void;
  onCardClick?: (cardIds: string[], title: string) => void;
  onSolutionClick?: (solutionId: string) => void;
}

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}>{children}</motion.div>
);

// ========== PERSONAL ==========
const PersonalPage = ({ onCardClick }: { onCardClick?: InnerPageProps["onCardClick"] }) => (
  <div className="space-y-12 px-6 py-10 md:px-12">
    <FadeIn>
      <div className="relative rounded-3xl overflow-hidden h-64 md:h-80">
        <img src="/images/gift-cards.jpg" alt="Products" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brand-primary)]/80 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Personal</p>
          <h1 className="text-3xl md:text-4xl font-semibold">Make moves that matter</h1>
          <p className="text-white/70 mt-2 max-w-md">Brand is more than just the easiest way to pay. Get special benefits simply for being a cardholder.</p>
        </div>
      </div>
    </FadeIn>

    <FadeIn delay={0.1}>
      <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Find your card</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Credit Cards", ids: productItems.map(c => c.id), color: "from-[var(--color-brand-primary)] to-[var(--color-brand-accent)]", icon: CreditCard },
          { label: "Travel Cards", ids: productItems.filter(c => c.category === "Travel").map(c => c.id), color: "from-blue-500 to-indigo-600", icon: Plane },
          { label: "Cash Back", ids: productItems.filter(c => c.category === "Cash Back").map(c => c.id), color: "from-green-500 to-emerald-600", icon: Zap },
          { label: "Business", ids: productItems.filter(c => c.category === "Business").map(c => c.id), color: "from-purple-500 to-violet-600", icon: Building2 },
          { label: "No Annual Fee", ids: productItems.filter(c => c.annualFee === "$0").map(c => c.id), color: "from-teal-500 to-cyan-600", icon: Shield },
          { label: "Secured", ids: productItems.filter(c => c.category === "Secured").map(c => c.id), color: "from-orange-500 to-amber-600", icon: Lock },
        ].map(cat => (
          <button key={cat.label} onClick={() => onCardClick?.(cat.ids, cat.label)} className="group rounded-2xl overflow-hidden relative h-28 text-left hover:shadow-lg hover:-translate-y-1 transition-all">
            <div className={`absolute inset-0 bg-gradient-to-br ${cat.color}`} />
            <div className="relative z-10 p-4 flex flex-col justify-between h-full text-white">
              <cat.icon className="w-5 h-5 text-white/70" />
              <div>
                <p className="text-sm font-semibold">{cat.label}</p>
                <p className="text-[10px] text-white/60">{cat.ids.length} card{cat.ids.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </FadeIn>

    <FadeIn delay={0.2}>
      <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Card tiers</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { name: "Basic Tier", desc: "Essential features: Zero Liability, emergency card replacement, roadside dispatch, lost/stolen reporting.", benefits: "6 core benefits" },
          { name: "Standard Tier", desc: "Enhanced perks: travel emergency assistance, optional CDW, extended warranty, trip delay coverage up to $300.", benefits: "7+ standard + optional" },
          { name: "Premium Tier", desc: "Premium tier: all 15 benefits standard including $500 trip delay, purchase security, return protection.", benefits: "15 standard benefits" },
        ].map((tier, i) => (
          <button key={tier.name} onClick={() => {
            const tierKey = tier.name.toLowerCase().replace("visa ", "");
            const cards = productItems.filter(c => c.tier.toLowerCase().includes(tierKey));
            onCardClick?.(cards.length > 0 ? cards.map(c => c.id) : productItems.map(c => c.id), `${tier.name} Cards`);
          }} className="rounded-2xl border border-neutral-200 bg-white p-5 text-left hover:shadow-md hover:border-[var(--color-brand-primary)]/20 hover:-translate-y-1 transition-all group">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)]/50 mb-1">{tier.benefits}</p>
            <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-[var(--color-brand-primary)] mb-2">{tier.name}</h3>
            <p className="text-xs text-neutral-500">{tier.desc}</p>
          </button>
        ))}
      </div>
    </FadeIn>
  </div>
);

// ========== BUSINESS ==========
const BusinessPage = ({ onSolutionClick }: { onSolutionClick?: InnerPageProps["onSolutionClick"] }) => (
  <div className="space-y-12 px-6 py-10 md:px-12">
    <FadeIn>
      <div className="relative rounded-3xl overflow-hidden h-64 md:h-80">
        <img src="/images/laptop.jpg" alt="Business" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brand-primary)]/80 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Business</p>
          <h1 className="text-3xl md:text-4xl font-semibold">Innovation that drives business</h1>
          <p className="text-white/70 mt-2 max-w-md">Discover payment solutions that streamline operations and support your growth.</p>
        </div>
      </div>
    </FadeIn>

    <FadeIn delay={0.1}>
      <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Business solutions</h2>
      <div className="grid gap-4">
        {solutions.filter(s => ["solution-a", "solution-b", "solution-c"].includes(s.id)).map(sol => (
          <button key={sol.id} onClick={() => onSolutionClick?.(sol.id)} className="flex gap-5 rounded-2xl border border-neutral-200 bg-white p-5 text-left hover:shadow-md hover:border-[var(--color-brand-primary)]/20 transition-all group">
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0">
              <img src={sol.image} alt={sol.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-neutral-900 group-hover:text-[var(--color-brand-primary)]">{sol.name}</h3>
              <p className="text-xs text-neutral-500 mt-1">{sol.tagline}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-[var(--color-brand-primary)] mt-1" />
          </button>
        ))}
      </div>
    </FadeIn>

    <FadeIn delay={0.2}>
      <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Key capabilities</h2>
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Send, title: "Real-time payments", desc: "Solution A: push payments to 7B+ endpoints in 200+ countries" },
          { icon: Shield, title: "Fraud prevention", desc: "AI-powered detection analyzing 500+ risk attributes per transaction" },
          { icon: Globe, title: "Cross-border", desc: "B2B Connect: bank-to-bank without correspondent banks" },
          { icon: Code, title: "Developer APIs", desc: "REST APIs for payments, fraud detection, and fund transfers" },
        ].map(f => (
          <div key={f.title} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <f.icon className="w-5 h-5 text-[var(--color-brand-primary)] mb-3" />
            <h4 className="text-sm font-semibold text-neutral-900 mb-1">{f.title}</h4>
            <p className="text-xs text-neutral-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </FadeIn>

    <FadeIn delay={0.3}>
      <div className="rounded-3xl overflow-hidden border border-neutral-200 bg-gradient-to-r from-[#0d1147] to-[var(--color-brand-primary)] p-6 md:p-8">
        <div className="flex gap-5 items-start">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-white/10">
            <img src="/images/agentic-commerce.jpg" alt="Agentic Commerce" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-[var(--color-brand-secondary)] font-bold">New</span>
            <h3 className="text-lg font-semibold text-white">Agentic Commerce</h3>
            <p className="text-xs text-white/60">When AI becomes the customer. Brand is building the infrastructure for autonomous AI agent transactions with the Trusted Agent Protocol and MCP Server for Intelligent Commerce.</p>
            <button onClick={() => onSolutionClick?.("agentic-commerce")} className="text-xs font-semibold text-[var(--color-brand-secondary)] hover:text-white transition-colors flex items-center gap-1">
              Book a demo <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </FadeIn>
  </div>
);

// ========== TRAVEL ==========
const TravelPage = ({ onCardClick }: { onCardClick?: InnerPageProps["onCardClick"] }) => (
  <div className="space-y-12 px-6 py-10 md:px-12">
    <FadeIn>
      <div className="relative rounded-3xl overflow-hidden h-64 md:h-80">
        <img src="/images/traveler-boat.jpg" alt="Travel" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brand-primary)]/80 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Travel</p>
          <h1 className="text-3xl md:text-4xl font-semibold">Travel with confidence</h1>
          <p className="text-white/70 mt-2 max-w-md">Be the world traveler you want to be with Brand protection worldwide.</p>
        </div>
      </div>
    </FadeIn>

    <FadeIn delay={0.1}>
      <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Emergency services</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { title: "Card Replacement", desc: "24-72 hours globally", icon: CreditCard },
          { title: "Cash Disbursement", desc: "Emergency funds near you", icon: Zap },
          { title: "Medical Referral", desc: "24/7/365 assistance", icon: Users },
          { title: "Translation Service", desc: "Multilingual support", icon: Globe },
          { title: "Ticket Replacement", desc: "Emergency rebooking", icon: Plane },
          { title: "Luggage Locator", desc: "Track lost bags", icon: Shield },
        ].map(s => (
          <div key={s.title} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <s.icon className="w-5 h-5 text-[var(--color-brand-primary)] mb-2" />
            <h4 className="text-sm font-semibold text-neutral-900">{s.title}</h4>
            <p className="text-xs text-neutral-500">{s.desc}</p>
          </div>
        ))}
      </div>
    </FadeIn>

    <FadeIn delay={0.2}>
      <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Travel cards</h2>
      <Button onClick={() => onCardClick?.(productItems.filter(c => c.category === "Travel").map(c => c.id), "Travel Cards")} className="rounded-full bg-[var(--color-brand-primary)] text-white px-6 py-5">
        Browse Travel Cards <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </FadeIn>

    <FadeIn delay={0.3}>
      <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Travel checklist</h2>
      <div className="space-y-2">
        {[
          "Notify your bank before traveling abroad",
          "Access cash at 2M+ ATM locations worldwide",
          "Pay in local currency to avoid conversion markups",
          "Sign up for mobile purchase alerts",
          "Memorize your PIN before departing",
          "Keep copies of all card numbers",
        ].map((tip, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl bg-white border border-neutral-200 p-3">
            <div className="w-6 h-6 rounded-full bg-[var(--color-brand-primary)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-[var(--color-brand-primary)]">{i + 1}</span>
            </div>
            <p className="text-sm text-neutral-700">{tip}</p>
          </div>
        ))}
      </div>
    </FadeIn>
  </div>
);

// ========== SECURITY ==========
const SecurityPage = ({ onSolutionClick }: { onSolutionClick?: InnerPageProps["onSolutionClick"] }) => (
  <div className="space-y-12 px-6 py-10 md:px-12">
    <FadeIn>
      <div className="relative rounded-3xl overflow-hidden h-64 md:h-80">
        <img src="/images/security-phones.jpg" alt="Security" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brand-primary)]/80 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Security</p>
          <h1 className="text-3xl md:text-4xl font-semibold">Every tap protected</h1>
          <p className="text-white/70 mt-2 max-w-md">From online shopping to in-store, Brand protects every swipe, click or tap.</p>
        </div>
      </div>
    </FadeIn>

    <FadeIn delay={0.1}>
      <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Security features</h2>
      <div className="grid gap-4">
        {[
          { icon: Shield, title: "Zero Liability", desc: "You won't be held responsible for unauthorized charges. Funds replaced within 5 business days." },
          { icon: Lock, title: "Solution B", desc: "Replaces card numbers with unique tokens for secure digital payments.", action: () => onSolutionClick?.("solution-c") },
          { icon: Smartphone, title: "Purchase Alerts", desc: "Real-time notifications for transactions, thresholds, international purchases, and declines." },
          { icon: Globe, title: "Solution D", desc: "Tokenized online checkout — no card details entered at merchant sites.", action: () => onSolutionClick?.("click-to-pay") },
        ].map(f => (
          <button key={f.title} onClick={f.action} className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 text-left hover:shadow-md hover:border-[var(--color-brand-primary)]/20 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-primary)]/10 flex items-center justify-center flex-shrink-0">
              <f.icon className="w-5 h-5 text-[var(--color-brand-primary)]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 group-hover:text-[var(--color-brand-primary)]">{f.title}</h4>
              <p className="text-xs text-neutral-500 mt-1">{f.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </FadeIn>
  </div>
);

// ========== DEVELOPER ==========
const DeveloperPage = ({ onSolutionClick }: { onSolutionClick?: InnerPageProps["onSolutionClick"] }) => (
  <div className="space-y-12 px-6 py-10 md:px-12">
    <FadeIn>
      <div className="relative rounded-3xl overflow-hidden h-64 md:h-80">
        <img src="/images/dev-hero.png" alt="Developer" className="w-full h-full object-cover bg-neutral-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Developer</p>
          <h1 className="text-3xl md:text-4xl font-semibold">Build with Brand APIs</h1>
          <p className="text-white/70 mt-2 max-w-md">Access the world's largest payment network through powerful REST APIs.</p>
        </div>
      </div>
    </FadeIn>

    <FadeIn delay={0.1}>
      <h2 className="text-2xl font-semibold text-neutral-900 mb-4">API products</h2>
      <div className="grid gap-4">
        {[
          { title: "Payment APIs", desc: "Process payments, manage transactions, handle refunds", icon: CreditCard },
          { title: "Solution A API", desc: "Push payments to cards and accounts in real-time", icon: Send },
          { title: "Cybersource", desc: "AI-powered fraud detection with Decision Manager", icon: Shield },
          { title: "Token Service", desc: "Replace card numbers with secure digital tokens", icon: Lock },
        ].map(api => (
          <div key={api.title} className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-primary)]/10 flex items-center justify-center flex-shrink-0">
              <api.icon className="w-5 h-5 text-[var(--color-brand-primary)]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-900">{api.title}</h4>
              <p className="text-xs text-neutral-500 mt-1">{api.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </FadeIn>

    <FadeIn delay={0.2}>
      <div className="rounded-2xl bg-neutral-900 p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Quick start</h3>
        <p className="text-sm text-neutral-400 mb-4">65,000+ transactions per second capacity. Full sandbox with test credentials.</p>
        <Button onClick={() => onSolutionClick?.("developer")} className="rounded-full bg-white text-neutral-900 hover:bg-neutral-100 px-6">
          Explore Platform <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </FadeIn>
  </div>
);

// ========== ABOUT ==========
const AboutPage = () => (
  <div className="space-y-12 px-6 py-10 md:px-12">
    <FadeIn>
      <div className="relative rounded-3xl overflow-hidden h-64 md:h-80">
        <img src="/images/business-owner.jpg" alt="About Us" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brand-primary)]/80 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <p className="text-xs uppercase tracking-widest text-white/60 mb-2">About</p>
          <h1 className="text-3xl md:text-4xl font-semibold">About Us</h1>
          <p className="text-white/70 mt-2">Everywhere you want to be.</p>
        </div>
      </div>
    </FadeIn>
    <FadeIn delay={0.1}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: "4B+", label: "Cards worldwide" },
          { value: "200+", label: "Countries" },
          { value: "150M+", label: "Merchants" },
          { value: "180", label: "Currencies" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-[var(--color-brand-primary)] p-5 text-center text-white">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-white/60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </FadeIn>
  </div>
);

// ========== MAIN COMPONENT ==========
export const InnerPage = ({ page, onBack, onCardClick, onSolutionClick }: InnerPageProps) => {
  const titles: Record<NavPage, string> = {
    personal: "Personal", business: "Business", travel: "Travel",
    security: "Security", developer: "Developer", about: "About Us", partner: "Partner",
  };

  return (
    <div className="flex-1 h-full bg-[#f5f5f7] flex flex-col text-neutral-900 overflow-y-auto animate-in fade-in duration-300">
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
        <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-800">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </button>
      </div>
      {page === "personal" && <PersonalPage onCardClick={onCardClick} />}
      {page === "business" && <BusinessPage onSolutionClick={onSolutionClick} />}
      {page === "travel" && <TravelPage onCardClick={onCardClick} />}
      {page === "security" && <SecurityPage onSolutionClick={onSolutionClick} />}
      {page === "developer" && <DeveloperPage onSolutionClick={onSolutionClick} />}
      {page === "about" && <AboutPage />}
      {page === "partner" && <AboutPage />}
    </div>
  );
};
