"use client";

import React, { useState } from "react";
import { X, CheckCircle, Building2, User, Mail, Briefcase, Globe, DollarSign, Users, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/lib/user-store";

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
  "Japan", "India", "Brazil", "Mexico", "China", "South Korea", "Singapore",
  "United Arab Emirates", "Saudi Arabia", "Netherlands", "Switzerland", "Sweden",
  "Italy", "Spain", "Israel", "New Zealand", "Ireland", "Belgium", "Austria",
  "Norway", "Denmark", "Finland", "Portugal", "Poland", "Czech Republic",
  "South Africa", "Nigeria", "Kenya", "Egypt", "Turkey", "Thailand",
  "Indonesia", "Philippines", "Vietnam", "Malaysia", "Colombia", "Argentina",
  "Chile", "Peru", "Romania", "Ukraine", "Greece", "Hungary",
];

const COMPANY_TYPES = [
  "Banks & Financial Institution",
  "Government",
  "Fintech & Technology Partner",
  "Enterprise Business (> $1B revenue)",
  "Small Business",
];

const PRODUCT_INTERESTS: Record<string, string[]> = {
  "Banks & Financial Institution": [
    "Solution A", "Solution B", "Solution D", "Solution C",
    "Fraud & Risk Solutions", "Platform", "Consulting",
  ],
  "Government": [
    "Government Payment Solutions", "Solution A", "Commercial & Government Cards",
    "Fraud & Risk Solutions", "Consulting",
  ],
  "Fintech & Technology Partner": [
    "Developer Platform", "Solution A", "Solution B",
    "Solution D", "Solution E", "Partner Program", "Issuing Solutions",
  ],
  "Enterprise Business (> $1B revenue)": [
    "Commercial Card Programs", "Solution A", "Virtual Card Solutions",
    "Cross-Border Payments", "Consulting", "Fraud & Risk Solutions",
  ],
  "Small Business": [
    "Business Credit Cards", "Solution E", "Solution D",
    "Solution A", "Payment Acceptance Solutions",
  ],
};

const REVENUE_RANGES = [
  "< $5 million",
  "$6 - $24 million",
  "$25 million - $49 million",
  "$50 million - $99 million",
  "$100 million - $499 million",
  "$500 million - $1 billion",
  "$1 billion - $5 billion",
  "$5 billion - $10 billion",
  "$10 billion - $25 billion",
  "Over $25 billion",
];

const COMPANY_SIZES = [
  "Less than 50 employees",
  "51 - 500 employees",
  "501 - 2,500 employees",
  "2,501 - 10,000 employees",
  "10,001 - 25,000 employees",
  "Over 25,000 employees",
];

