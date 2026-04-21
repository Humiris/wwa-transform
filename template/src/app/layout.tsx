import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Demo metadata — keep the noindex/nofollow tags. Every wwa.* transform is a
// brand-impersonation demo; search engines and Safe Browsing crawlers should
// not index these sites. Removing this is how the Booking demo got flagged.
export const metadata: Metadata = {
  title: `${BRAND.name} — AI Agentfront Demo`,
  description: `AI-generated agentfront demo. Not affiliated with or endorsed by ${BRAND.name}.`,
  robots: { index: false, follow: false, nocache: true },
  other: {
    "demo-disclaimer": `This is an AI-generated demo. Not affiliated with ${BRAND.name}.`,
  },
};

// Runtime brand palette. Every component that uses [var(--color-brand-*)] in
// Tailwind classes picks these up. Overrides the defaults in globals.css.
const brandPalette = `:root {
  --color-brand-primary: ${BRAND.primaryColor};
  --color-brand-secondary: ${BRAND.secondaryColor};
  --color-brand-accent: ${BRAND.accentColor};
}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandPalette }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Demo disclaimer banner — REQUIRED. Do not remove.
            Satisfies Chrome Safe Browsing's brand-phishing heuristic + gives
            legal clarity that this is an AI-generated demo, not the real brand. */}
        <div
          role="alert"
          style={{
            background: "#000",
            color: "#fff",
            padding: "10px 16px",
            fontSize: "12px",
            textAlign: "center",
            lineHeight: 1.4,
            borderBottom: "1px solid rgba(255,255,255,0.2)",
            position: "relative",
            zIndex: 100,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <strong style={{ fontWeight: 700 }}>DEMO</strong> — AI-generated agentfront showcase by Iris Lab / Codiris. Not affiliated with or endorsed by {BRAND.name}. For the official site, visit{" "}
          <a href={BRAND.websiteUrl} style={{ color: "#fff", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer">
            {BRAND.websiteUrl.replace(/^https?:\/\//, "")}
          </a>
          .
        </div>
        {children}
      </body>
    </html>
  );
}
