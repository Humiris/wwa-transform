"use client";

import { BrandNavbar } from "@/components/brand-navbar";
import { HeroSection } from "@/components/hero-section";
import { WWAPanel } from "@/components/wwa-panel";
import { SolutionSlider } from "@/components/solution-slider";
import { SolutionDetailPanel } from "@/components/solution-detail-panel";
import { CardsBrowsePanel } from "@/components/cards-browse-panel";
import { InnerPage, NavPage } from "@/components/inner-page";
import { CardComparison } from "@/components/card-comparison";
import { WorldMap } from "@/components/world-map";
import { GeneratedView } from "@/components/generated-view";
import { AgentPanel } from "@/components/agent-panel";
import { AccountPanel } from "@/components/account-panel";
import { BookDemoModal } from "@/components/book-demo-modal";
import { useState, useRef, useCallback, useEffect } from "react";
import { Solution, solutions } from "@/lib/solutions";
import { productItems } from "@/lib/cards";
import { BRAND } from "@/lib/brand-config";
import { cn } from "@/lib/utils";
import { CreditCard, ChevronRight } from "lucide-react";

type HistoryEntry = {
  solution?: Solution | null;
  cards?: { ids: string[]; title: string } | null;
  navPage?: NavPage | null;
  comparison?: { ids: string[]; title: string } | null;
};

