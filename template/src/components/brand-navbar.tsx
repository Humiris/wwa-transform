"use client";

import React, { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { BRAND } from "@/lib/brand-config";
import { useUserStore, fakeGoogleSignIn, hydrateUserStore } from "@/lib/user-store";

interface BrandNavbarProps {
  onNavigate?: (page: string | null) => void;
  activePage?: string | null;
  onAgentToggle?: () => void;
  agentMode?: boolean;
  onSignInClick?: () => void;
}

export const BrandNavbar = ({ onNavigate, activePage, onAgentToggle, agentMode = false, onSignInClick }: BrandNavbarProps) => {
  const { isSignedIn, profile, signIn, signOut } = useUserStore();
  const [signingIn, setSigningIn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { hydrateUserStore(); setMounted(true); }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    const p = await fakeGoogleSignIn();
    signIn(p);
    setSigningIn(false);
  };

  return (
    <nav className="w-full bg-white/95 backdrop-blur-lg text-[12px] font-normal h-12 flex items-center justify-center px-4 z-50 border-b border-neutral-200 shadow-sm">
      <div className="max-w-[1200px] w-full flex items-center justify-between text-neutral-600">
        <button onClick={() => onNavigate?.(null)} className="cursor-pointer hover:opacity-80 transition-opacity">
          {BRAND.logoSvg ? (
            <div dangerouslySetInnerHTML={{ __html: BRAND.logoSvg }} className="h-5 w-auto" />
          ) : (
            <img src={BRAND.logoImage} alt={BRAND.name} className="h-5 w-auto object-contain" />
          )}
        </button>
        <div className="hidden lg:flex items-center space-x-7">
          {BRAND.navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate?.(item.page)}
              className={`hover:opacity-80 transition-colors tracking-tight font-light ${activePage === item.page ? "font-medium" : ""}`}
              style={{ color: activePage === item.page ? BRAND.primaryColor : undefined }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {mounted && isSignedIn ? (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src={profile.avatar} alt="" className="w-7 h-7 rounded-full border border-neutral-200" />
                <span className="text-[11px] font-medium text-neutral-700 hidden md:inline">{profile.firstName}</span>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-10 z-50 w-48 bg-white rounded-xl border border-neutral-200 shadow-xl py-2">
                    <div className="px-3 py-2 border-b border-neutral-100">
                      <p className="text-xs font-semibold text-neutral-900">{profile.firstName} {profile.lastName}</p>
                      <p className="text-[10px] text-neutral-400">{profile.email}</p>
                    </div>
                    <button onClick={() => { signOut(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : mounted ? (
            <button
              onClick={() => onSignInClick ? onSignInClick() : handleSignIn()}
              disabled={signingIn}
              className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ color: BRAND.primaryColor }}
            >
              {signingIn ? "Signing in..." : "Sign In"}
            </button>
          ) : null}

          {/* Human/Agent toggle — hidden on mobile */}
          <div className="hidden md:flex items-center bg-neutral-100 rounded-full p-0.5 border border-neutral-200">
            <button
              onClick={() => { if (agentMode) onAgentToggle?.(); }}
              className={`px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all ${!agentMode ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Human
            </button>
            <button
              onClick={() => { if (!agentMode) onAgentToggle?.(); }}
              className={`px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all ${agentMode ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Agent
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
