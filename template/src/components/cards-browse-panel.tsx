"use client";

import React, { useState } from "react";
import { ArrowLeft, Shield, Globe, Zap, Star, CreditCard, Check, ChevronRight, User, Mail, Phone, MapPin, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ProductItem, productItems } from "@/lib/cards";
import { useUserStore } from "@/lib/user-store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type View = "browse" | "detail" | "apply" | "confirmed";

interface CardsBrowsePanelProps {
  cardIds: string[];
  onBack: () => void;
  title?: string;
  autoApply?: boolean;
}

export const CardsBrowsePanel = ({ cardIds, onBack, title, autoApply = false }: CardsBrowsePanelProps) => {
  const cards = cardIds.map((id) => productItems.find((c) => c.id === id)!).filter(Boolean);
  const { isSignedIn, profile, getDefaultAddress } = useUserStore();
  const defaultAddr = isSignedIn ? getDefaultAddress() : undefined;

  const [selectedCard, setSelectedCard] = useState<ProductItem | null>(autoApply && cards.length > 0 ? cards[0] : null);
  const [view, setView] = useState<View>(autoApply && cards.length > 0 ? "apply" : "browse");
  const [formData, setFormData] = useState({
    firstName: isSignedIn ? profile.firstName : "",
    lastName: isSignedIn ? profile.lastName : "",
    email: isSignedIn ? profile.email : "",
    phone: isSignedIn ? profile.phone : "",
    address: defaultAddr?.street || "",
    city: defaultAddr?.city || "",
    state: defaultAddr?.state || "",
    zip: defaultAddr?.zip || "",
    income: isSignedIn ? profile.income : "",
  });
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const handleSelectCard = (card: ProductItem) => {
    setSelectedCard(card);
    setView("detail");
  };

  const handleApply = () => {
    setView("apply");
  };

  const handleSubmitApplication = () => {
    setView("confirmed");
  };

  const handleBackFromDetail = () => {
    setSelectedCard(null);
    setView("browse");
  };

  const handleBackFromApply = () => {
    setView("detail");
  };

  const handleReset = () => {
    setSelectedCard(null);
    setView("browse");
    setFormData({ firstName: "", lastName: "", email: "", phone: "", address: "", city: "", state: "", zip: "", income: "" });
    setAgreedTerms(false);
  };

  // ===== CONFIRMED VIEW =====
  if (view === "confirmed" && selectedCard) {
    return (
      <div className="flex-1 h-full bg-white flex flex-col text-neutral-900 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-8"
          >
            <Check className="w-10 h-10 text-green-600" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 max-w-md"
          >
            <h1 className="text-3xl font-semibold text-neutral-900">Application Submitted!</h1>
            <p className="text-neutral-500">
              Your application for the {selectedCard.name} has been submitted for review. You&apos;ll receive a decision within 7-10 business days.
            </p>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 mt-6 space-y-3">
              <div className="flex items-center justify-center">
                <img src={selectedCard.image} alt={selectedCard.name} className="h-20 object-contain" />
              </div>
              <p className="font-semibold text-neutral-900">{selectedCard.name}</p>
              <p className="text-sm text-neutral-500">{selectedCard.tier} &bull; Annual fee: {selectedCard.annualFee}</p>
              <p className="text-xs text-neutral-400">Confirmation #{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
            </div>
            <Button onClick={handleReset} className="mt-6 rounded-full bg-[var(--color-brand-primary)] px-8 py-5 text-base">
              Browse More Cards
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ===== APPLY VIEW =====
  if (view === "apply" && selectedCard) {
    const isFormValid = formData.firstName && formData.lastName && formData.email && formData.income && agreedTerms;

    return (
      <div className="flex-1 h-full bg-[#f5f5f7] flex flex-col text-neutral-900 overflow-y-auto animate-in fade-in duration-300">
        <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between">
            <button onClick={handleBackFromApply} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-800">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Lock className="w-3.5 h-3.5" />
              Secure Application
            </div>
          </div>
        </div>

        <div className="px-6 py-8 md:px-12 space-y-8 max-w-2xl mx-auto w-full">
          {/* Card summary */}
          <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
            <img src={selectedCard.image} alt={selectedCard.name} className="w-20 h-auto object-contain" />
            <div>
              <h3 className="font-semibold text-neutral-900">{selectedCard.name}</h3>
              <p className="text-xs text-neutral-500">{selectedCard.tier} &bull; {selectedCard.annualFee}/yr</p>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Apply for this card</h1>
            <p className="text-sm text-neutral-500">Fill in your details to submit your application.</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-600">First Name *</label>
                  <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 focus-within:border-[var(--color-brand-primary)] focus-within:ring-2 focus-within:ring-[var(--color-brand-primary)]/10">
                    <User className="w-4 h-4 text-neutral-300" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                      className="flex-1 text-sm outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-600">Last Name *</label>
                  <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 focus-within:border-[var(--color-brand-primary)] focus-within:ring-2 focus-within:ring-[var(--color-brand-primary)]/10">
                    <User className="w-4 h-4 text-neutral-300" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                      className="flex-1 text-sm outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-600">Email *</label>
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 focus-within:border-[var(--color-brand-primary)] focus-within:ring-2 focus-within:ring-[var(--color-brand-primary)]/10">
                  <Mail className="w-4 h-4 text-neutral-300" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="flex-1 text-sm outline-none bg-transparent"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-600">Phone</label>
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 focus-within:border-[var(--color-brand-primary)] focus-within:ring-2 focus-within:ring-[var(--color-brand-primary)]/10">
                  <Phone className="w-4 h-4 text-neutral-300" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="flex-1 text-sm outline-none bg-transparent"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Address</h2>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-600">Street Address</label>
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 focus-within:border-[var(--color-brand-primary)] focus-within:ring-2 focus-within:ring-[var(--color-brand-primary)]/10">
                  <MapPin className="w-4 h-4 text-neutral-300" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St"
                    className="flex-1 text-sm outline-none bg-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-600">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-600">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="NY"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-600">ZIP</label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    placeholder="10001"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/10"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Financial</h2>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-600">Annual Income *</label>
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 focus-within:border-[var(--color-brand-primary)] focus-within:ring-2 focus-within:ring-[var(--color-brand-primary)]/10">
                  <span className="text-neutral-300 text-sm">$</span>
                  <input
                    type="text"
                    value={formData.income}
                    onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                    placeholder="75,000"
                    className="flex-1 text-sm outline-none bg-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Terms */}
            <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
              <button
                onClick={() => setAgreedTerms(!agreedTerms)}
                className={cn(
                  "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  agreedTerms ? "bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]" : "border-neutral-300"
                )}
              >
                {agreedTerms && <Check className="w-3 h-3 text-white" />}
              </button>
              <p className="text-xs text-neutral-500 leading-relaxed">
                I agree to the terms and conditions and authorize {selectedCard.issuer} to review my credit history. I understand this is a demo application.
              </p>
            </div>

            <Button
              onClick={handleSubmitApplication}
              disabled={!isFormValid}
              className={cn(
                "w-full rounded-full py-6 text-base font-semibold transition-all",
                isFormValid
                  ? "bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)] text-white"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              )}
            >
              <Lock className="w-4 h-4 mr-2" />
              Submit Application
            </Button>

            <p className="text-center text-[11px] text-neutral-400">
              This is a demo. No real credit check will be performed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===== DETAIL VIEW =====
  if (view === "detail" && selectedCard) {
    return (
      <div className="flex-1 h-full bg-[#f5f5f7] flex flex-col text-neutral-900 overflow-y-auto animate-in fade-in duration-300">
        <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
          <button onClick={handleBackFromDetail} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-800">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Cards</span>
          </button>
        </div>

        {/* Card Hero - 3D */}
        <div className="bg-gradient-to-br from-[var(--color-brand-primary)] to-[#0d1147] px-6 py-10 md:px-12 md:py-16">
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-8">
            <div className="w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-200"><img src={selectedCard.image} alt={selectedCard.name} className="w-full h-full object-cover" /></div>
            <div className="text-white text-center space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{selectedCard.tier}</span>
              <h1 className="text-3xl md:text-4xl font-semibold">{selectedCard.name}</h1>
              <p className="text-white/60 text-sm">Issued by {selectedCard.issuer}</p>
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <span className="text-sm bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                  Annual fee: <strong>{selectedCard.annualFee}</strong>
                </span>
                <span className="text-sm bg-[var(--color-brand-secondary)]/20 text-[var(--color-brand-secondary)] px-4 py-2 rounded-full font-medium">
                  {selectedCard.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10 px-6 py-10 md:px-12">
          {/* Quick stats */}
          {(selectedCard.rewardRate || selectedCard.signUpBonus || selectedCard.apr) && (
            <section className="max-w-2xl mx-auto">
              <div className="grid grid-cols-3 gap-3">
                {selectedCard.rewardRate && (
                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Rewards</p>
                    <p className="text-lg font-bold text-[var(--color-brand-primary)]">{selectedCard.rewardRate}</p>
                  </div>
                )}
                {selectedCard.signUpBonus && (
                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Welcome Bonus</p>
                    <p className="text-sm font-bold text-neutral-900">{selectedCard.signUpBonus}</p>
                  </div>
                )}
                {selectedCard.apr && (
                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">APR</p>
                    <p className="text-sm font-semibold text-neutral-700">{selectedCard.apr}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Highlights */}
          <section className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-semibold text-neutral-900">Card Highlights</h2>
            <div className="grid gap-4">
              {selectedCard.features.map((h, i) => (
                <div key={i} className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10 flex-shrink-0">
                    {i === 0 ? <Star className="h-4 w-4 text-[var(--color-brand-primary)]" /> :
                     i === 1 ? <Zap className="h-4 w-4 text-[var(--color-brand-primary)]" /> :
                     i === 2 ? <Globe className="h-4 w-4 text-[var(--color-brand-primary)]" /> :
                     <Shield className="h-4 w-4 text-[var(--color-brand-primary)]" />}
                  </span>
                  <p className="text-sm text-neutral-700 leading-relaxed">{h}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Benefits quick view */}
          <section className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-900">Card Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-1">
                <p className="text-xs uppercase tracking-wider text-neutral-400">Annual Fee</p>
                <p className="text-2xl font-semibold text-neutral-900">{selectedCard.annualFee}</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-1">
                <p className="text-xs uppercase tracking-wider text-neutral-400">Card Tier</p>
                <p className="text-lg font-semibold text-[var(--color-brand-primary)]">{selectedCard.tier}</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-1">
                <p className="text-xs uppercase tracking-wider text-neutral-400">Issuer</p>
                <p className="text-lg font-semibold text-neutral-900">{selectedCard.issuer}</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-1">
                <p className="text-xs uppercase tracking-wider text-neutral-400">Category</p>
                <p className="text-lg font-semibold text-neutral-900">{selectedCard.category}</p>
              </div>
            </div>
          </section>

          {/* Apply CTA */}
          <section className="max-w-2xl mx-auto">
            <div className="rounded-3xl border border-neutral-200 bg-gradient-to-r from-[#eef0ff] to-[#fffdf5] p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-[var(--color-brand-primary)]" />
                <h3 className="text-xl font-semibold text-neutral-900">Ready to apply?</h3>
              </div>
              <p className="text-sm text-neutral-500">
                Apply for the {selectedCard.name} right here. Quick application with instant decision.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleApply} className="rounded-full bg-[var(--color-brand-primary)] px-8 py-5 text-base font-semibold text-white hover:bg-[var(--color-brand-primary)]">
                  Apply Now
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button onClick={handleBackFromDetail} variant="ghost" className="rounded-full px-6 py-5 text-base font-semibold text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/10">
                  Compare Other Cards
                </Button>
              </div>
            </div>
          </section>

          {/* Other cards */}
          {cards.filter((c) => c.id !== selectedCard.id).length > 0 && (
            <section className="max-w-2xl mx-auto space-y-4 border-t border-neutral-200 pt-10">
              <h2 className="text-xl font-semibold text-neutral-900">You might also like</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {cards.filter((c) => c.id !== selectedCard.id).slice(0, 4).map((card) => (
                  <button
                    key={card.id}
                    onClick={() => { setSelectedCard(card); window.scrollTo(0, 0); }}
                    className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4 text-left hover:shadow-md hover:border-[var(--color-brand-primary)]/30 transition-all group"
                  >
                    <img src={card.image} alt={card.name} className="w-16 h-10 object-contain flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900 group-hover:text-[var(--color-brand-primary)]">{card.name}</h4>
                      <p className="text-xs text-neutral-400">{card.annualFee}/yr</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  // ===== BROWSE VIEW =====
  const allCategories = [...new Set(cards.map((c) => c.category))];
  const filteredCards = activeFilter === "All" ? cards : cards.filter((c) => c.category === activeFilter);

  return (
    <div className="flex-1 h-full bg-[#f5f5f7] flex flex-col text-neutral-900 overflow-y-auto animate-in fade-in duration-500">
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur md:px-8">
        <div className="px-4 py-4">
          <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-800">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Discovery</span>
          </button>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {["All", ...allCategories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                activeFilter === cat
                  ? "bg-[var(--color-brand-primary)] text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6 md:px-12 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-brand-primary)]/50">Products</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">{title || "Available Cards"}</h1>
          </div>
          <p className="text-sm text-neutral-400">{filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {filteredCards.map((card) => (
            <div key={card.id} className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => handleSelectCard(card)}>
              <div className="w-[200px] h-[260px] rounded-xl overflow-hidden border border-neutral-200 hover:shadow-lg transition-all group"><img src={card.image} alt={card.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>
              <div className="text-center space-y-1 w-full px-2">
                <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-[var(--color-brand-primary)] transition-colors">{card.name}</h3>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-brand-primary)]/60 bg-[var(--color-brand-primary)]/5 px-2 py-0.5 rounded-full">{card.tier}</span>
                  <span className="text-[10px] text-neutral-400">{card.annualFee}/yr</span>
                  {card.rewardRate && <span className="text-[10px] text-green-600 font-medium">{card.rewardRate}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
