import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SuiProvider } from "@/providers/SuiProvider";
import { ToastProvider } from "@/components/ui/Toast";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FEN — Frontier Exchange Network",
  description: "Player-owned trade corridors for EVE Frontier on Sui. Register corridors, configure tolls, trade items, and swap via on-chain AMM pools.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "FEN — Frontier Exchange Network",
    description: "Player-owned trade corridors for EVE Frontier on Sui",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FEN — Frontier Exchange Network",
    description: "Player-owned trade corridors for EVE Frontier on Sui",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${dmSans.variable} ${jetbrains.variable}`}>
      <body className="flex h-screen overflow-hidden font-sans">
        <SuiProvider>
          <ToastProvider>
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Suspense fallback={<div className="h-14 bg-eve-surface/50 backdrop-blur-xl border-b border-white/[0.06]" />}>
                <Header />
              </Suspense>
              <main className="flex-1 overflow-y-auto p-5 md:p-8 lg:p-10">
                {children}
              </main>
            </div>
          </ToastProvider>
        </SuiProvider>
      </body>
    </html>
  );
}
