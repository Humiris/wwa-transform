"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, ArrowRight, Loader2, Paperclip, Image as ImageIcon, FileText, X, Mic, ChevronRight } from "lucide-react";
import { cn, cleanMarkdown } from "@/lib/utils";
import { solutions, Solution } from "@/lib/solutions";
import { productItems, ProductItem } from "@/lib/cards";

import { getAssistantResponse, generateVisualization, classifyIntent } from "@/app/actions";
import { useUserStore } from "@/lib/user-store";
import { LiveSessionOverlay } from "./live-session-overlay";
import {
  getFallbackResponse,
  formatSteps,
  EmptyState,
  RecommendationCard,
  CatalogGrid,
  ThinkingPanel,
} from "./assistant-shared";

const SUGGESTIONS = [
  "Show me travel credit cards",
  "What Brand cards have no annual fee?",
  "Compare Basic Tier vs Signature vs Infinite",
  "Compare Sapphire Preferred vs Reserve",
  "How does Solution D work?",
  "What is Zero Liability protection?",
  "Show me business cards",
  "What are Brand's security features?",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "recommendation" | "catalog" | "cards";
  solutionIds?: string[];
  cardIds?: string[];
  model?: string;
}

const CardCarousel = ({ cards, onCardClick }: { cards: ProductItem[]; onCardClick?: (ids: string[], title: string) => void }) => (
  <div className="space-y-3 mt-2">
    <div className="flex gap-5 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
      {cards.map((card) => (
        <div key={card.id} className="flex-shrink-0 flex flex-col items-center gap-2">
          <button onClick={() => onCardClick?.([card.id], card.name)} className="flex-shrink-0 w-[160px] rounded-xl overflow-hidden border border-neutral-200 bg-white hover:shadow-md transition-all group"><div className="w-full h-[160px] overflow-hidden"><img src={card.image} alt={card.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div><div className="p-3 text-left"><p className="text-xs font-semibold text-neutral-900">{card.name}</p><p className="text-[10px] text-neutral-400">{card.annualFee}</p></div></button>
        )}

        {/* Solution recommendation */}
        {message.type === "recommendation" && message.solutionIds?.[0] && (() => {
          const solution = solutions.find((s) => s.id === message.solutionIds![0]);
          if (!solution) return null;
          return <RecommendationCard solution={solution} onLearnMore={handleLearnMore} />;
        })()}

        {/* Solution catalog */}
        {message.type === "catalog" && message.solutionIds && message.solutionIds.length > 1 && (
          <CatalogGrid ids={message.solutionIds} onLearnMore={handleLearnMore} />
        )}
      </div>
    );
  };

  if (isLiveSessionOpen) {
    return (
      <LiveSessionOverlay
        isOpen={true}
        onClose={() => setIsLiveSessionOpen(false)}
        onShowCard={(cardId) => {
          onCardsSelect?.([cardId], productItems.find(c => c.id === cardId)?.name || "Card");
        }}
        onShowSolution={(solutionId) => {
          const sol = solutions.find(s => s.id === solutionId);
          if (sol) onSolutionSelect(sol);
        }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col bg-white/95 backdrop-blur-2xl text-neutral-900 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4 pt-6 md:px-8 md:pt-8">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col h-full">
            <EmptyState onOpen={() => setIsLiveSessionOpen(true)} />

            {/* Suggestions */}
            {showSuggestions && (
              <div className="mt-6 space-y-3 px-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">Try asking</p>
                <div className="grid gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSubmit(s)}
                      className="text-left px-4 py-3 rounded-2xl border border-neutral-200 text-sm text-neutral-600 hover:border-[#1A1F71] hover:text-[#1A1F71] hover:bg-[#1A1F71]/5 transition-all group relative"
                    >
                      <span>{s}</span>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[#1A1F71] transition-opacity">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex flex-col", message.role === "user" ? "items-end" : "items-start")}
              >
                {message.role === "user" ? (
                  <div className="max-w-[80%] rounded-3xl bg-[#1A1F71] px-4 py-3 text-sm font-medium text-white shadow-md">
                    {message.content}
                  </div>
                ) : (
                  renderAssistantContent(message)
                )}
              </div>
            ))}
            {isLoading && thinkingSteps.length > 0 && <ThinkingPanel steps={thinkingSteps} />}
          </div>
        )}
      </div>

      <div className="relative bg-white px-4 pb-5 pt-3 md:px-8 md:pb-8">
        <div
          className={cn(
            "flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-2.5 shadow-sm",
            isRecording && "ring-2 ring-[#1A1F71]/70"
          )}
        >
          <button onClick={() => setShowPlusMenu((prev) => !prev)} className="text-neutral-400 hover:text-neutral-700">
            {showPlusMenu ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </button>
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isRecording ? "Listening..." : "Ask about Brand cards, payments, security..."}
            className="flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-300 md:text-base"
            disabled={isLoading}
          />
          {inputValue.trim() && !isLoading && !isRecording ? (
            <button
              onClick={() => handleSubmit()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1F71] text-white transition hover:scale-105 active:scale-95"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={toggleRecording}
              disabled={isLoading}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition",
                isRecording ? "bg-[#ff3b30] text-white animate-pulse" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#1A1F71]" />
              ) : (
                <Mic className={cn("h-4 w-4", isRecording ? "text-white" : "text-[#1A1F71]")} />
              )}
            </button>
          )}
        </div>

        {showPlusMenu && (
          <div className="absolute bottom-24 left-4 w-56 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl md:left-8">
            <button
              onClick={() => { setShowPlusMenu(false); setInputValue("[Attached Image] "); inputRef.current?.focus(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-600 transition hover:bg-neutral-100"
            >
              <ImageIcon className="h-4 w-4 text-[#1A1F71]" />
              Photo
            </button>
            <button
              onClick={() => { setShowPlusMenu(false); setInputValue("[Attached File] "); inputRef.current?.focus(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-600 transition hover:bg-neutral-100"
            >
              <Paperclip className="h-4 w-4 text-purple-500" />
              File
            </button>
            <button
              onClick={() => { setShowPlusMenu(false); setInputValue("[Attached Document] "); inputRef.current?.focus(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-600 transition hover:bg-neutral-100"
            >
              <FileText className="h-4 w-4 text-green-500" />
              Document
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-[11px] text-neutral-400">
          Brand Intelligence responses are for informational purposes. Brand — Your tagline here.
        </p>
      </div>

    </div>
  );
};
