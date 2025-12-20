'use client';

import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import Footer from "@/components/Footer";
import StudentNav from "@/components/StudentNav";
import InstallPWA from "@/components/InstallPWA";
import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";
import QuickAccessSidebar from "@/components/QuickAccessSidebar";
import { usePathname } from "next/navigation";
import GakaVoiceListenerWeb from '@/components/GakaVoiceListenerWeb';
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import { PWAProvider } from "@/lib/pwa-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Show StudentNav on all student feature pages
  const studentPaths = [
    '/academic',
    '/citations',
    '/notes',
    '/exam-prep',
    '/analytics',
    '/study-groups',
    '/textbook-exchange'
  ];

  const showStudentNav = studentPaths.some(path => pathname?.startsWith(path));

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <head>
        <title>TomeSphere - Discover Your Next Favorite Book</title>
        <meta name="description" content="A comprehensive book discovery platform with AI-powered recommendations, curated collections, and personalized reading lists." />

        {/* PWA Metadata */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TomeSphere" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <PWAProvider>
          <ThemeProvider>
            {showStudentNav && <StudentNav />}
            <div className="min-h-screen flex flex-col">
              <main className="flex-1">
                <GlobalErrorBoundary>
                  {children}
                </GlobalErrorBoundary>
              </main>
              <Footer />
            </div>
            <InstallPWA />
            <PWAUpdatePrompt />
            <QuickAccessSidebar />
          </ThemeProvider>
          <GakaVoiceListenerWeb />
        </PWAProvider>
      </body>
    </html>
  );
}
