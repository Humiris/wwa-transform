/**
 * MCP Streamable HTTP endpoint — generic agentfront template.
 * JSON-RPC 2.0 per modelcontextprotocol.io. Stateless single-POST endpoint.
 *
 * Per-brand customization:
 *   - Tool names/descriptions come from BRAND-specific language in brand-config.ts
 *   - Tool implementations read from productItems (cards.ts) and solutions (solutions.ts)
 *   - Add brand-specific tools by appending to TOOLS and a new `case` in callTool
 */

import { NextRequest, NextResponse } from "next/server";
import { BRAND } from "@/lib/brand-config";
import { productItems } from "@/lib/cards";
import { solutions } from "@/lib/solutions";

export const runtime = "nodejs";

const PROTOCOL_VERSION = "2024-11-05";
const SERVER_INFO = { name: BRAND.mcpServerName, version: "1.0.0" };

const TOOLS = [
  {
    name: "search_products",
    description: `Search ${BRAND.name} ${BRAND.productLabel.toLowerCase()} by category, tier, price, or keyword.`,
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Product category filter." },
        tier: { type: "string", description: "Product tier." },
        priceUnder: { type: "number", description: "Maximum price as a number (strips non-numeric characters)." },
        query: { type: "string", description: "Free-text query matched against name, description, features." },
      },
    },
  },
  {
    name: "compare_products",
    description: `Side-by-side comparison of two or more ${BRAND.name} ${BRAND.productLabel.toLowerCase()} by id.`,
    inputSchema: {
      type: "object",
      properties: {
        ids: { type: "array", items: { type: "string" }, description: "Product ids to compare." },
      },
      required: ["ids"],
    },
  },
  {
    name: "get_solutions",
    description: `List ${BRAND.name} ${BRAND.solutionLabel.toLowerCase()} by category.`,
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Optional category filter." },
      },
    },
  },
  {
    name: "get_product",
    description: `Return full details for a single ${BRAND.name} product by id.`,
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Product id." },
      },
      required: ["productId"],
    },
  },
  {
    name: "recommend_product",
    description: `Personalized ${BRAND.name} product recommendation from a short preference description.`,
    inputSchema: {
      type: "object",
      properties: {
        preference: { type: "string", description: "Natural language description of what the customer wants." },
        priceMax: { type: "number", description: "Maximum price." },
      },
      required: ["preference"],
    },
  },
];

function ok(id: unknown, result: unknown) { return { jsonrpc: "2.0", id, result }; }
function err(id: unknown, code: number, message: string) { return { jsonrpc: "2.0", id, error: { code, message } }; }
function textContent(obj: unknown) {
  return { content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) }] };
}

function priceNumber(s: string): number {
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

function callTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "search_products": {
      const { category, tier, priceUnder, query } = args as {
        category?: string; tier?: string; priceUnder?: number; query?: string;
      };
      let results = productItems;
      if (category) results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
      if (tier) results = results.filter(p => p.tier.toLowerCase() === tier.toLowerCase());
      if (typeof priceUnder === "number") {
        results = results.filter(p => {
          const n = priceNumber(p.annualFee);
          return Number.isFinite(n) && n <= priceUnder;
        });
      }
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.features.some(f => f.toLowerCase().includes(q))
        );
      }
      return textContent({
        count: results.length,
        products: results.slice(0, 20).map(p => ({
          id: p.id, name: p.name, category: p.category, tier: p.tier,
          price: p.annualFee, image: p.image, description: p.description,
        })),
      });
    }

    case "compare_products": {
      const { ids } = args as { ids: string[] };
      if (!Array.isArray(ids) || ids.length < 1) return textContent({ error: "ids must be a non-empty array" });
      const found = ids.map(id => productItems.find(p => p.id === id)).filter(Boolean);
      return textContent({
        requested: ids,
        found: found.length,
        comparison: found.map((p) => ({
          id: p!.id, name: p!.name, category: p!.category, tier: p!.tier,
          price: p!.annualFee, features: p!.features, description: p!.description,
        })),
      });
    }

    case "get_solutions": {
      const { category } = args as { category?: string };
      const filtered = category
        ? solutions.filter(s => s.category.toLowerCase() === category.toLowerCase())
        : solutions;
      return textContent({
        count: filtered.length,
        solutions: filtered.map(s => ({
          id: s.id, name: s.name, tagline: s.tagline, category: s.category,
          description: s.description, image: s.image,
        })),
      });
    }

    case "get_product": {
      const { productId } = args as { productId: string };
      const p = productItems.find(x => x.id === productId);
      if (!p) return textContent({ error: `No product with id "${productId}"` });
      return textContent(p);
    }

    case "recommend_product": {
      const { preference, priceMax } = args as { preference: string; priceMax?: number };
      const pref = preference.toLowerCase();
      const scored = productItems.map(p => {
        let score = 0;
        const hay = `${p.name} ${p.description} ${p.category} ${p.tier} ${p.features.join(" ")}`.toLowerCase();
        for (const word of pref.split(/\s+/).filter(w => w.length > 2)) {
          if (hay.includes(word)) score += 2;
        }
        if (typeof priceMax === "number") {
          const n = priceNumber(p.annualFee);
          if (Number.isFinite(n) && n > priceMax) score -= 5;
        }
        return { p, score };
      }).sort((a, b) => b.score - a.score);
      const top = scored.slice(0, 3).filter(r => r.score > 0);
      if (top.length === 0) return textContent({ error: "No matching product found", suggestion: "Try broader keywords or adjust the price cap." });
      return textContent({
        preference,
        recommendations: top.map(r => ({
          id: r.p.id, name: r.p.name, price: r.p.annualFee, category: r.p.category,
          image: r.p.image, why: r.p.description, score: r.score,
        })),
      });
    }
  }
  return null;
}

function handleRpc(msg: { id?: unknown; method?: string; params?: Record<string, unknown> }) {
  const { id = null, method, params = {} } = msg ?? {};
  if (!method) return err(id, -32600, "Invalid Request: missing method");

  switch (method) {
    case "initialize":
      return ok(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      });
    case "notifications/initialized":
    case "initialized":
      return null;
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const { name, arguments: args = {} } = params as { name?: string; arguments?: Record<string, unknown> };
      if (!name) return err(id, -32602, "tools/call requires a name");
      const result = callTool(name, args);
      if (result === null) return err(id, -32601, `Unknown tool: ${name}`);
      return ok(id, result);
    }
    default:
      return err(id, -32601, `Method not found: ${method}`);
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    {
      server: SERVER_INFO,
      protocol: PROTOCOL_VERSION,
      transport: "streamable-http",
      tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
      usage: "POST JSON-RPC 2.0 to this endpoint. See modelcontextprotocol.io for the spec.",
    },
    { headers: CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error: invalid JSON"), { status: 400, headers: CORS_HEADERS });
  }

  if (Array.isArray(body)) {
    const responses = body.map(m => handleRpc(m)).filter(r => r !== null);
    return NextResponse.json(responses, { headers: CORS_HEADERS });
  }

  const response = handleRpc(body as { id?: unknown; method?: string; params?: Record<string, unknown> });
  if (response === null) return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
  return NextResponse.json(response, { headers: CORS_HEADERS });
}
