import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@/shared/layout/layout.css";
import { Providers } from "./providers";
import { themeInitScript } from "./theme-init";
import { createSupabaseServerClient } from "@/shared/core/database/server";
import { SupabaseAnnouncementReadModel } from "@/modules/announcements/infrastructure/read-models/SupabaseAnnouncementReadModel";
import { GetActiveAnnouncementsQueryHandler } from "@/modules/announcements/application/queries/GetActiveAnnouncements/handler";
import { AnnouncementBanner } from "@/modules/announcements/presentation/components/AnnouncementBanner";
import { AnnouncementNotice } from "@/modules/announcements/presentation/components/AnnouncementNotice";
import CookieConsentBanner from "@/components/cookies/CookieConsentBanner";
import { SpeedInsights } from "@vercel/speed-insights/next";

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
  variable: "--font-atkinson",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
  variable: "--font-source-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://tomesphere.in"),
  title: {
    default: "TomeSphere - Digital Book Discovery & Reader",
    template: "%s | TomeSphere",
  },
  description:
    "Discover, explore, and read digital books with TomeSphere. A comprehensive platform with curated recommendations, archival collections, and personalized reading streaks.",
  keywords: [
    "books",
    "digital books",
    "book discovery",
    "online reading",
    "TomeSphere",
    "annotations",
    "ebooks",
    "curated collections",
  ],
  authors: [{ name: "TomeSphere Editorial Team" }],
  creator: "TomeSphere",
  publisher: "TomeSphere",
  icons: {
    icon: [
      { url: "/logo.png?v=3", type: "image/png" },
      { url: "/icon.png?v=3", type: "image/png" },
      { url: "/favicon.ico?v=3" },
    ],
    shortcut: "/logo.png?v=3",
    apple: "/logo.png?v=3",
  },
  openGraph: {
    type: "website",
    siteName: "TomeSphere",
    locale: "en_US",
    title: "TomeSphere - Digital Book Discovery & Reader",
    description:
      "Discover, explore, and read digital books with TomeSphere. Curated collections, personalized lists, and rich annotations.",
    url: "https://tomesphere.in",
  },
  twitter: {
    card: "summary_large_image",
    title: "TomeSphere - Digital Book Discovery & Reader",
    description:
      "Discover, explore, and read digital books with TomeSphere.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: "#6366f1",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let activeAnnouncements: any[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    const announcementsRepo = new SupabaseAnnouncementReadModel(supabase);
    const announcementsQuery = new GetActiveAnnouncementsQueryHandler(announcementsRepo);
    activeAnnouncements = await announcementsQuery.execute().catch(() => []);
  } catch {
    activeAnnouncements = [];
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${atkinson.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="icon" href="/logo.png?v=3" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/logo.png?v=3" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png?v=3" />
        <script
          id="theme-init-script"
          dangerouslySetInnerHTML={{
            __html: themeInitScript,
          }}
          suppressHydrationWarning
        />
      </head>
      <body className="antialiased font-sans flex flex-col min-h-screen" suppressHydrationWarning>
        <Providers>
          {/* Universal Maintenance & System Announcement Banner Across All Routes */}
          <AnnouncementBanner announcements={activeAnnouncements} />
          <AnnouncementNotice announcements={activeAnnouncements} />
          <CookieConsentBanner />
          {children}
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
