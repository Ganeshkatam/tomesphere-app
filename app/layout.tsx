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
import { Toaster } from 'react-hot-toast';
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
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
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
          {/* Global Components */}
        </PWAProvider>
        {/* Global Toaster with styled configuration */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#dcfce7' },
              style: { borderColor: 'rgba(34, 197, 94, 0.3)' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fee2e2' },
              style: { borderColor: 'rgba(239, 68, 68, 0.3)' },
              duration: 5000,
            },
          }}
        />
      </body>
    </html>
  );
}