export default function Home() {
  const [state, setState] = useState<1 | 2 | 3 | 4>(1);
  const [leftWidth, setLeftWidth] = useState(65);
  const [activeSolution, setActiveSolution] = useState<Solution | null>(null);
  const [activeCards, setActiveCards] = useState<{ ids: string[]; title: string } | null>(null);
  const [activeNavPage, setActiveNavPage] = useState<NavPage | null>(null);
  const [activeComparison, setActiveComparison] = useState<{ ids: string[]; title: string } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [generatedView, setGeneratedView] = useState<{ code: string; title: string; model: string } | null>(null);
  const [lastGenPrompt, setLastGenPrompt] = useState("");
  const [applyCardId, setApplyCardId] = useState<string | null>(null);
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [triggerSignIn, setTriggerSignIn] = useState(0);
  const [showBookDemo, setShowBookDemo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"discovery" | "chat">("discovery");
  const isDragging = useRef(false);
  const historyRef = useRef<HistoryEntry[]>([]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseDown = useCallback(() => {
    if (isMobile) return;
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [isMobile]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current || isMobile) return;
      const container = document.getElementById("split-container");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const newLeftWidth = (relativeX / rect.width) * 100;
      if (newLeftWidth >= 20 && newLeftWidth <= 80) setLeftWidth(newLeftWidth);
    },
    [isMobile]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Save current state to history before navigating
  const pushHistory = () => {
    historyRef.current.push({
      solution: activeSolution,
      cards: activeCards,
      navPage: activeNavPage,
      comparison: activeComparison,
    });
  };

  const applyState = (entry: HistoryEntry) => {
    setActiveSolution(entry.solution ?? null);
    setActiveCards(entry.cards ?? null);
    setActiveNavPage(entry.navPage ?? null);
    setActiveComparison(entry.comparison ?? null);
  };

  const clearAllState = () => {
    setActiveSolution(null);
    setActiveCards(null);
    setActiveNavPage(null);
    setActiveComparison(null); setShowMap(false); setGeneratedView(null); setApplyCardId(null); setShowAccountCreation(false);
  };

  const handleSolutionSelect = (solution: Solution | null) => {
    pushHistory();
    setActiveSolution(solution);
    setActiveCards(null);
    setActiveNavPage(null);
    setActiveComparison(null); setShowMap(false); setGeneratedView(null); setApplyCardId(null); setShowAccountCreation(false);
    if (isMobile && solution) setActiveTab("discovery");
  };

  const handleCardsSelect = (cardIds: string[], title: string) => {
    pushHistory();
    setActiveCards({ ids: cardIds, title });
    setActiveSolution(null);
    setActiveNavPage(null);
    setActiveComparison(null); setShowMap(false); setGeneratedView(null); setApplyCardId(null); setShowAccountCreation(false);
    if (isMobile) setActiveTab("discovery");
  };

  const handleCompare = (cardIds: string[], title: string) => {
    pushHistory();
    setActiveComparison({ ids: cardIds, title });
    setActiveSolution(null);
    setActiveCards(null);
    setActiveNavPage(null);
  };

  const handleNavNavigate = (page: NavPage | null) => {
    if (page === null) {
      // Logo — go home, clear history
      historyRef.current = [];
      clearAllState();
      return;
    }
    pushHistory();
    setActiveNavPage(page);
    setActiveSolution(null);
    setActiveCards(null);
    setActiveComparison(null); setShowMap(false); setGeneratedView(null); setApplyCardId(null); setShowAccountCreation(false);
  };

  const handleBackToDiscovery = () => {
    const prev = historyRef.current.pop();
    if (prev) {
      applyState(prev);
    } else {
      clearAllState();
    }
  };

  // Determine what to show on the left panel
  const leftContent = agentPanelOpen ? "agent" : showAccountCreation ? "account" : applyCardId ? "apply" : generatedView ? "generated" : showMap ? "map" : activeComparison ? "comparison" : activeSolution ? "solution" : activeCards ? "cards" : activeNavPage ? "navpage" : "default";

  const handleApplyCard = (cardId: string) => {
    pushHistory();
    setActiveSolution(null);
    setActiveCards(null);
    setActiveNavPage(null);
    setActiveComparison(null); setShowMap(false); setGeneratedView(null);
    setApplyCardId(cardId);
  };

  const handleGenerateView = (code: string, title: string, model: string) => {
    pushHistory();
    setGeneratedView({ code, title, model });
    setActiveSolution(null);
    setActiveCards(null);
    setActiveNavPage(null);
    setActiveComparison(null); setShowMap(false); setGeneratedView({ code, title, model });
    setLastGenPrompt(title);
  };

  const handleShowMap = () => {
    setShowMap(true);
    setActiveSolution(null);
    setActiveCards(null);
    setActiveNavPage(null);
    setActiveComparison(null); setShowMap(true);
  };

  return (
    <div className="h-screen bg-white text-[#1d1d1f] flex flex-col overflow-hidden">
      <BrandNavbar
        onNavigate={handleNavNavigate}
        activePage={activeNavPage}
        agentMode={agentPanelOpen}
        onAgentToggle={() => setAgentPanelOpen(!agentPanelOpen)}
        onSignInClick={() => setTriggerSignIn(Date.now())}
      />

      {isMobile && (
        <div className="flex bg-white border-b border-neutral-200">
          <button
            onClick={() => setActiveTab("discovery")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
              activeTab === "discovery" ? "text-neutral-900" : "text-neutral-400 border-transparent"
            )}
            style={activeTab === "discovery" ? { borderBottomColor: BRAND.primaryColor } : undefined}
          >
            Discovery
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
              activeTab === "chat" ? "text-neutral-900" : "text-neutral-400 border-transparent"
            )}
            style={activeTab === "chat" ? { borderBottomColor: BRAND.primaryColor } : undefined}
          >
            {BRAND.agentName}
          </button>
        </div>
      )}

      <main
        id="split-container"
        className="flex-1 flex relative overflow-hidden w-full h-full"
      >
        <div
          style={{ width: isMobile ? "100%" : `${leftWidth}%` }}
          className={cn(
            "relative flex flex-col overflow-hidden h-full bg-white transition-all duration-300",
            !isMobile && "border-r border-neutral-200/70",
            isMobile && activeTab !== "discovery" && "hidden"
          )}
        >
          {leftContent === "apply" && applyCardId ? (
            <CardsBrowsePanel
              key={`apply-${applyCardId}`}
              cardIds={[applyCardId]}
              title="Apply"
              onBack={handleBackToDiscovery}
              autoApply={true}
            />
          ) : leftContent === "account" ? (
            <AccountPanel />
          ) : leftContent === "agent" ? (
            <AgentPanel isOpen={true} onClose={() => setAgentPanelOpen(false)} />
          ) : leftContent === "generated" && generatedView ? (
            <GeneratedView
              code={generatedView.code}
              title={generatedView.title}
              model={generatedView.model}
              onBack={handleBackToDiscovery}
              onRegenerate={async () => {
                if (lastGenPrompt) {
                  const { generateVisualization } = await import("@/app/actions");
                  const result = await generateVisualization(lastGenPrompt);
                  setGeneratedView({ code: result.code, title: result.title, model: result.model });
                }
              }}
            />
          ) : leftContent === "map" ? (
            <WorldMap />
          ) : leftContent === "comparison" && activeComparison ? (
            <CardComparison
              cardIds={activeComparison.ids}
              title={activeComparison.title}
              onBack={handleBackToDiscovery}
              onSelectCard={handleCardsSelect}
            />
          ) : leftContent === "navpage" && activeNavPage ? (
            <InnerPage
              page={activeNavPage}
              onBack={handleBackToDiscovery}
              onCardClick={handleCardsSelect}
              onSolutionClick={(id) => {
                const sol = solutions.find(s => s.id === id);
                if (sol) handleSolutionSelect(sol);
              }}
            />
          ) : leftContent === "solution" && activeSolution ? (
            <SolutionDetailPanel
              solution={activeSolution}
              onBack={handleBackToDiscovery}
              onSolutionClick={(id) => {
                const sol = solutions.find(s => s.id === id);
                if (sol) handleSolutionSelect(sol);
              }}
              onNavPage={(page) => handleNavNavigate(page as NavPage)}
              onBookDemo={() => setShowBookDemo(true)}
            />
          ) : leftContent === "cards" && activeCards ? (
            <CardsBrowsePanel
              cardIds={activeCards.ids}
              title={activeCards.title}
              onBack={handleBackToDiscovery}
            />
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-hidden h-full bg-white">
              <HeroSection
                state={state}
                onSelect={handleSolutionSelect}
                onFindCard={() => productItems.length > 0 ? handleCardsSelect(productItems.map(c => c.id), "All Products") : undefined}
                onBookDemo={() => setShowBookDemo(true)}
                onTierClick={(tier) => {
                  if (productItems.length === 0) return;
                  const tierCards = productItems.filter(c => c.tier?.toLowerCase().includes(tier.toLowerCase()));
                  if (tierCards.length > 0) {
                    handleCardsSelect(tierCards.map(c => c.id), `${tier}`);
                  } else {
                    handleCardsSelect(productItems.map(c => c.id), "All Products");
                  }
                }}
              />
              <div id="solution-slider" className="py-12 bg-white">
                <div className="px-8 md:px-16 mb-8">
                  <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
                    Explore solutions.
                  </h2>
                  <p className="text-neutral-500 mt-2 text-sm md:text-base">
                    Discover payment products, security features, and business tools for every need.
                  </p>
                </div>
                <SolutionSlider
                  onSelect={(id) => {
                    const solution = solutions.find((s) => s.id === id);
                    if (solution) handleSolutionSelect(solution);
                  }}
                />
              </div>
              {/* Browse Products Section — only show if products exist */}
              {productItems.length > 0 && (
                <div className="py-12 bg-[#f8f9fc]">
                  <div className="px-8 md:px-16 mb-8">
                    <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">Browse products.</h2>
                    <p className="text-neutral-500 mt-2 text-sm md:text-base">Explore by category to find what you need.</p>
                  </div>
                  <div className="px-8 md:px-16 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(() => {
                      const categories = [...new Set(productItems.map(c => c.category))];
                      const colors = ["from-blue-500 to-indigo-600", "from-green-500 to-emerald-600", "from-purple-500 to-violet-600", "from-orange-500 to-amber-600", "from-teal-500 to-cyan-600", "from-pink-500 to-rose-600"];
                      const allCats = [
                        ...categories.map((cat, i) => ({
                          label: cat,
                          count: productItems.filter(c => c.category === cat).length,
                          color: colors[i % colors.length],
                        })),
                        { label: "All Products", count: productItems.length, color: "from-neutral-700 to-neutral-900" },
                      ];
                      return allCats.map((cat) => (
                        <button
                          key={cat.label}
                          onClick={() => {
                            const ids = cat.label === "All Products"
                              ? productItems.map(c => c.id)
                              : productItems.filter(c => c.category === cat.label).map(c => c.id);
                            handleCardsSelect(ids, `${cat.label}`);
                          }}
                          className="group rounded-2xl overflow-hidden relative h-28 md:h-32 text-left transition-all hover:shadow-lg hover:-translate-y-1"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${cat.color}`} />
                          <div className="relative z-10 p-5 flex flex-col justify-between h-full text-white">
                            <div className="flex items-center justify-between">
                              <CreditCard className="w-5 h-5 text-white/70" />
                              <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />
                            </div>
                            <div>
                              <p className="text-base font-semibold">{cat.label}</p>
                              <p className="text-xs text-white/70">{cat.count} product{cat.count !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}

              <div className="h-20 bg-white" />
            </div>
          )}
        </div>

        {!isMobile && (
          <div
            className="w-[2px] bg-neutral-200 hover:bg-neutral-300 cursor-col-resize transition-colors relative z-50 flex-shrink-0 h-full"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />
          </div>
        )}

        <div
          className={cn(
            "flex-1 relative overflow-hidden min-w-0 h-full transition-all duration-300 bg-white",
            isMobile && activeTab !== "chat" && "hidden"
          )}
        >
          <WWAPanel
            state={state}
            onStateChange={setState}
            onSolutionSelect={handleSolutionSelect}
            onCardsSelect={handleCardsSelect}
            onCompare={handleCompare}
            onShowMap={handleShowMap}
            onGenerateView={handleGenerateView}
            onApplyCard={handleApplyCard}
            onShowAccountCreation={() => setShowAccountCreation(true)}
            triggerSignIn={triggerSignIn}
          />
        </div>
      </main>

      <BookDemoModal isOpen={showBookDemo} onClose={() => setShowBookDemo(false)} />
    </div>
  );
}
