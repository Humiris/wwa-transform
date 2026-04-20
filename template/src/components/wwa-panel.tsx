"use client";

/**
 * WWA Panel — main agent chat surface.
 *
 * TEMPLATE NOTE: this file is a working copy of the Visa reference implementation
 * with minimal type renames (visaCards -> productItems, VisaCard -> ProductItem).
 * It COMPILES and RENDERS but its suggestions, intent matchers, fallback replies,
 * and hardcoded category filters are all Visa-flavored. When transforming for a
 * new brand, rewrite ALL of the following:
 *   - SUGGESTIONS array (the sample prompts)
 *   - Intent matchers that key off "travel" / "cash back" / "business" / "secured"
 *   - Fallback / welcome / error messages mentioning "Visa", "cards", "annual fee"
 *   - Hardcoded brand names in onboarding & buy flow
 *   - detectedSolutionIds matchers that reference "visa-developer", "visa-direct" etc.
 * See SKILL.md Step 3.5. Do not ship this file unmodified.
 */

import React, { useState, useRef, useEffect } from "react";
import { Plus, ArrowRight, Loader2, Paperclip, Image as ImageIcon, FileText, X, Mic, ChevronRight } from "lucide-react";
import { cn, cleanMarkdown } from "@/lib/utils";
import { solutions, Solution } from "@/lib/solutions";
import { productItems, ProductItem } from "@/lib/cards";
import { Card3D } from "./card-3d";
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
  "What Visa cards have no annual fee?",
  "Compare Visa Traditional vs Signature vs Infinite",
  "Compare Sapphire Preferred vs Reserve",
  "How does Click to Pay work?",
  "What is Zero Liability protection?",
  "Show me business cards",
  "What are Visa's security features?",
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
          <Card3D card={card} size="sm" onClick={() => onCardClick?.([card.id], card.name)} />
          <p className="text-xs font-semibold text-neutral-700 text-center max-w-[200px]">{card.name}</p>
          <p className="text-[10px] text-neutral-400">{card.annualFee}/yr</p>
        </div>
      ))}
    </div>
  </div>
);

