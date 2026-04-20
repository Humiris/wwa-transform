"use client";

import React from "react";
import { User, Mail, Phone, MapPin, DollarSign, Check, Shield } from "lucide-react";
import { useUserStore } from "@/lib/user-store";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const AccountPanel = () => {
  const { profile, getDefaultAddress } = useUserStore();
  const addr = getDefaultAddress();

  const steps = [
    { label: "Full Name", icon: User, value: profile.firstName ? `${profile.firstName} ${profile.lastName}` : "", done: !!profile.firstName },
    { label: "Email", icon: Mail, value: profile.email, done: !!profile.email },
    { label: "Phone", icon: Phone, value: profile.phone, done: !!profile.phone },
    { label: "Address", icon: MapPin, value: addr ? `${addr.street}, ${addr.city}` : "", done: !!addr },
    { label: "Income", icon: DollarSign, value: profile.income ? `$${profile.income}` : "", done: !!profile.income },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="flex-1 h-full bg-[#f8f9fc] flex flex-col text-neutral-900 overflow-y-auto">
      <div className="max-w-lg mx-auto w-full px-6 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-accent)] flex items-center justify-center text-white text-2xl font-bold shadow-lg"
          >
            {profile.firstName ? `${profile.firstName[0]}${profile.lastName?.[0] || ""}` : "?"}
          </motion.div>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              {profile.firstName ? `Welcome, ${profile.firstName}!` : "Create your account"}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {completedCount === steps.length
                ? "All set! Your profile is complete."
                : "Answer the questions in the chat to fill your profile."}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Profile completion</span>
            <span className="font-semibold text-[var(--color-brand-primary)]">{completedCount}/{steps.length}</span>
          </div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-accent)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isCurrent = !step.done && steps.slice(0, i).every(s => s.done);

            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border p-4 transition-all",
                  step.done
                    ? "bg-white border-green-200 shadow-sm"
                    : isCurrent
                      ? "bg-white border-[var(--color-brand-primary)]/30 shadow-md ring-2 ring-[var(--color-brand-primary)]/10"
                      : "bg-neutral-50 border-neutral-200 opacity-50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  step.done
                    ? "bg-green-100"
                    : isCurrent
                      ? "bg-[var(--color-brand-primary)]/10"
                      : "bg-neutral-100"
                )}>
                  {step.done ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Icon className={cn("w-5 h-5", isCurrent ? "text-[var(--color-brand-primary)]" : "text-neutral-300")} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs font-medium uppercase tracking-wider",
                    step.done ? "text-green-600" : isCurrent ? "text-[var(--color-brand-primary)]" : "text-neutral-300"
                  )}>
                    {step.label}
                  </p>
                  {step.value ? (
                    <p className="text-sm font-semibold text-neutral-900 truncate">{step.value}</p>
                  ) : isCurrent ? (
                    <p className="text-sm text-neutral-400 italic">Waiting for your answer...</p>
                  ) : (
                    <p className="text-sm text-neutral-300">—</p>
                  )}
                </div>
                {isCurrent && (
                  <div className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)] animate-pulse flex-shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-neutral-400 pt-4">
          <Shield className="w-4 h-4" />
          <p className="text-xs">Your data is encrypted and stored securely</p>
        </div>

        {/* Benefits */}
        {completedCount === steps.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-accent)] p-6 text-white text-center space-y-3"
          >
            <h3 className="text-lg font-semibold">Profile Complete! 🎉</h3>
            <p className="text-sm text-white/70">Now when you apply for any card, your details will be auto-filled. Just say &quot;buy it&quot; and we handle the rest.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