export const BookDemoModal = ({ isOpen, onClose }: BookDemoModalProps) => {
  const { isSignedIn, profile } = useUserStore();

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: isSignedIn ? profile.firstName : "",
    lastName: isSignedIn ? profile.lastName : "",
    title: "",
    email: isSignedIn ? profile.email : "",
    company: "",
    country: "",
    companyType: "",
    productInterest: "",
    revenue: "",
    companySize: "",
    message: "",
    marketingOptIn: false,
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const step1Valid =
    form.firstName.trim() && form.lastName.trim() && form.title.trim() && form.email.trim() && form.email.includes("@");
  const step2Valid =
    form.company.trim() && form.country && form.companyType && form.productInterest;
  const step3Valid = form.revenue && form.companySize && form.message.trim();

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleClose = () => {
    setStep(1);
    setSubmitted(false);
    setForm({
      firstName: isSignedIn ? profile.firstName : "",
      lastName: isSignedIn ? profile.lastName : "",
      title: "",
      email: isSignedIn ? profile.email : "",
      company: "",
      country: "",
      companyType: "",
      productInterest: "",
      revenue: "",
      companySize: "",
      message: "",
      marketingOptIn: false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[540px] max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {submitted ? (
            <SuccessView onClose={handleClose} name={form.firstName} />
          ) : (
            <>
              {/* Header */}
              <div className="relative bg-gradient-to-r from-[#1A1F71] to-[#1434CB] px-6 py-5">
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 mb-3">
                  <svg viewBox="0 0 1000 324" width="48" height="16" fill="none">
                    <path d="M 413.58 1.58 L 311.01 322.38 L 255.72 322.38 L 204.73 52.56 C 201.87 39.32 199.37 34.53 189.23 29.02 C 172.72 20.14 145.51 11.83 121.62 6.61 L 122.88 1.58 L 223.3 1.58 C 236.26 1.58 247.77 10.17 250.76 25.14 L 276.07 160.11 L 330.8 1.58 L 413.58 1.58 Z M 748.96 217.49 C 749.29 127.03 625.29 122.14 626.17 81.29 C 626.44 69.58 637.55 57.12 661.8 54.01 C 673.83 52.48 706.34 51.24 743.31 68.19 L 758.1 6.04 C 738.25 -0.89 713.13 -7.55 682.53 -7.55 C 604.54 -7.55 550.03 33.42 549.6 92.89 C 549.1 137.67 589.48 162.53 620.15 177.35 C 651.79 192.51 662.39 202.21 662.26 215.66 C 662.01 236.1 637.94 245.17 615.46 245.52 C 574.53 246.13 550.77 234.6 531.59 225.85 L 516.37 289.99 C 535.69 298.63 572.68 306.11 611.08 306.46 C 694.12 306.46 748.71 266.03 748.96 217.49 Z M 891.33 322.38 L 963.17 322.38 L 900.24 1.58 L 835.6 1.58 C 824.11 1.58 814.42 8.78 810.29 19.2 L 693.87 322.38 L 776.85 322.38 L 793.32 275.67 L 894.17 275.67 L 891.33 322.38 Z M 814.62 213.62 L 856.32 99.29 L 880.55 213.62 L 814.62 213.62 Z M 514.7 1.58 L 449.94 322.38 L 371.08 322.38 L 435.88 1.58 L 514.7 1.58 Z" fill="white"/>
                  </svg>
                </div>
                <h2 className="text-white text-lg font-semibold">Contact Us Sales</h2>
                <p className="text-white/70 text-xs mt-1">
                  Learn about Enterprise Payment Technology Solutions and explore new offerings.
                </p>
                {/* Step indicator */}
                <div className="flex items-center gap-2 mt-4">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                          step === s
                            ? "bg-white text-[#1A1F71]"
                            : step > s
                            ? "bg-white/30 text-white"
                            : "bg-white/10 text-white/40"
                        }`}
                      >
                        {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                      </div>
                      {s < 3 && (
                        <div
                          className={`w-8 h-0.5 rounded-full transition-all ${
                            step > s ? "bg-white/40" : "bg-white/10"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                  <span className="text-white/50 text-[10px] ml-2">
                    {step === 1 ? "Your Info" : step === 2 ? "Company" : "Details"}
                  </span>
                </div>
              </div>

              {/* Form Body */}
              <div className="px-6 py-5 overflow-y-auto max-h-[55vh]">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <p className="text-xs text-neutral-400 mb-1">* Indicates required field</p>

                      <div className="grid grid-cols-2 gap-3">
                        <FormInput
                          icon={<User className="w-4 h-4" />}
                          label="First Name *"
                          value={form.firstName}
                          onChange={(v) => update("firstName", v)}
                        />
                        <FormInput
                          icon={<User className="w-4 h-4" />}
                          label="Last Name *"
                          value={form.lastName}
                          onChange={(v) => update("lastName", v)}
                        />
                      </div>
                      <FormInput
                        icon={<Briefcase className="w-4 h-4" />}
                        label="Title *"
                        value={form.title}
                        onChange={(v) => update("title", v)}
                        placeholder="e.g. VP of Payments"
                      />
                      <FormInput
                        icon={<Mail className="w-4 h-4" />}
                        label="Business Email Address *"
                        type="email"
                        value={form.email}
                        onChange={(v) => update("email", v)}
                        placeholder="you@company.com"
                      />
                      {isSignedIn && (
                        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
                          <Sparkles className="w-3.5 h-3.5" />
                          Pre-filled from your account
                        </div>
                      )}
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <FormInput
                        icon={<Building2 className="w-4 h-4" />}
                        label="Company *"
                        value={form.company}
                        onChange={(v) => update("company", v)}
                      />
                      <FormSelect
                        icon={<Globe className="w-4 h-4" />}
                        label="Country / Region *"
                        value={form.country}
                        onChange={(v) => update("country", v)}
                        options={COUNTRIES}
                      />
                      <FormSelect
                        icon={<Building2 className="w-4 h-4" />}
                        label="Type of Company *"
                        value={form.companyType}
                        onChange={(v) => {
                          update("companyType", v);
                          update("productInterest", "");
                        }}
                        options={COMPANY_TYPES}
                      />
                      <FormSelect
                        icon={<Briefcase className="w-4 h-4" />}
                        label="Product Interest *"
                        value={form.productInterest}
                        onChange={(v) => update("productInterest", v)}
                        options={
                          form.companyType
                            ? PRODUCT_INTERESTS[form.companyType] || []
                            : []
                        }
                        disabled={!form.companyType}
                        placeholder={
                          form.companyType
                            ? "Select a product"
                            : "Select company type first"
                        }
                      />
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <FormSelect
                        icon={<DollarSign className="w-4 h-4" />}
                        label="Revenue *"
                        value={form.revenue}
                        onChange={(v) => update("revenue", v)}
                        options={REVENUE_RANGES}
                      />
                      <FormSelect
                        icon={<Users className="w-4 h-4" />}
                        label="Company Size *"
                        value={form.companySize}
                        onChange={(v) => update("companySize", v)}
                        options={COMPANY_SIZES}
                      />
                      <div>
                        <label className="text-xs font-medium text-neutral-600 mb-1.5 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-neutral-400" />
                          What are you interested in? *
                        </label>
                        <textarea
                          value={form.message}
                          onChange={(e) => update("message", e.target.value)}
                          rows={3}
                          placeholder="Tell us about your payment needs, challenges, or the solutions you'd like to explore..."
                          className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:bg-white focus:border-[#1A1F71] focus:ring-1 focus:ring-[#1A1F71]/20 outline-none transition-all resize-none placeholder:text-neutral-300"
                        />
                      </div>
                      <label className="flex items-start gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={form.marketingOptIn}
                          onChange={(e) => update("marketingOptIn", e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-[#1A1F71] focus:ring-[#1A1F71]/20 accent-[#1A1F71]"
                        />
                        <span className="text-[11px] text-neutral-400 leading-relaxed">
                          By checking this box, you agree to receive marketing communications
                          about Brand business products. View our{" "}
                          <span className="text-[#1A1F71] hover:underline">
                            Global Privacy Notice
                          </span>
                          .
                        </span>
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                    className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}
                {step < 3 ? (
                  <button
                    onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                    disabled={step === 1 ? !step1Valid : !step2Valid}
                    className="flex items-center gap-2 bg-[#1A1F71] hover:bg-[#141963] disabled:bg-neutral-200 disabled:text-neutral-400 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!step3Valid}
                    className="flex items-center gap-2 bg-[#1A1F71] hover:bg-[#141963] disabled:bg-neutral-200 disabled:text-neutral-400 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all"
                  >
                    Submit <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─── Sub-components ─── */

function FormInput({
  icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-600 mb-1.5 flex items-center gap-1.5">
        <span className="text-neutral-400">{icon}</span>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label.replace(" *", "")}
        className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:bg-white focus:border-[#1A1F71] focus:ring-1 focus:ring-[#1A1F71]/20 outline-none transition-all placeholder:text-neutral-300"
      />
    </div>
  );
}

function FormSelect({
  icon,
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-600 mb-1.5 flex items-center gap-1.5">
        <span className="text-neutral-400">{icon}</span>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:bg-white focus:border-[#1A1F71] focus:ring-1 focus:ring-[#1A1F71]/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
      >
        <option value="">{placeholder || "-- Please Select --"}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function SuccessView({ onClose, name }: { onClose: () => void; name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold text-neutral-900 mb-2">
        Thank you, {name}!
      </h3>
      <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
        Your request has been submitted. A Sales Representative will
        contact you within 1-2 business days to schedule your demo.
      </p>
      <div className="bg-neutral-50 rounded-xl p-4 mb-6 text-left text-xs text-neutral-500 space-y-1.5">
        <p className="font-medium text-neutral-700 text-sm mb-2">What happens next?</p>
        <div className="flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-[#1A1F71]/10 text-[#1A1F71] flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">1</span>
          <span>Our team reviews your request and matches you with a specialist</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-[#1A1F71]/10 text-[#1A1F71] flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">2</span>
          <span>You'll receive a calendar invite for a personalized demo</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-[#1A1F71]/10 text-[#1A1F71] flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">3</span>
          <span>Get a tailored proposal for your business needs</span>
        </div>
      </div>
      <button
        onClick={onClose}
        className="bg-[#1A1F71] hover:bg-[#141963] text-white text-sm font-semibold px-8 py-3 rounded-full transition-all"
      >
        Done
      </button>
    </motion.div>
  );
}
