import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { CareerChatWrapper } from "@/components/CareerChatWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "HYRISE — Elevate Your Future",
  description:
    "AI-powered career platform. Resume enhancement, ATS scoring, mock interviews, job matching, learning roadmaps, and more. Free to start.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-[#f8f9ff] text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" richColors />
          <CareerChatWrapper />
        </ThemeProvider>
      </body>
    </html>
  );
}
