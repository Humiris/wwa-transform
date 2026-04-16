"use server";

import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "");

export interface Attachment {
  data: string;
  mimeType: string;
  name: string;
}

const SYSTEM_PROMPT = `You are a helpful brand specialist. You help users find the right brand product and understand brand products.

IDENTITY (only if asked directly):
- If asked "who are you": say you're the Brand Agent, a specialist for brand products and payment solutions.
- If asked "who built you" or "who developed you": say you were developed by Iris Lab as part of their WWA platform.
- NEVER introduce yourself or mention Iris Lab unprompted. Just answer the user's question directly.

RULES:
1. Be professional, warm, and concise. Get straight to the point.
2. Do NOT use markdown formatting (no asterisks, no bold, no headers). Plain text only.
3. Keep responses to 2-4 sentences. Be direct and helpful.
4. NEVER start with "I am the Brand Agent" or any self-introduction. Just answer the question.
5. When the user mentions a country, acknowledge it. Provide helpful information about the brand products and services.
6. When comparing cards, highlight key differences clearly (fees, rewards, benefits).
7. Ask a short follow-up question to understand needs better.
8. Key stats: 200+ countries, 180 currencies, 150M+ merchants, 4B+ cards worldwide.
9. When discussing enterprise solutions, B2B products, or complex integrations, naturally offer "I can book a demo with our sales team if you'd like to learn more" — but only when it makes sense.
10. If the user seems interested in a product for their business, proactively suggest booking a demo.`;

