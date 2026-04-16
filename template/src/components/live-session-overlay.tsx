"use client";

import React, { useState, useEffect, useRef } from "react";
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
      const cardList = productItems.map(c => `- ${c.name} (ID: ${c.id}): ${c.tier}, ${c.annualFee}/yr, ${c.category}`).join('\n');

      const systemInstruction = `
You are a helpful Brand payment specialist on a live voice call. Be warm, conversational, and get straight to helping.

CRITICAL: NEVER introduce yourself. NEVER say "I am the Brand Agent" or mention Iris Lab unless the user specifically asks "who are you" or "who built you". Just start helping immediately.

If asked who you are: "I'm the Brand Agent, here to help with cards and payments."
If asked who built you: "I was developed by Iris Lab as part of their WWA platform."

AVAILABLE CARDS:
${cardList}

AVAILABLE SOLUTIONS:
${solutionList}

TOOLS:
- Use 'show_card' to display a card on the user's screen when discussing it.
- Use 'show_solution' to display a Brand solution.
- The user sees a split screen — voice on right, content on left. Use tools frequently to make it visual.

RULES:
1. Call 'show_card' or 'show_solution' IMMEDIATELY when discussing a specific product.
2. Be conversational and natural — 2-3 sentences max per turn.
3. Ask about spending habits, travel plans, and goals to personalize recommendations.
4. No markdown. Speak naturally in plain sentences.
5. If the user mentions a country, explain Brand works with local banks in 200+ countries.
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
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <svg viewBox="0 0 1000 324" fill="currentColor" className="text-white w-5 h-3">
              <path d="M 413.58 1.58 L 311.01 322.38 L 255.72 322.38 L 204.73 52.56 C 201.87 39.32 199.37 34.53 189.23 29.02 C 172.72 20.14 145.51 11.83 121.62 6.61 L 122.88 1.58 L 223.3 1.58 C 236.26 1.58 247.77 10.17 250.76 25.14 L 276.07 160.11 L 330.8 1.58 L 413.58 1.58 Z M 748.96 217.49 C 749.29 127.03 625.29 122.14 626.17 81.29 C 626.44 69.58 637.55 57.12 661.8 54.01 C 673.83 52.48 706.34 51.24 743.31 68.19 L 758.1 6.04 C 738.25 -0.89 713.13 -7.55 682.53 -7.55 C 604.54 -7.55 550.03 33.42 549.6 92.89 C 549.1 137.67 589.48 162.53 620.15 177.35 C 651.79 192.51 662.39 202.21 662.26 215.66 C 662.01 236.1 637.94 245.17 615.46 245.52 C 574.53 246.13 550.77 234.6 531.59 225.85 L 516.37 289.99 C 535.69 298.63 572.68 306.11 611.08 306.46 C 694.12 306.46 748.71 266.03 748.96 217.49 Z M 891.33 322.38 L 963.17 322.38 L 900.24 1.58 L 835.6 1.58 C 824.11 1.58 814.42 8.78 810.29 19.2 L 693.87 322.38 L 776.85 322.38 L 793.32 275.67 L 894.17 275.67 L 891.33 322.38 Z M 814.62 213.62 L 856.32 99.29 L 880.55 213.62 L 814.62 213.62 Z M 514.7 1.58 L 449.94 322.38 L 371.08 322.38 L 435.88 1.58 L 514.7 1.58 Z" />
            </svg>
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
                <div className="absolute inset-0 border-3 border-[#1A1F71] rounded-full border-t-transparent animate-spin" />
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
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#1A1F71]/20 to-[#0d1020]">
                  <motion.div
                    animate={{ scale: isAiTalking ? [1, 1.08, 1] : 1, opacity: isAiTalking ? [0.6, 1, 0.6] : 0.4 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-14 text-white/20"
                  >
                    <svg viewBox="0 0 1000 324" fill="currentColor" className="w-full h-full">
                      <path d="M 413.58 1.58 L 311.01 322.38 L 255.72 322.38 L 204.73 52.56 C 201.87 39.32 199.37 34.53 189.23 29.02 C 172.72 20.14 145.51 11.83 121.62 6.61 L 122.88 1.58 L 223.3 1.58 C 236.26 1.58 247.77 10.17 250.76 25.14 L 276.07 160.11 L 330.8 1.58 L 413.58 1.58 Z M 748.96 217.49 C 749.29 127.03 625.29 122.14 626.17 81.29 C 626.44 69.58 637.55 57.12 661.8 54.01 C 673.83 52.48 706.34 51.24 743.31 68.19 L 758.1 6.04 C 738.25 -0.89 713.13 -7.55 682.53 -7.55 C 604.54 -7.55 550.03 33.42 549.6 92.89 C 549.1 137.67 589.48 162.53 620.15 177.35 C 651.79 192.51 662.39 202.21 662.26 215.66 C 662.01 236.1 637.94 245.17 615.46 245.52 C 574.53 246.13 550.77 234.6 531.59 225.85 L 516.37 289.99 C 535.69 298.63 572.68 306.11 611.08 306.46 C 694.12 306.46 748.71 266.03 748.96 217.49 Z M 891.33 322.38 L 963.17 322.38 L 900.24 1.58 L 835.6 1.58 C 824.11 1.58 814.42 8.78 810.29 19.2 L 693.87 322.38 L 776.85 322.38 L 793.32 275.67 L 894.17 275.67 L 891.33 322.38 Z M 814.62 213.62 L 856.32 99.29 L 880.55 213.62 L 814.62 213.62 Z M 514.7 1.58 L 449.94 322.38 L 371.08 322.38 L 435.88 1.58 L 514.7 1.58 Z" />
                    </svg>
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