export const WWAPanel = ({
  state,
  onStateChange,
  onSolutionSelect,
  onCardsSelect,
  onCompare,
  onShowMap,
  onGenerateView,
  onApplyCard,
  onShowAccountCreation,
  triggerSignIn,
}: {
  state: 1 | 2 | 3 | 4;
  onStateChange: (s: 1 | 2 | 3 | 4) => void;
  onSolutionSelect: (s: Solution | null) => void;
  onCardsSelect?: (cardIds: string[], title: string) => void;
  onCompare?: (cardIds: string[], title: string) => void;
  onShowMap?: () => void;
  onGenerateView?: (code: string, title: string, model: string) => void;
  onApplyCard?: (cardId: string) => void;
  onShowAccountCreation?: () => void;
  triggerSignIn?: number;
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLiveSessionOpen, setIsLiveSessionOpen] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const id = setTimeout(scrollToBottom, 120);
    return () => clearTimeout(id);
  }, [messages, thinkingSteps, isLoading]);

  useEffect(() => {
    if (state === 1 && inputRef.current) inputRef.current.focus();
  }, [state]);

  // Trigger sign-in from navbar click
  useEffect(() => {
    if (triggerSignIn && triggerSignIn > 0) {
      handleSubmit("create account");
    }
  }, [triggerSignIn]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join("");
          setInputValue(transcript);
        };
        recognitionRef.current.onend = () => setIsRecording(false);
        recognitionRef.current.onerror = () => setIsRecording(false);
      }
    }
  }, []);

  const handleLearnMore = (id: string) => {
    const solution = solutions.find((s) => s.id === id);
    if (solution) {
      onSolutionSelect(solution);
      onStateChange(4);
    }
  };

  const detectCards = (prompt: string, response: string): string[] => {
    const lower = prompt.toLowerCase();
    const lowerResp = response.toLowerCase();
    const matched: string[] = [];

    if (lower.includes("travel") || lower.includes("sapphire") || lower.includes("southwest")) {
      productItems.filter((c) => c.category === "Travel").forEach((c) => matched.push(c.id));
    }
    if (lower.includes("cash back") || lower.includes("cashback") || lower.includes("freedom")) {
      productItems.filter((c) => c.category === "Cash Back").forEach((c) => matched.push(c.id));
    }
    if (lower.includes("business") || lower.includes("ink") || lower.includes("ramp")) {
      productItems.filter((c) => c.category === "Business").forEach((c) => matched.push(c.id));
    }
    if (lower.includes("secured") || lower.includes("build credit") || lower.includes("no credit")) {
      productItems.filter((c) => c.category === "Secured").forEach((c) => matched.push(c.id));
    }
    if (lower.includes("no annual fee") || lower.includes("no fee") || lower.includes("$0")) {
      productItems.filter((c) => c.annualFee === "$0").forEach((c) => matched.push(c.id));
    }
    if (lower.includes("all card") || lower.includes("show me card") || lower.includes("available card")) {
      productItems.forEach((c) => matched.push(c.id));
    }
    if (lower.includes("compare") && lower.includes("sapphire")) {
      matched.push("chase-sapphire-preferred", "chase-sapphire-reserve");
    }

    // Detect from response
    if (matched.length === 0) {
      if (lowerResp.includes("sapphire preferred")) matched.push("chase-sapphire-preferred");
      if (lowerResp.includes("sapphire reserve")) matched.push("chase-sapphire-reserve");
      if (lowerResp.includes("freedom unlimited")) matched.push("chase-freedom-unlimited");
      if (lowerResp.includes("southwest")) {
        matched.push("southwest-plus");
        matched.push("southwest-priority");
      }
    }

    return [...new Set(matched)];
  };

  const handleSubmit = async (textOverride?: string) => {
    const prompt = textOverride || inputValue;
    if (!prompt.trim() || isLoading) return;

    setShowSuggestions(false);

    const newMessage: Message = {
      id: String(Date.now()),
      role: "user",
      content: prompt,
      type: "text",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);
    onStateChange(2);
    setThinkingSteps([]);

    const urlMatch = prompt.match(/https?:\/\/[^\s]+/);
    const steps = formatSteps(urlMatch?.[0]);
    const lower = prompt.toLowerCase();

    // ===== PRIORITY 1: Buy/checkout/address/demo — always handle first =====
    const buyKeywordsCheck = ["buy it", "buy this", "apply for", "get this card", "get it", "i want this", "i want it", "i want to buy", "purchase", "checkout", "sign up for", "enroll", "get this one", "i'll take", "buy the", "confirm", "yes apply", "yes buy", "go ahead"];
    const isBuyCheck = buyKeywordsCheck.some(k => lower.includes(k));
    const isConfirmCheck = ["confirm", "submit", "go ahead", "yes submit", "send it", "apply now"].includes(lower);
    const isAddressCheck = lower.includes("address") || lower.includes("my addresses") || lower.includes("add address") || lower.includes("change address");
    const isNewAddrCheck = lower.startsWith("new address:") || lower.startsWith("add:");
    const isSaveCheck = (lower.includes("save") && (lower.includes("profile") || lower.includes("info") || lower.includes("details") || lower.includes("changes"))) || lower === "yes save" || lower === "save it";
    const isDemoCheck = lower.includes("book a demo") || lower.includes("book demo") || lower.includes("schedule a demo") || lower.includes("schedule demo") || lower.includes("request a demo") || lower.includes("request demo") || lower.includes("contact sales") || lower.includes("talk to sales") || lower.includes("speak to sales") || lower.includes("get a demo") || lower.includes("want a demo") || lower.includes("set up a demo") || lower.includes("arrange a demo");

    // Detect if we're in a demo booking conversation
    const lastAssistantMsgForDemo = [...messages].reverse().find(m => m.role === "assistant")?.content || "";
    const isDemoFlow = lastAssistantMsgForDemo.includes("[DEMO_FLOW]") || lastAssistantMsgForDemo.includes("demo_step:");
    const isDemoAnswer = isDemoFlow && !isDemoCheck;

    // Skip classifier entirely for buy/address/save/demo intents
    const skipClassifier = isBuyCheck || isConfirmCheck || isAddressCheck || isNewAddrCheck || isSaveCheck || isDemoCheck || isDemoAnswer;

    // ===== PRIORITY 2: AI classifier for generate vs chat =====
    const intent = (!skipClassifier && onGenerateView) ? await classifyIntent(prompt, messages.slice(-4).map(m => `${m.role}: ${m.content.substring(0, 100)}`).join("\n")) : "chat";

    if (intent === "generate" && onGenerateView) {
      // Two-step code generation flow with visible thinking
      const thinkingSequence = [
        "Understanding your request...",
        "Planning the page structure...",
        "Choosing visualizations and charts...",
        "Generating content and data...",
        "Building the interactive page...",
        "Adding animations and interactivity...",
      ];

      // Show steps progressively
      let stepIdx = 0;
      const stepInterval = setInterval(() => {
        if (stepIdx < thinkingSequence.length) {
          setThinkingSteps((prev) => [...prev, thinkingSequence[stepIdx]]);
          stepIdx++;
        }
      }, 1500);

      try {
        const result = await generateVisualization(prompt);
        clearInterval(stepInterval);
        setThinkingSteps([]);
        setIsLoading(false);
        onStateChange(3);

        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1),
          role: "assistant",
          content: "Done! I've built an interactive page for you — check the left panel. You can explore it, view the source code, go fullscreen, or ask me to regenerate with different details.",
          type: "text",
          model: result.model,
        }]);

        onGenerateView(result.code, result.title, result.model);
      } catch {
        clearInterval(stepInterval);
        setThinkingSteps([]);
        setIsLoading(false);
        onStateChange(3);
        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1),
          role: "assistant",
          content: "I wasn't able to generate that. Could you try rephrasing? For example: 'Create a report about Visa merchant presence in France' or 'Build a dashboard showing card tier benefits'.",
          type: "text",
        }]);
      }
      return;
    }

    // ===== ACCOUNT CREATION FLOW =====
    const userStore = useUserStore.getState();

    // "create account" / "sign up" / "register"
    if ((lower.includes("create account") || lower.includes("create an account") || lower.includes("register") || (lower.includes("sign up") && !lower.includes("sign up for"))) && !userStore.isSignedIn) {
      setIsLoading(false); onStateChange(3);
      onShowAccountCreation?.();
      setMessages((prev) => [...prev, {
        id: String(Date.now() + 1), role: "assistant",
        content: "Let's create your account! I just need a few things:\n\nWhat's your full name? (first and last)",
        type: "text",
      }]);
      return;
    }

    // Detect if user is providing info for account creation (check last assistant message for context)
    // BUT skip if we're in a demo flow (demo_step markers take priority)
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant")?.content || "";
    const isInDemoFlow = lastAssistantMsg.includes("demo_step:");
    const isCollectingInfo = !isInDemoFlow && !userStore.isSignedIn && (
      lastAssistantMsg.includes("full name") ||
      lastAssistantMsg.includes("email address") ||
      lastAssistantMsg.includes("phone number") ||
      lastAssistantMsg.includes("shipping address") ||
      lastAssistantMsg.includes("annual income") ||
      lastAssistantMsg.includes("look correct")
    );

    if (isCollectingInfo) {
      setIsLoading(false); onStateChange(3);
      onShowAccountCreation?.();

      // Step 1: Got name → ask email
      if (lastAssistantMsg.includes("full name")) {
        const parts = prompt.trim().split(/\s+/);
        const firstName = parts[0] || prompt.trim();
        const lastName = parts.slice(1).join(" ") || "";
        userStore.updateProfile({ firstName, lastName });
        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1), role: "assistant",
          content: `Nice to meet you, ${firstName}! 👋\n\nWhat's your email address?`,
          type: "text",
        }]);
        return;
      }

      // Step 2: Got email → ask phone
      if (lastAssistantMsg.includes("email address")) {
        userStore.updateProfile({ email: prompt.trim() });
        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1), role: "assistant",
          content: `Got it! And your phone number? (or say "skip" to continue)`,
          type: "text",
        }]);
        return;
      }

      // Step 3: Got phone → ask address
      if (lastAssistantMsg.includes("phone number")) {
        if (lower !== "skip") userStore.updateProfile({ phone: prompt.trim() });
        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1), role: "assistant",
          content: `What's your shipping address?\n\nJust type it like: 123 Main St, New York, NY, 10001`,
          type: "text",
        }]);
        return;
      }

      // Step 4: Got address → ask income
      if (lastAssistantMsg.includes("shipping address")) {
        const parts = prompt.split(",").map(s => s.trim());
        if (parts.length >= 3) {
          userStore.addAddress({
            label: "Home", street: parts[0], city: parts[1],
            state: parts[2], zip: parts[3] || "", country: "US", isDefault: true,
          });
        }
        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1), role: "assistant",
          content: `Address saved! Last question — what's your annual income? (or say "skip")`,
          type: "text",
        }]);
        return;
      }

      // Step 5: Got income → confirm and create account
      if (lastAssistantMsg.includes("annual income")) {
        if (lower !== "skip") userStore.updateProfile({ income: prompt.trim().replace(/[$,]/g, "") });

        const p = useUserStore.getState().profile;
        const addr = useUserStore.getState().getDefaultAddress();
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.firstName + " " + p.lastName)}&background=1A1F71&color=fff&size=128`;

        // Sign them in
        userStore.signIn({ ...p, avatar });

        let summary = `Your account is ready! Here's what I have:\n\n`;
        summary += `👤 ${p.firstName} ${p.lastName}\n`;
        summary += `📧 ${p.email}\n`;
        if (p.phone) summary += `📱 ${p.phone}\n`;
        if (addr) summary += `📍 ${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}\n`;
        if (p.income) summary += `💰 $${p.income}\n`;
        summary += `\nDoes everything look correct? Say "yes" to confirm, or tell me what to change.\n\nNext time you apply for a card, I'll fill everything automatically! 🎉`;

        setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: summary, type: "text" }]);
        return;
      }

      // Step 6: Confirmation
      if (lastAssistantMsg.includes("look correct")) {
        if (lower === "yes" || lower === "looks good" || lower === "correct" || lower === "perfect") {
          setMessages((prev) => [...prev, {
            id: String(Date.now() + 1), role: "assistant",
            content: `Welcome aboard, ${userStore.profile.firstName}! 🎉 Your account is all set.\n\nYou can now:\n• Apply for any card instantly — I'll fill everything for you\n• Say "my addresses" to manage your addresses\n• Ask me anything about Visa cards and solutions\n\nWhat would you like to do?`,
            type: "text",
          }]);
          return;
        }
      }
    }

    // Detect buy/checkout/apply intent — handle autonomously
    const isBuyIntent = isBuyCheck;

    // Address management in chat
    const isAddressIntent = lower.includes("address") || lower.includes("my addresses") || lower.includes("add address") || lower.includes("change address") || lower.includes("remove address");

    if (isAddressIntent) {
      const user = useUserStore.getState();
      setIsLoading(false);
      onStateChange(3);

      if (!user.isSignedIn) {
        setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: "You need to sign in first to manage your addresses. Click 'Sign In' at the top right.", type: "text" }]);
        return;
      }

      const addrs = user.profile.addresses;
      if (lower.includes("add")) {
        setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: "To add a new address, type it like this:\n\nnew address: Home, 456 Oak Avenue, New York, NY, 10001, US\n\n(Format: label, street, city, state, zip, country)", type: "text" }]);
        return;
      }

      if (addrs.length === 0) {
        setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: "You don't have any saved addresses yet. Type 'add address' to add one, or I'll ask during checkout.", type: "text" }]);
      } else {
        const list = addrs.map((a, i) => `${a.isDefault ? "→ " : "  "}${i + 1}. ${a.label}: ${a.street}, ${a.city}, ${a.state} ${a.zip}${a.isDefault ? " (default)" : ""}`).join("\n");
        setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: `Your saved addresses:\n\n${list}\n\nSay 'add address' to add a new one, or 'remove address 1' to delete.`, type: "text" }]);
      }
      return;
    }

    // Parse "new address: ..." command
    if (lower.startsWith("new address:") || lower.startsWith("add:")) {
      const user = useUserStore.getState();
      if (!user.isSignedIn) {
        setIsLoading(false); onStateChange(3);
        setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: "Sign in first to save addresses.", type: "text" }]);
        return;
      }
      const parts = prompt.replace(/^(new address|add):\s*/i, "").split(",").map(s => s.trim());
      if (parts.length >= 4) {
        user.addAddress({ label: parts[0] || "Home", street: parts[1] || "", city: parts[2] || "", state: parts[3] || "", zip: parts[4] || "", country: parts[5] || "US", isDefault: user.profile.addresses.length === 0 });
        setIsLoading(false); onStateChange(3);
        setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: `Address saved: "${parts[0]}" at ${parts[1]}, ${parts[2]}. You now have ${user.profile.addresses.length + 1} address(es).`, type: "text" }]);
        return;
      }
    }

    // ===== DEMO BOOKING CONVERSATIONAL FLOW =====
    if (isDemoCheck) {
      const user = useUserStore.getState();
      setIsLoading(false); onStateChange(3);

      if (user.isSignedIn && user.profile.firstName && user.profile.email) {
        // Signed in — offer to book with their info
        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1), role: "assistant",
          content: `I'd be happy to book a demo for you! Since you're signed in, I already have some of your details:\n\n👤 ${user.profile.firstName} ${user.profile.lastName}\n📧 ${user.profile.email}\n\nI just need a few more things. What's your job title?\n\n<!--demo_step:title-->`,
          type: "text",
        }]);
      } else {
        // Not signed in — start from scratch
        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1), role: "assistant",
          content: `I'd love to set up a demo for you! Let me gather a few details so our sales team can reach out.\n\nWhat's your full name?\n\n<!--demo_step:name-->`,
          type: "text",
        }]);
      }
      return;
    }

    // Handle demo flow conversation steps
    if (isDemoAnswer) {
      const user = useUserStore.getState();
      setIsLoading(false); onStateChange(3);

      // Extract current step from hidden marker
      const stepMatch = lastAssistantMsgForDemo.match(/<!--demo_step:(\w+)-->/);
      const currentStep = stepMatch?.[1] || "";

      if (currentStep === "name") {
        const parts = prompt.trim().split(/\s+/);
        const firstName = parts[0] || prompt.trim();
        const lastName = parts.slice(1).join(" ") || "";
        // Store temporarily in a data attribute approach — use message content
        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1), role: "assistant",
          content: `Nice to meet you, ${firstName}! What's your business email address?\n\n<!--demo_step:email-->[DEMO_DATA:name=${firstName} ${lastName}]`,
          type: "text",
        }]);
        return;
      }

      if (currentStep === "email") {
        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1), role: "assistant",
          content: `Got it! And what's your job title?\n\n<!--demo_step:title-->[DEMO_DATA:email=${prompt.trim()}]`,
          type: "text",
        }]);
        return;
      }

      if (currentStep === "title") {
        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1), role: "assistant",
          content: `What company are you with?\n\n<!--demo_step:company-->[DEMO_DATA:title=${prompt.trim()}]`,
          type: "text",
        }]);
        return;
      }

      if (currentStep === "company") {
        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1), role: "assistant",
          content: `What type of company is ${prompt.trim()}?\n\n1. Bank or Financial Institution\n2. Fintech or Technology Partner\n3. Enterprise Business\n4. Small Business\n5. Government\n\nJust type the number or the name.\n\n<!--demo_step:companyType-->[DEMO_DATA:company=${prompt.trim()}]`,
          type: "text",
        }]);
        return;
      }

      if (currentStep === "companyType") {
        const typeMap: Record<string, string> = {
          "1": "Banks & Financial Institution", "2": "Fintech & Technology Partner",
          "3": "Enterprise Business", "4": "Small Business", "5": "Government",
          "bank": "Banks & Financial Institution", "fintech": "Fintech & Technology Partner",
          "enterprise": "Enterprise Business", "small": "Small Business", "government": "Government",
        };
        const companyType = typeMap[lower] || typeMap[lower.split(" ")[0]] || prompt.trim();

        const productMap: Record<string, string[]> = {
          "Banks & Financial Institution": ["Visa Direct", "Visa Token Service", "Click to Pay", "Visa B2B Connect", "Fraud & Risk Solutions"],
          "Fintech & Technology Partner": ["Visa Developer Platform", "Visa Direct", "Visa Token Service", "Click to Pay", "Tap to Pay"],
          "Enterprise Business": ["Commercial Card Programs", "Visa Direct", "Virtual Card Solutions", "Cross-Border Payments"],
          "Small Business": ["Business Credit Cards", "Tap to Pay", "Click to Pay", "Visa Direct"],
          "Government": ["Government Payment Solutions", "Visa Direct", "Commercial & Government Cards"],
        };
        const products = productMap[companyType] || productMap["Small Business"]!;
        const productList = products.map((p, i) => `${i + 1}. ${p}`).join("\n");

        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1), role: "assistant",
          content: `Which product or solution are you most interested in?\n\n${productList}\n\nJust type the number or name.\n\n<!--demo_step:product-->[DEMO_DATA:companyType=${companyType}]`,
          type: "text",
        }]);
        return;
      }

      if (currentStep === "product") {
        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1), role: "assistant",
          content: `Last thing — anything specific you'd like to cover in the demo? Or just say "no" and I'll submit it.\n\n<!--demo_step:message-->[DEMO_DATA:product=${prompt.trim()}]`,
          type: "text",
        }]);
        return;
      }

      if (currentStep === "message") {
        // Collect all demo data from conversation history
        let demoName = "", demoEmail = "", demoTitle = "", demoCompany = "", demoCompanyType = "", demoProduct = "", demoMessage = prompt.trim();
        if (demoMessage.toLowerCase() === "no" || demoMessage.toLowerCase() === "nope") demoMessage = "";

        // Extract data from DEMO_DATA markers in past messages
        for (const msg of messages) {
          const dataMatch = msg.content.match(/\[DEMO_DATA:(\w+)=([^\]]+)\]/);
          if (dataMatch) {
            const [, key, value] = dataMatch;
            if (key === "name") demoName = value;
            if (key === "email") demoEmail = value;
            if (key === "title") demoTitle = value;
            if (key === "company") demoCompany = value;
            if (key === "companyType") demoCompanyType = value;
            if (key === "product") demoProduct = value;
          }
        }

        // If signed in, use account data for name/email
        if (user.isSignedIn) {
          demoName = demoName || `${user.profile.firstName} ${user.profile.lastName}`;
          demoEmail = demoEmail || user.profile.email;
        }

        // Build confirmation
        let summary = `Here's your demo request:\n\n`;
        summary += `👤 ${demoName}\n`;
        summary += `📧 ${demoEmail}\n`;
        if (demoTitle) summary += `💼 ${demoTitle}\n`;
        if (demoCompany) summary += `🏢 ${demoCompany}`;
        if (demoCompanyType) summary += ` (${demoCompanyType})`;
        if (demoCompany) summary += `\n`;
        if (demoProduct) summary += `📦 Interest: ${demoProduct}\n`;
        if (demoMessage) summary += `💬 "${demoMessage}"\n`;
        summary += `\nShall I submit this? Say "yes" to confirm!\n\n<!--demo_step:confirm-->`;

        setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: summary, type: "text" }]);
        return;
      }

      if (currentStep === "confirm") {
        if (lower === "yes" || lower === "confirm" || lower === "submit" || lower === "send it" || lower === "go ahead" || lower === "sure" || lower === "yep" || lower === "yeah") {
          setMessages((prev) => [...prev, {
            id: String(Date.now() + 1), role: "assistant",
            content: `✅ Done! Your demo request has been submitted to our sales team.\n\nHere's what happens next:\n\n1️⃣ Our team will review your request and match you with a specialist\n2️⃣ You'll receive a calendar invite within 1-2 business days\n3️⃣ Get a personalized demo tailored to your needs\n\nIs there anything else I can help you with?`,
            type: "text",
          }]);
          return;
        } else {
          setMessages((prev) => [...prev, {
            id: String(Date.now() + 1), role: "assistant",
            content: `No problem! Let me know what you'd like to change, or say "book a demo" to start over.`,
            type: "text",
          }]);
          return;
        }
      }
    }

    if (isBuyIntent && onApplyCard) {
      const user = useUserStore.getState();

      // Find target card
      let targetCardId = "";
      for (const card of productItems) { if (lower.includes(card.name.toLowerCase())) { targetCardId = card.id; break; } }
      if (!targetCardId) {
        if (lower.includes("sapphire preferred")) targetCardId = "chase-sapphire-preferred";
        else if (lower.includes("sapphire reserve")) targetCardId = "chase-sapphire-reserve";
        else if (lower.includes("freedom unlimited")) targetCardId = "chase-freedom-unlimited";
        else if (lower.includes("freedom rise")) targetCardId = "chase-freedom-rise";
        else if (lower.includes("ink business")) targetCardId = "ink-business-unlimited";
      }
      if (!targetCardId) {
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          if (msg.role === "assistant") {
            for (const card of productItems) {
              if (msg.content.toLowerCase().includes(card.name.toLowerCase())) { targetCardId = card.id; break; }
            }
          }
          if (msg.cardIds?.length) { targetCardId = targetCardId || msg.cardIds[0]; }
          if (targetCardId) break;
        }
      }

      if (!targetCardId) {
        setIsLoading(false); onStateChange(3);
        setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: "Which card would you like? Say the name or ask me to show options.", type: "text" }]);
        return;
      }

      const card = productItems.find(c => c.id === targetCardId);

      // SIGNED IN — friendly conversational checkout
      if (user.isSignedIn && user.profile.firstName && user.profile.email) {
        const addr = user.getDefaultAddress();
        const addrText = addr ? `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}` : "not set yet";
        const hasAddr = !!addr;

        setIsLoading(false); onStateChange(3);

        // Open the form on the left (pre-filled)
        onApplyCard(targetCardId);

        // Send friendly confirmation in chat
        let msg = `Great choice! I've filled in your application for the ${card?.name} (${card?.tier}, ${card?.annualFee}/yr) on the left panel. Here's what I have:\n\n`;
        msg += `👤 Name: ${user.profile.firstName} ${user.profile.lastName}\n`;
        msg += `📧 Email: ${user.profile.email}\n`;
        if (user.profile.phone) msg += `📱 Phone: ${user.profile.phone}\n`;
        if (hasAddr) msg += `📍 Shipping: ${addrText}\n`;
        if (user.profile.income) msg += `💰 Income: $${user.profile.income}\n`;

        if (user.profile.addresses.length > 1) {
          msg += `\nUsing your "${addr?.label}" address. You have ${user.profile.addresses.length} saved addresses — say "my addresses" to switch.`;
        }

        msg += `\n\nEverything look good? You can:\n• Edit anything directly on the left panel\n• Say "change address" to use a different one\n• Say "submit" when you're ready!\n\nI'm here if you need any changes 😊`;

        setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: msg, type: "text" }]);
        return;
      }

      // NOT SIGNED IN — conversational account creation
      setIsLoading(false); onStateChange(3);
      setMessages((prev) => [...prev, {
        id: String(Date.now() + 1), role: "assistant",
        content: `Great choice! The ${card?.name} is a ${card?.tier} card with ${card?.annualFee}/yr annual fee.\n\nI'd love to help you apply. I just need a few details. Would you like to:\n\n1️⃣ **Create an account** — I'll save your info so next time it's instant checkout (just say "create account")\n2️⃣ **Quick apply** — Give me your details right here in the chat and I'll fill the form for you\n\nWhat's your preference? Or just tell me your name and I'll get started! 😊`,
        type: "text",
      }]);
      return;
    }

    // Handle "confirm"/"submit" for checkout
    if ((lower === "confirm" || lower === "submit" || lower === "go ahead" || lower === "yes submit" || lower === "send it" || lower === "apply now") && onApplyCard) {
      const user = useUserStore.getState();
      // Find last discussed card
      let cardId = "";
      for (let i = messages.length - 1; i >= 0; i--) {
        const c = messages[i].content;
        if (messages[i].role === "assistant" && (c.includes("application for") || c.includes("Applying for"))) {
          for (const card of productItems) {
            if (c.includes(card.name)) { cardId = card.id; break; }
          }
          break;
        }
      }
      if (cardId) {
        const card = productItems.find(c => c.id === cardId);
        setIsLoading(false); onStateChange(3);

        let confirmMsg = `✅ Your application for the ${card?.name} has been submitted!\n\n`;
        if (user.isSignedIn) {
          confirmMsg += `You'll receive a confirmation at ${user.profile.email} within 7-10 business days.\n\n`;
          confirmMsg += `Your details have been saved to your account for future applications. No need to re-enter next time! 🎉`;
        } else {
          confirmMsg += `Keep an eye on your inbox for the confirmation.\n\n💡 Sign in to save your details for next time — it'll be instant checkout!`;
        }

        setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: confirmMsg, type: "text" }]);
        onApplyCard(cardId); // Shows the confirmation view
        return;
      }
    }

    // Handle "save" — save modifications back to profile
    if ((lower.includes("save") && (lower.includes("profile") || lower.includes("info") || lower.includes("details") || lower.includes("changes"))) || lower === "yes save" || lower === "save it") {
      const user = useUserStore.getState();
      if (user.isSignedIn) {
        setIsLoading(false); onStateChange(3);
        setMessages((prev) => [...prev, {
          id: String(Date.now() + 1), role: "assistant",
          content: "Done! Your profile has been updated with the latest information. It'll be pre-filled next time you apply for a card. 👍",
          type: "text",
        }]);
        return;
      }
    }

    const runSteps = async () => {
      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 220));
        setThinkingSteps((prev) => [...prev, step]);
      }
    };

    const callApi = async () => {
      try {
        const solutionList = solutions.map((s) => `- ${s.name}: ${s.tagline} (${s.category})`).join("\n");
        const cardList = productItems.map((c) => `- ${c.name} (${c.issuer}): ${c.tier}, Annual fee ${c.annualFee}, Category: ${c.category}`).join("\n");
        const response = await getAssistantResponse(prompt, solutionList + "\n\nAvailable Visa Cards:\n" + cardList);
        return response;
      } catch {
        return { content: getFallbackResponse(prompt), model: "Fallback" };
      }
    };

    const [, result] = await Promise.all([runSteps(), callApi()]);
    const rawContent = result?.content?.trim() ? result.content : getFallbackResponse(prompt);
    const safeResult = cleanMarkdown(rawContent);
    const usedModel = result?.model || "Fallback";

    // Detect solution references
    let detectedSolutionIds: string[] = [];
    let type: Message["type"] = "text";
    const lowerResult = safeResult.toLowerCase();

    // Detect card references
    let detectedCardIds = detectCards(prompt, safeResult);

    if (detectedCardIds.length > 0) {
      type = "cards";
    } else if (lower.includes("commerce") || lower.includes("online store") || lower.includes("checkout") || lower.includes("accept payment") || lower.includes("e-commerce") || lower.includes("ecommerce")) {
      detectedSolutionIds = ["click-to-pay"];
      type = "recommendation";
    } else if (lower.includes("all solution") || lower.includes("catalog")) {
      detectedSolutionIds = solutions.map((s) => s.id);
      type = "catalog";
    } else if (lower.includes("click to pay") || lower.includes("click-to-pay")) {
      detectedSolutionIds = ["click-to-pay"];
      type = "recommendation";
    } else if (lower.includes("contactless") || lower.includes("tap to pay")) {
      detectedSolutionIds = solutions.filter((s) => s.category === "Payments").map((s) => s.id);
      type = detectedSolutionIds.length > 1 ? "catalog" : "recommendation";
    } else if (lower.includes("security") || lower.includes("fraud") || lower.includes("token") || lower.includes("zero liability")) {
      detectedSolutionIds = solutions.filter((s) => s.category === "Security").map((s) => s.id);
      type = "recommendation";
    } else if (lower.includes("developer") || lower.includes("api")) {
      detectedSolutionIds = ["visa-developer"];
      type = "recommendation";
    } else if (lower.includes("visa direct") || lower.includes("send money")) {
      detectedSolutionIds = ["visa-direct"];
      type = "recommendation";
    } else if (lower.includes("debit")) {
      detectedSolutionIds = ["visa-debit"];
      type = "recommendation";
    } else if (lower.includes("prepaid")) {
      detectedSolutionIds = ["visa-prepaid"];
      type = "recommendation";
    } else if (lower.includes("compare") && (lower.includes("tier") || lower.includes("traditional") || lower.includes("signature") || lower.includes("infinite"))) {
      // Tier comparison — show all cards for comparison table
      detectedCardIds = productItems.map(c => c.id);
      type = "cards";
    } else {
      // Smart detection: scan BOTH user prompt AND AI response for solution mentions
      const combined = lower + " " + lowerResult;

      if (combined.includes("click to pay") || combined.includes("click-to-pay")) detectedSolutionIds.push("click-to-pay");
      if (combined.includes("tap to pay") || combined.includes("contactless payment")) detectedSolutionIds.push("tap-to-pay");
      if (combined.includes("visa direct") || combined.includes("push payment") || combined.includes("real-time payment")) detectedSolutionIds.push("visa-direct");
      if (combined.includes("token service") || combined.includes("tokenization")) detectedSolutionIds.push("visa-token-service");
      if (combined.includes("b2b connect") || combined.includes("cross-border")) detectedSolutionIds.push("visa-b2b-connect");
      if (combined.includes("agentic commerce") || combined.includes("trusted agent")) detectedSolutionIds.push("agentic-commerce");
      if (combined.includes("developer platform") || combined.includes("visa api")) detectedSolutionIds.push("visa-developer");
      if (combined.includes("visa infinite") && !detectedSolutionIds.includes("visa-infinite")) detectedSolutionIds.push("visa-infinite");
      if (combined.includes("visa signature") && !detectedSolutionIds.length) detectedSolutionIds.push("visa-signature");

      // Deduplicate
      detectedSolutionIds = [...new Set(detectedSolutionIds)];

      if (detectedSolutionIds.length === 1) type = "recommendation";
      else if (detectedSolutionIds.length > 1) type = "catalog";
    }

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now() + 1),
        role: "assistant",
        content: safeResult,
        type,
        solutionIds: detectedSolutionIds.length ? detectedSolutionIds : undefined,
        cardIds: detectedCardIds.length ? detectedCardIds : undefined,
        model: usedModel,
      },
    ]);

    setThinkingSteps([]);
    setIsLoading(false);
    onStateChange(3);

    // Show cards or comparison on the left panel
    if (detectedCardIds.length > 0) {
      const isCompare = lower.includes("compare") || lower.includes("vs") || lower.includes("versus") || lower.includes("difference");

      if (isCompare && onCompare) {
        // Open side-by-side comparison
        let title = "Card Comparison";
        if (lower.includes("sapphire")) title = "Sapphire Preferred vs Reserve";
        else if (lower.includes("traditional") || lower.includes("tier") || lower.includes("infinite") || lower.includes("signature")) title = "Visa Traditional vs Signature vs Infinite";
        onCompare(detectedCardIds, title);
      } else if (onCardsSelect) {
        // Open card browser
        let title = "Visa Cards";
        if (lower.includes("travel")) title = "Travel Credit Cards";
        else if (lower.includes("no annual fee") || lower.includes("no fee")) title = "No Annual Fee Cards";
        else if (lower.includes("business")) title = "Business Cards";
        else if (lower.includes("secured") || lower.includes("build credit")) title = "Secured Cards";
        else if (lower.includes("cash back")) title = "Cash Back Cards";
        else if (lower.includes("all")) title = "All Available Cards";
        onCardsSelect(detectedCardIds, title);
      }
    } else if (detectedSolutionIds.length >= 1) {
      // Show the first/primary solution on the left panel
      const match = solutions.find((s) => s.id === detectedSolutionIds[0]);
      if (match) onSolutionSelect(match);
    }

    // Show world map for country/global presence questions
    if ((lower.includes("countr") || lower.includes("global") || lower.includes("world") || lower.includes("where") && lower.includes("visa")) && onShowMap) {
      onShowMap();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    if (recognitionRef.current) {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  // Strip hidden demo flow markers from displayed messages
  const cleanDisplayContent = (content: string) =>
    content.replace(/<!--demo_step:\w+-->/g, "").replace(/\[DEMO_DATA:[^\]]+\]/g, "").replace(/\[DEMO_FLOW\]/g, "").trim();

  const renderAssistantContent = (message: Message) => {
    if (message.role !== "assistant") return null;
    return (
      <div className="group relative space-y-4 max-w-[95%]">
        <div className="max-w-[85%] rounded-3xl border border-neutral-200 bg-white p-4 text-sm leading-relaxed text-neutral-700 shadow-sm">
          {cleanDisplayContent(message.content)}
        </div>

        {/* Card carousel */}
        {message.type === "cards" && message.cardIds && (
          <CardCarousel cards={message.cardIds.map((id) => productItems.find((c) => c.id === id)!).filter(Boolean)} onCardClick={onCardsSelect} />
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
            placeholder={isRecording ? "Listening..." : "Ask about Visa cards, payments, security..."}
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
          Visa Intelligence responses are for informational purposes. Visa — Everywhere you want to be.
        </p>
      </div>

    </div>
  );
};
