import type { Metadata } from "next";
import { Orbitron, Outfit, DM_Sans } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700", "900"],
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CRE Intelligence — Commercial Real Estate Analytics",
  description:
    "Futuristic commercial real estate analytics dashboard with live FRED, Census, and news data. Built for the Triangle NC market and beyond.",
  keywords: ["CRE", "commercial real estate", "analytics", "Triangle NC", "FRED", "market intelligence"],
  authors: [{ name: "Alexander Vaslef" }],
  openGraph: {
    title: "CRE Intelligence Dashboard",
    description: "Live commercial real estate analytics — macroeconomics, market tiers, Triangle NC deep dive.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${outfit.variable} ${dmSans.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
