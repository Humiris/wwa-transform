"use client";

/**
 * LiveSessionOverlay — Gemini Live voice-call UI.
 *
 * TEMPLATE NOTE: the brand logo now renders via <img src={BRAND.logoImage}>
 * in both the header and the animated center. Ensure brand-config.ts sets
 * logoImage to a real path (PNG/SVG/WEBP) for your brand — the template
 * ships with "/images/brand-logo.png" as the default. See SKILL.md
 * "Known template residues" for the full first-frame-logo checklist.
 */

import React, { useState, useEffect, useRef } from "react";
import { BRAND } from "@/lib/brand-config";
import { X, Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GeminiLiveClient } from "@/lib/gemini-live-client";
import { solutions } from "@/lib/solutions";
import { productItems } from "@/lib/cards";

interface LiveSessionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onShowCard?: (cardId: string) => void;
  onShowSolution?: (solutionId: string) => void;
}

export const LiveSessionOverlay = ({ isOpen, onClose, onShowCard, onShowSolution }: LiveSessionOverlayProps) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [status, setStatus] = useState<"connecting" | "connected" | "error" | "disconnected">("disconnected");
  const [audioLevel, setAudioLevel] = useState(0);
  const [aiAudioLevel, setAiAudioLevel] = useState(0);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userTranscript, setUserTranscript] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const recognitionRef = useRef<any>(null);
  const userTranscriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      const id = ++sessionIdRef.current;
      startSession(id);
      initLocalSpeech();
      return () => {
        // Only stop if this is still the active session
        if (sessionIdRef.current === id) {
          stopSession();
        }
      };
    } else {
      stopSession();
    }
  }, [isOpen]);

  const initLocalSpeech = () => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setUserTranscript(text);
          if (userTranscriptTimeoutRef.current) clearTimeout(userTranscriptTimeoutRef.current);
          userTranscriptTimeoutRef.current = setTimeout(() => setUserTranscript(""), 3000);
        };
        recognitionRef.current.start();
      }
    }
  };

  const startSession = async (sessionId?: number) => {
    setStatus("connecting");
    setErrorMessage("");
    setUserTranscript("");

    try {
      const res = await fetch("/api/gemini-key", { method: "POST" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to get API key");
      const { key: apiKey } = await res.json();
      if (!apiKey) throw new Error("Gemini API Key not configured.");

      // Abort if this session was superseded
      if (sessionId !== undefined && sessionIdRef.current !== sessionId) return;

      const client = new GeminiLiveClient(apiKey);
      clientRef.current = client;

      const solutionList = solutions.map(s => `- ${s.name} (ID: ${s.id}): ${s.tagline}`).join('\n');
      const productList = productItems.map(c => `- ${c.name} (ID: ${c.id}): ${c.category}, ${c.tier}, ${c.annualFee}`).join('\n');

      // TEMPLATE NOTE: rewrite the system prompt below to match the brand's domain.
      // The "payment specialist" / "cards and payments" / "local banks in 200+ countries"
      // lines are Visa-specific. Replace with brand-appropriate role, category names, and
      // factual claims. But KEEP the "TOOL USE IS MANDATORY" block verbatim — it's what
      // makes Gemini Live actually drive the left panel during voice calls.
      const systemInstruction = `
You are a helpful ${"Brand"} specialist on a live voice call. Be warm, conversational, and get straight to helping.

CRITICAL: NEVER introduce yourself. NEVER say "I am the Brand Agent" or mention Iris Lab unless the user specifically asks "who are you" or "who built you". Just start helping immediately.

If asked who you are: "I'm the Brand Agent, here to help."
If asked who built you: "I was developed by Iris Lab as part of their WWA platform."

AVAILABLE PRODUCTS (pass the ID as card_id to the show_card tool):
${productList}

AVAILABLE COLLECTIONS (pass the ID as solution_id to the show_solution tool):
${solutionList}

TOOL USE IS MANDATORY — READ THIS CAREFULLY:
- You are on a split-screen call. Voice is on the right, visual content is on the left. The user cannot see anything unless you call a tool.
- The moment the user asks to "see", "show", "look at", "browse", "find", "compare", or mentions any specific product category or name, you MUST call show_card or show_solution BEFORE you speak.
- If you cannot find an exact match in the AVAILABLE PRODUCTS / COLLECTIONS lists above, pick the closest one and still call the tool — never leave the left panel blank.

RULES:
1. ALWAYS call at least one tool in every turn where a specific item is mentioned. Silence on the left panel = broken experience.
2. Be conversational and natural — 2-3 sentences max per turn.
3. Ask about the user's goals/preferences to personalize recommendations.
4. No markdown. Speak naturally in plain sentences.
`;

      client.setCallbacks({
        onStatusChange: (s) => {
          if (s === 'connected') setStatus("connected");
          if (s === 'disconnected') setStatus("disconnected");
        },
        onMessage: () => {},
        onAudioLevel: (level) => setAudioLevel(level * 2),
        onAiAudioLevel: (level) => setAiAudioLevel(level * 5),
        onAiTalking: (talking) => setIsAiTalking(talking),
        onError: (err) => { setErrorMessage(err); setStatus("error"); },
        onToolCall: async (toolCall) => {
          if (toolCall.name === "show_card") {
            const card = productItems.find(c => c.id === toolCall.args?.card_id);
            if (card) {
              onShowCard?.(card.id);
              return { success: true, message: `Showing ${card.name} on the user's screen.` };
            }
            return { error: "Card not found." };
          }
          if (toolCall.name === "show_solution") {
            const sol = solutions.find(s => s.id === toolCall.args?.solution_id);
            if (sol) {
              onShowSolution?.(sol.id);
              return { success: true, message: `Showing ${sol.name} on the user's screen.` };
            }
            return { error: "Solution not found." };
          }
          return { error: "Unknown tool" };
        }
      });

      await client.connect(systemInstruction);

      if (isCameraOn) {
        await client.startMedia('camera');
        if (videoRef.current && client.mediaStream) videoRef.current.srcObject = client.mediaStream;
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to start live session");
      setStatus("error");
    }
  };

  const stopSession = () => {
    clientRef.current?.stop();
    clientRef.current = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setStatus("disconnected");
    setIsAiTalking(false);
    setAudioLevel(0);
    setAiAudioLevel(0);
    setUserTranscript("");
    if (userTranscriptTimeoutRef.current) clearTimeout(userTranscriptTimeoutRef.current);
  };

  const toggleCamera = async () => {
    const next = !isCameraOn;
    setIsCameraOn(next);
    if (clientRef.current && status === "connected") {
      if (next) {
        await clientRef.current.startMedia('camera');
        if (videoRef.current && clientRef.current.mediaStream) videoRef.current.srcObject = clientRef.current.mediaStream;
      } else {
        await clientRef.current.startMedia('audio');
      }
    }
  };

  const toggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    if (clientRef.current?.mediaStream) {
      clientRef.current.mediaStream.getAudioTracks().forEach(t => t.enabled = next);
    }
    if (recognitionRef.current) { next ? recognitionRef.current.start() : recognitionRef.current.stop(); }
  };

  const toggleScreenShare = async () => {
    const next = !isScreenSharing;
    setIsScreenSharing(next);
    if (clientRef.current && status === "connected") {
      if (next) {
        await clientRef.current.startMedia('screen');
        if (videoRef.current && clientRef.current.mediaStream) videoRef.current.srcObject = clientRef.current.mediaStream;
      } else {
        await clientRef.current.startMedia('audio');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-[#0d1020] text-white animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
            <img src={BRAND.logoImage} alt={BRAND.name} className="w-5 h-5 object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Live Session</h2>
            <div className="flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full", status === "connected" ? "bg-red-500 animate-pulse" : "bg-white/20")} />
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                {status === "connected" ? "Live" : status === "connecting" ? "Connecting..." : "Offline"}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-white/40 hover:text-white h-8 w-8">
          <X size={18} />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-4">
        <AnimatePresence mode="wait">
          {status === "connecting" ? (
            <motion.div key="connecting" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex flex-col items-center">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-3 border-white/10 rounded-full" />
                <div className="absolute inset-0 border-3 border-[var(--color-brand-primary)] rounded-full border-t-transparent animate-spin" />
              </div>
              <p className="text-white/50 text-sm font-medium">Connecting...</p>
            </motion.div>
          ) : status === "error" ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center max-w-xs px-4">
              <AlertCircle size={40} className="text-red-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Connection Failed</h3>
              <p className="text-white/50 text-sm mb-6">{errorMessage || "Check permissions and try again."}</p>
              <Button onClick={() => startSession()} className="rounded-full px-6 bg-white text-black hover:bg-white/90 text-sm">Try Again</Button>
            </motion.div>
          ) : (
            <div className="w-full max-w-sm aspect-square rounded-[28px] overflow-hidden bg-[#141428] border border-white/5 shadow-2xl relative">
              {(isCameraOn || isScreenSharing) ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(to bottom, ${BRAND.primaryColor}33, #0d1020)` }}
                >
                  <motion.div
                    animate={{ scale: isAiTalking ? [1, 1.08, 1] : 1, opacity: isAiTalking ? [0.6, 1, 0.6] : 0.4 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 flex items-center justify-center"
                  >
                    <img src={BRAND.logoImage} alt={BRAND.name} className="w-full h-full object-contain opacity-80" />
                  </motion.div>
                </div>
              )}

              {/* Audio Visualizer */}
              <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-8 overflow-hidden">
                <div className="flex items-center gap-[2px] h-20 relative">
                  {[...Array(40)].map((_, i) => {
                    const level = isAiTalking ? aiAudioLevel : audioLevel;
                    const isActive = isAiTalking || (isMicOn && audioLevel > 0.05);
                    return (
                      <motion.div
                        key={i}
                        animate={{
                          height: isActive ? [6, Math.max(6, level * (Math.random() * 60 + 15)), 6] : [3, Math.random() * 6 + 3, 3],
                          opacity: isActive ? [0.4, 0.8, 0.4] : 0.15
                        }}
                        transition={{ duration: 0.3 + Math.random() * 0.4, repeat: Infinity, ease: "easeInOut" }}
                        className={cn(
                          "w-[2px] rounded-full",
                          isAiTalking
                            ? (i % 3 === 0 ? "bg-blue-400" : i % 3 === 1 ? "bg-indigo-400" : "bg-violet-400")
                            : (isMicOn && audioLevel > 0.05 ? "bg-white" : "bg-white/30")
                        )}
                      />
                    );
                  })}
                  {isAiTalking && <div className="absolute inset-0 bg-blue-500/15 blur-[40px] rounded-full animate-pulse" />}
                </div>
              </div>

              {/* User transcript */}
              <AnimatePresence>
                {userTranscript && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute bottom-24 left-3 right-3">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 border border-white/5">
                      <p className="text-white/60 text-xs font-medium italic text-center">&ldquo;{userTranscript}&rdquo;</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Badge */}
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full",
                  isAiTalking ? "bg-blue-500 animate-pulse" : (isMicOn && audioLevel > 0.05 ? "bg-green-500 animate-pulse" : "bg-white/20")
                )} />
                <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                  {isAiTalking ? "Speaking" : (isMicOn && audioLevel > 0.05 ? "Listening" : "Ready")}
                </span>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="py-5 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={toggleMic}
            className={cn("w-11 h-11 rounded-full border-white/10", isMicOn ? "bg-white/5 text-white" : "bg-red-500/20 text-red-500 border-red-500/50")}>
            {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
          </Button>
          <Button variant="outline" size="icon" onClick={toggleCamera}
            className={cn("w-11 h-11 rounded-full border-white/10", isCameraOn ? "bg-white/5 text-white" : "bg-white/5 text-white/40")}>
            {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
          </Button>
          <Button variant="outline" size="icon" onClick={toggleScreenShare}
            className={cn("w-11 h-11 rounded-full border-white/10", isScreenSharing ? "bg-blue-500 text-white border-blue-500" : "bg-white/5 text-white/40")}>
            <Monitor size={18} />
          </Button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <Button onClick={onClose} className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-700 text-white border-none flex items-center justify-center p-0">
            <PhoneOff size={20} />
          </Button>
        </div>
        <p className="text-white/20 text-[10px] font-medium">Your session is private and encrypted.</p>
      </div>
    </div>
  );
};
