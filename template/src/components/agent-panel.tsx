"use client";

import React, { useState } from "react";
import { Copy, Check, Key, Server, Terminal, Zap, ChevronRight, Globe, Eye, EyeOff, ExternalLink } from "lucide-react";
import { useUserStore, fakeGoogleSignIn } from "@/lib/user-store";
import { cn } from "@/lib/utils";

export const AgentPanel = ({ isOpen, onClose, onSignIn }: { isOpen: boolean; onClose: () => void; onSignIn?: () => void }) => {
  const [copied, setCopied] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [activeConnector, setActiveConnector] = useState("Claude");
  const [activeSkill, setActiveSkill] = useState("visa-search");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey] = useState("vsk_live_" + Math.random().toString(36).substring(2, 18));
  const { isSignedIn, profile } = useUserStore();

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  if (!isOpen) return null;

  const connectors = [
    { name: "ChatGPT", logo: "/images/logos/chatgpt.png" },
    { name: "Claude", logo: "/images/logos/claude.png" },
    { name: "Claude Code", logo: "/images/logos/claude-code.png" },
    { name: "Cursor", logo: "/images/logos/cursor.png" },
    { name: "Codex", logo: "/images/logos/codex.png" },
    { name: "Windsurf", logo: "/images/logos/windsurf.png" },
    { name: "Copilot", logo: "/images/logos/copilot.png" },
    { name: "Gemini", logo: "/images/logos/gemini.webp" },
    { name: "Perplexity", logo: "/images/logos/perplexity.png" },
  ];

  const connectorInstructions: Record<string, string> = {
    "ChatGPT": "Settings → Developer Mode → Connectors → Add → paste URL",
    "Claude": "Settings → Integrations → MCP Servers → Add → paste URL",
    "Claude Code": "claude mcp add visa-agent http://localhost:8787/mcp",
    "Cursor": "Settings → MCP → Add Server → paste URL",
    "Codex": "codex --mcp http://localhost:8787/mcp",
    "Windsurf": "Settings → Cascade → MCP → Add → paste URL",
    "Copilot": "Settings → Extensions → MCP → Add Server URL",
    "Gemini": "AI Studio → Grounding → MCP → Add endpoint",
    "Perplexity": "Pro Search → Tools → Connect MCP → paste URL",
  };

  const cliCommands = [
    { cmd: "visa-agent search 'travel cards'", desc: "Search 13+ tools" },
    { cmd: "visa-agent ask 'best card for travel'", desc: "Natural language actions" },
    { cmd: "visa-agent tools list", desc: "List available tools" },
    { cmd: "visa-agent skills list", desc: "Browse all skills" },
    { cmd: "visa-agent compare 'sapphire vs reserve'", desc: "Compare cards" },
    { cmd: "visa-agent generate 'merchant map France'", desc: "Generate visualizations" },
  ];

  const skills = [
    { name: "visa-search", desc: "Semantic card & solution search", installs: "2.3k" },
    { name: "visa-compare", desc: "Side-by-side card comparison", installs: "1.8k" },
    { name: "visa-recommend", desc: "Personalized card recommendation", installs: "3.1k" },
    { name: "visa-generate", desc: "AI code generation for visualizations", installs: "1.2k" },
    { name: "visa-voice", desc: "Live voice agent with Gemini", installs: "890" },
    { name: "visa-map", desc: "Interactive global presence map", installs: "1.5k" },
    { name: "visa-tiers", desc: "Card tier benefits analysis", installs: "2.0k" },
    { name: "visa-3d-cards", desc: "3D interactive card viewer", installs: "1.1k" },
  ];

  const mcpTools = [
    { name: "search_cards", desc: "Find cards by category, tier, fees" },
    { name: "compare_cards", desc: "Side-by-side card comparison" },
    { name: "compare_tiers", desc: "Traditional vs Signature vs Infinite" },
    { name: "global_presence", desc: "Worldwide stats by region" },
    { name: "get_solutions", desc: "Payment solutions catalog" },
    { name: "recommend_card", desc: "Personalized recommendation" },
  ];

  return (
    <div className="flex-1 h-full bg-white flex flex-col text-neutral-900 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full px-6 py-10 space-y-6">

        {/* API Key */}
        <div className="rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-neutral-50 border-b border-neutral-200">
            <Key className="w-4 h-4 text-[#1A1F71]" />
            <h2 className="text-sm font-semibold text-neutral-900">API Key</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {isSignedIn ? (
              <>
                <p className="text-xs text-neutral-400">Your API key for authenticating requests:</p>
                <div className="flex items-center justify-between bg-neutral-50 rounded-xl border border-neutral-200 px-4 py-3">
                  <code className="text-sm font-mono text-neutral-700">
                    {showApiKey ? apiKey : "vsk_live_••••••••••••••••"}
                  </code>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowApiKey(!showApiKey)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-200 transition-colors">
                      {showApiKey ? <EyeOff className="w-4 h-4 text-neutral-400" /> : <Eye className="w-4 h-4 text-neutral-400" />}
                    </button>
                    <button onClick={() => copy(apiKey, "api-key")} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-200 transition-colors">
                      {copied === "api-key" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-300">Keep this key secret. Do not share it in client-side code.</p>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-neutral-400 mb-3">Sign in to generate your API key.</p>
                <button
                  disabled={signingIn}
                  onClick={async () => {
                    if (onSignIn) { onSignIn(); return; }
                    setSigningIn(true);
                    const p = await fakeGoogleSignIn();
                    useUserStore.getState().signIn(p);
                    setSigningIn(false);
                  }}
                  className="text-sm font-semibold text-[#1A1F71] hover:text-[#141963] px-4 py-2 rounded-lg bg-[#1A1F71]/5 hover:bg-[#1A1F71]/10 transition-all disabled:opacity-50"
                >
                  {signingIn ? "Signing in..." : "Sign In to Get Key"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AgentNet */}
        <div className="rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-50 border-b border-neutral-200">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-[#1A1F71]" />
              <h2 className="text-sm font-semibold text-neutral-900">AgentNet</h2>
            </div>
            <span className="text-xs text-neutral-400 font-mono">agentnet</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs text-neutral-500">Brand Agent is available on AgentNet — the universal agent tool network. Install it in any AI agent with one command:</p>
            <div className="flex items-center justify-between bg-neutral-50 rounded-xl border border-neutral-200 px-4 py-3">
              <code className="text-sm text-[#1A1F71] font-mono">agentnet add visa-agent</code>
              <button onClick={() => copy("agentnet add visa-agent", "agentnet")} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-200 transition-colors">
                {copied === "agentnet" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-neutral-400" />}
              </button>
            </div>
            <div className="flex gap-2 text-[10px] text-neutral-400">
              <span>Works with: Claude, ChatGPT, Cursor, Codex, Windsurf, and 50+ AI platforms</span>
            </div>
          </div>
        </div>

        {/* MCP Server */}
        <div className="rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-neutral-50 border-b border-neutral-200">
            <Server className="w-4 h-4 text-[#1A1F71]" />
            <h2 className="text-sm font-semibold text-neutral-900">MCP Server</h2>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {connectors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setActiveConnector(c.name)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                    activeConnector === c.name
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 border border-transparent hover:border-neutral-200"
                  )}
                >
                  <img src={c.logo} alt={c.name} className="w-4 h-4 rounded-sm object-contain" />
                  {c.name}
                </button>
              ))}
            </div>

            <p className="text-xs text-neutral-400">{connectorInstructions[activeConnector] || "Paste the MCP URL in your platform settings"}</p>

            <div className="flex items-center justify-between bg-neutral-50 rounded-xl border border-neutral-200 px-4 py-3">
              <code className="text-sm text-[#1A1F71] font-mono">http://localhost:8787/mcp</code>
              <button onClick={() => copy("http://localhost:8787/mcp", "mcp-url")} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-200 transition-colors">
                {copied === "mcp-url" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-neutral-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* CLI */}
        <div className="rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-50 border-b border-neutral-200">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-[#1A1F71]" />
              <h2 className="text-sm font-semibold text-neutral-900">CLI</h2>
            </div>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div className="flex items-center justify-between bg-neutral-50 rounded-xl border border-neutral-200 px-4 py-3">
              <code className="text-sm text-[#1A1F71] font-mono">npm install visa-agent-mcp</code>
              <button onClick={() => copy("npm install visa-agent-mcp", "install")} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-200 transition-colors">
                {copied === "install" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-neutral-400" />}
              </button>
            </div>
            <div className="space-y-2.5">
              {cliCommands.map((c) => (
                <div key={c.cmd} className="flex items-center justify-between group">
                  <code className="text-[13px] font-mono text-neutral-700">
                    <span className="text-neutral-300">$ </span>{c.cmd}
                  </code>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400 flex-shrink-0">{c.desc}</span>
                    <button onClick={() => copy(c.cmd, c.cmd)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center hover:bg-neutral-100 transition-all">
                      {copied === c.cmd ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-neutral-300" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skill — single detail view */}
        <div className="rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-neutral-50 border-b border-neutral-200">
            <Zap className="w-4 h-4 text-[#1A1F71]" />
            <h2 className="text-sm font-semibold text-neutral-900">Skill</h2>
          </div>
          <div className="px-5 py-5 space-y-5">
            {/* Skill selector tabs */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {skills.map((s) => (
                <button
                  key={s.name}
                  onClick={() => setActiveSkill(s.name)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium whitespace-nowrap transition-all",
                    activeSkill === s.name
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Selected skill detail */}
            {(() => {
              const skill = skills.find(s => s.name === activeSkill) || skills[0];
              return (
                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-3">
                      <code className="text-lg text-[#1A1F71] font-mono font-bold">{skill.name}</code>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">v1.0.0</span>
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">{skill.desc}</p>
                    <p className="text-[11px] text-neutral-300 mt-1">{skill.installs} installs · by iris-lab</p>
                  </div>

                  {/* Install command */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Install</p>
                    <div className="flex items-center justify-between bg-neutral-50 rounded-xl border border-neutral-200 px-4 py-3">
                      <code className="text-sm text-[#1A1F71] font-mono">npx @smithery/cli skill add iris-lab/{skill.name}</code>
                      <button onClick={() => copy(`npx @smithery/cli skill add iris-lab/${skill.name}`, `install-${skill.name}`)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-200 transition-colors">
                        {copied === `install-${skill.name}` ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Or via AgentNet */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Or via AgentNet</p>
                    <div className="flex items-center justify-between bg-neutral-50 rounded-xl border border-neutral-200 px-4 py-3">
                      <code className="text-sm text-neutral-600 font-mono">agentnet install {skill.name}</code>
                      <button onClick={() => copy(`agentnet install ${skill.name}`, `agentnet-${skill.name}`)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-200 transition-colors">
                        {copied === `agentnet-${skill.name}` ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Compatible with */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Compatible with</p>
                    <div className="flex flex-wrap gap-2">
                      {["Claude Code", "Codex", "Cursor", "Windsurf", "ChatGPT"].map(p => (
                        <span key={p} className="text-[10px] px-2 py-1 rounded-lg bg-neutral-100 text-neutral-500 font-medium">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* MCP Tools */}
        <div className="rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-neutral-50 border-b border-neutral-200">
            <Server className="w-4 h-4 text-[#1A1F71]" />
            <h2 className="text-sm font-semibold text-neutral-900">MCP Tools</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-500 font-medium">{mcpTools.length}</span>
          </div>
          <div className="px-5 py-4 space-y-1">
            {mcpTools.map((t) => (
              <div key={t.name} className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0 group">
                <div className="flex items-center gap-3">
                  <code className="text-sm text-[#1A1F71] font-mono font-medium">{t.name}</code>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1F71]/10 text-[#1A1F71] font-bold uppercase">POST</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">{t.desc}</span>
                  <button onClick={() => copy(t.name, `tool-${t.name}`)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center hover:bg-neutral-100 transition-all">
                    {copied === `tool-${t.name}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-neutral-300" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pb-4">
          <p className="text-xs text-neutral-300">Brand Agent v1.0.0 — Built by Iris Lab — WWA Platform — Available on AgentNet</p>
        </div>
      </div>
    </div>
  );
};
