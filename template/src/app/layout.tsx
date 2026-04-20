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

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.agentName}`,
  description: BRAND.tagline,
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
        {children}
      </body>
    </html>
  );
}
