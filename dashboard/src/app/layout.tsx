import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SuiProvider } from "@/providers/SuiProvider";

export const metadata: Metadata = {
  title: "FEN — Frontier Exchange Network",
  description: "Player-owned trade corridors for EVE Frontier",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen overflow-hidden">
        <SuiProvider>
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </SuiProvider>
      </body>
    </html>
  );
}
