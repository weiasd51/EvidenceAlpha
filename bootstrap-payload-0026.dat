import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:5173"),
  title: "EvidenceAlpha｜证据驱动智能投研",
  description: "可追溯、可回放、可评测的 A 股多智能体研究系统。",
  openGraph: {
    title: "EvidenceAlpha｜证据驱动智能投研",
    description: "可追溯、可回放、可评测的 A 股多智能体研究系统。",
    images: [{ url: "/og.png", width: 1664, height: 952, alt: "EvidenceAlpha 证据驱动智能投研" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EvidenceAlpha｜证据驱动智能投研",
    description: "可追溯、可回放、可评测的 A 股多智能体研究系统。",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
