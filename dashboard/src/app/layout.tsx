import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SuiProvider } from "@/providers/SuiProvider";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FEN — Frontier Exchange Network",
  description: "Player-owned trade corridors for EVE Frontier on Sui. Register corridors, configure tolls, trade items, and swap via on-chain AMM pools.",
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
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="flex h-screen overflow-hidden font-sans">
        <SuiProvider>
          <ToastProvider>
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 md:p-8">
                {children}
              </main>
            </div>
          </ToastProvider>
        </SuiProvider>
      </body>
    </html>
  );
}
