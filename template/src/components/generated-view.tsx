"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, RefreshCw, Code, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface GeneratedViewProps {
  code: string;
  title: string;
  model: string;
  onBack: () => void;
  onRegenerate?: () => void;
}

export const GeneratedView = ({ code, title, model, onBack, onRegenerate }: GeneratedViewProps) => {
  const [showCode, setShowCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Clean the code — strip markdown fences if present
  const cleanCode = code
    .replace(/^```html?\n?/i, "")
    .replace(/\n?```$/i, "")
    .replace(/^```\n?/, "")
    .trim();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [code]);

  return (
    <div className={`flex-1 h-full flex flex-col text-neutral-900 overflow-hidden animate-in fade-in duration-300 ${isFullscreen ? "fixed inset-0 z-[90] bg-white" : ""}`}>
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-800 flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCode(!showCode)}
              className="h-8 w-8 text-neutral-400 hover:text-neutral-700"
              title="View source code"
            >
              <Code className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 text-neutral-400 hover:text-neutral-700"
              title="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            {onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRegenerate}
                className="h-8 w-8 text-neutral-400 hover:text-neutral-700"
                title="Regenerate"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8 text-[#1A1F71]" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-900">Generating visualization...</p>
              <p className="text-xs text-neutral-400 mt-1">The AI agent is writing code</p>
            </div>
          </div>
        ) : showCode ? (
          <div className="h-full overflow-auto bg-[#0d1020] p-4">
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words leading-relaxed">
              {cleanCode}
            </pre>
          </div>
        ) : (
          <iframe
            srcDoc={cleanCode}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0"
            title={title}
            style={{ colorScheme: "normal" }}
          />
        )}
      </div>
    </div>
  );
};