export async function getAssistantResponse(
  prompt: string,
  solutionList: string,
  attachments: Attachment[] = []
) {
  let lastError = null;

  // PRIMARY: Gemini 3.1 Flash Lite
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

      const parts: any[] = [
        {
          text: `${SYSTEM_PROMPT}\n\nAvailable products:\n${solutionList}\n\nUser: ${prompt}`,
        },
      ];

      for (const attachment of attachments) {
        parts.push({
          inlineData: { data: attachment.data, mimeType: attachment.mimeType },
        });
      }

      const result = await model.generateContent(parts);
      const response = await result.response;
      return {
        content: response.text(),
        model: "Gemini 3.1 Flash Lite",
      };
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      lastError = error;
    }
  }

  // FALLBACK: OpenAI GPT-5.4
  if (process.env.OPENAI_API_KEY) {
    try {
      const messages: any[] = [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\nAvailable products:\n${solutionList}`,
        },
      ];

      const userContent: any[] = [{ type: "text", text: prompt }];

      for (const attachment of attachments) {
        if (attachment.mimeType.startsWith("image/")) {
          userContent.push({
            type: "image_url",
            image_url: { url: `data:${attachment.mimeType};base64,${attachment.data}` },
          });
        } else {
          userContent.push({
            type: "text",
            text: `[User attached a document: ${attachment.name}]`,
          });
        }
      }

      messages.push({ role: "user", content: userContent });

      const response = await openai.chat.completions.create({
        model: "gpt-5.4",
        messages,
        temperature: 0.7,
      });

      return {
        content: response.choices[0].message.content,
        model: "GPT-5.4",
      };
    } catch (error: any) {
      console.error("OpenAI API Error:", error);
      lastError = error;
    }
  }

  if (lastError) {
    throw new Error(`Assistant failed: ${lastError.message}`);
  }

  return { content: null, model: "None" };
}

export async function classifyIntent(prompt: string, conversationContext?: string): Promise<"chat" | "generate" | "clarify"> {
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!geminiKey) return "chat";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
    const result = await model.generateContent([{
      text: `Classify this user request. Reply with ONLY one word: "generate" or "chat".

IMPORTANT: Most requests are "chat". Only use "generate" for VERY specific cases.

"chat" = DEFAULT. Use for almost everything:
- Asking about cards: "show me travel cards", "show me business cards", "what cards have no fee" → chat
- Asking about products: "how does tap to pay work", "what is Solution A" → chat
- Comparing: "compare Sapphire vs Reserve", "compare tiers" → chat
- Questions: "what are the benefits", "who are you", "tell me about security" → chat
- Buying/applying: "buy it", "apply for this card", "I want this one" → chat
- Any short question or request that can be answered with text + existing UI → chat

"generate" = ONLY when the user explicitly asks to CREATE a NEW document, report, or visualization that doesn't exist in the app:
- "create a report about brand in France" → generate
- "make a document explaining brand for my business" → generate
- "build a dashboard of transaction stats" → generate
- "generate a map of merchants in Tokyo" → generate
- "make an infographic about card benefits" → generate
- "create a presentation about brand security" → generate

KEY RULE: If the request is about showing EXISTING data (cards, solutions, comparisons, tiers), it's ALWAYS "chat". Only use "generate" when the user wants a BRAND NEW custom page/document/report/visualization created from scratch.

${conversationContext ? `Recent conversation:\n${conversationContext}\n\n` : ""}User request: "${prompt}"
Reply with ONLY "generate" or "chat":`
    }]);
    const response = await result.response;
    const answer = response.text().trim().toLowerCase();
    if (answer.includes("generate")) return "generate";
    return "chat";
  } catch {
    return "chat";
  }
}

const CODE_GEN_PROMPT = `You are an expert code-generating AI agent. You produce RICH, COMPREHENSIVE, PREMIUM HTML pages — not small widgets. Think of yourself as building a full professional report, dashboard, or interactive experience.

CRITICAL OUTPUT RULES:
1. Return ONLY raw HTML. No explanation, no markdown, no backticks. Start with <!DOCTYPE html>.
2. The page MUST be a complete standalone HTML document with inline <style> and <script>.
3. The page MUST scroll and be VERY LONG — minimum 5-8 rich sections. Never make a tiny page.

DESIGN SYSTEM:
- Colors: primary #1A1F71, accent #F7B600, bg dark #0a0f2e, bg sections alternate #0d1533 / #111b45, text white, muted #8892b0
- Font: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif
- Border radius: 16px for cards, 24px for sections
- Shadows: 0 4px 24px rgba(0,0,0,0.3)
- Smooth CSS transitions and scroll-triggered fade-in animations (use IntersectionObserver)
- Glass effects: backdrop-filter: blur(20px); background: rgba(255,255,255,0.05)

CDN LIBRARIES (use them heavily):
- Leaflet maps: <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/> <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
- Chart.js: <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
- D3.js: <script src="https://d3js.org/d3.v7.min.js"></script>
- Animate on scroll: use IntersectionObserver with CSS transitions

PAGE STRUCTURE (always include ALL of these):
1. HERO HEADER — full-width dark gradient with "VISA" logo (white text), page title, subtitle, and key stat badges
2. EXECUTIVE SUMMARY — 3-4 stat cards in a grid (big numbers with labels, gold accents)
3. PRIMARY VISUALIZATION — the main chart, map, or interactive element (LARGE, at least 400px tall)
4. DATA TABLE or COMPARISON — a styled table or grid with rows of data, alternating row colors
5. SECONDARY CHARTS — 2-3 additional charts (bar, line, donut, radar) in a grid layout
6. INSIGHTS SECTION — key takeaways as numbered cards with icons (use Unicode icons like ✦ ◆ ▶)
7. DETAILS/BREAKDOWN — expandable sections or card grid with more detailed info
8. FOOTER — "Powered by Brand" with the current year

INTERACTIVITY:
- Hover effects on all cards (scale, shadow, border glow)
- Animated counters for statistics (count up on scroll)
- Chart tooltips with detailed info
- Click to filter on data tables
- Smooth scroll-triggered animations (elements fade in as you scroll)
- If showing a map: add 15-30 markers with popup info on click

DATA QUALITY:
- Generate REALISTIC sample data — real city names, plausible numbers, authentic percentages
- Use specific numbers (not round): e.g., "2,847 merchants" not "3,000 merchants"
- Include dates, growth percentages, regional breakdowns
- Make the data tell a story

VISA KNOWLEDGE BASE:
- 200+ countries and territories, 180 currencies
- 4 billion+ cards worldwide, 150 million+ merchant locations
- 14,500+ financial institution partners
- 65,000+ transactions per second processing capacity
- $14.8 trillion annual payment volume
- Card tiers: Basic Tier (6 benefits), Standard Tier (7+ benefits), Premium Tier (15 standard benefits)
- Products: Solution E (<1 sec), Solution A (real-time payments to 7B+ endpoints), Solution D (tokenized online checkout), Solution B (fraud reduction), B2B Connect (cross-border bank-to-bank), Agentic Commerce (AI agent transactions)
- Zero Liability Policy: funds replaced within 5 business days
- Emergency card replacement: 24-72 hours globally
- Key markets by region: North America (800M+ cards), Europe (900M+ cards), Asia Pacific (1.4B+ cards), Latin America (600M+ cards), Middle East & Africa (300M+ cards)
- Top countries by merchant count: US (12M+), India (8M+), Brazil (6M+), UK (4M+), France (2.4M+), Germany (2.1M+), Japan (3.5M+), Australia (1.8M+)

REMEMBER: Make it LONG, RICH, and IMPRESSIVE. This should look like a premium consulting report, not a simple widget.`;

const PLAN_PROMPT = `You are a senior product designer planning an interactive web page. Given a user request, create a DETAILED plan for what to build.

Reply with a JSON object (no markdown, no backticks, just raw JSON):
{
  "title": "Short title for the page (max 60 chars)",
  "type": "report | dashboard | map | chart | document | infographic | presentation",
  "sections": [
    { "name": "Section name", "type": "hero | stats | chart | map | table | cards | text | comparison | timeline | gallery", "description": "What this section shows", "data_needed": "What data to generate" }
  ],
  "charts": ["bar | line | donut | radar | area — list which chart types to use"],
  "map_needed": true/false,
  "color_scheme": "Which accent colors besides brand colors",
  "key_metrics": ["List the 4-6 key numbers/stats to highlight"],
  "tone": "professional | playful | technical | executive"
}

Think carefully about what would make this page IMPRESSIVE and USEFUL. Include 6-10 sections minimum.`;

export async function generateVisualization(prompt: string): Promise<{ code: string; title: string; model: string; plan?: string }> {
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    // Fallback to OpenAI if no Gemini key
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5.4",
          messages: [
            { role: "system", content: CODE_GEN_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 16000,
        });
        const title = prompt.length > 60 ? prompt.substring(0, 57) + "..." : prompt;
        return { code: response.choices[0].message.content || "", title, model: "GPT-5.4" };
      } catch (error: any) {
        throw new Error(`Code generation failed: ${error.message}`);
      }
    }
    throw new Error("No AI API key configured");
  }

  // STEP 1: Plan — ask AI to think about what to build
  let plan = "";
  try {
    const planner = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      generationConfig: { maxOutputTokens: 2000, temperature: 0.7 }
    });
    const planResult = await planner.generateContent([{
      text: PLAN_PROMPT + "\n\nUser request: " + prompt
    }]);
    plan = planResult.response.text() || "";
  } catch {
    plan = '{"title":"' + prompt.substring(0, 50) + '","type":"report","sections":[{"name":"Overview","type":"text","description":"Main content"}],"charts":["bar"],"map_needed":false,"key_metrics":["200+ countries"],"tone":"professional"}';
  }

  // Extract title from plan
  let title = prompt.length > 60 ? prompt.substring(0, 57) + "..." : prompt;
  try {
    const parsed = JSON.parse(plan.replace(/```json\n?/g, "").replace(/```/g, "").trim());
    if (parsed.title) title = parsed.title;
  } catch { /* use default title */ }

  // STEP 2: Build — generate the actual HTML using the plan
  try {
    const builder = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      generationConfig: { maxOutputTokens: 30000, temperature: 0.8 }
    });

    const buildPrompt = `${CODE_GEN_PROMPT}

PLAN (follow this structure precisely):
${plan}

ORIGINAL USER REQUEST: ${prompt}

Now generate the COMPLETE HTML page following the plan above. Make it LONG (minimum 2000 lines of code), RICH (many sections), and INTERACTIVE (animations, hover effects, charts, scroll effects). Every section in the plan must be implemented. Use all the chart types specified. Include animated counters, glassmorphism cards, gradient backgrounds, and smooth scroll-triggered animations using IntersectionObserver.`;

    const buildResult = await builder.generateContent([{ text: buildPrompt }]);
    const code = buildResult.response.text() || "";

    return { code, title, model: "Gemini 3.1 Flash Lite", plan };
  } catch (error: any) {
    // If build fails, try OpenAI fallback
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5.4",
          messages: [
            { role: "system", content: CODE_GEN_PROMPT + "\n\nPLAN:\n" + plan },
            { role: "user", content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 16000,
        });
        return { code: response.choices[0].message.content || "", title, model: "GPT-5.4", plan };
      } catch (e: any) {
        throw new Error(`Code generation failed: ${e.message}`);
      }
    }
    throw new Error(`Code generation failed: ${error.message}`);
  }
}
