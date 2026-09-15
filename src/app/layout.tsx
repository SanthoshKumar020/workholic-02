import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { CareerChatWrapper } from "@/components/CareerChatWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@/components/Analytics";
import { LanguageProvider, LANG_COOKIE } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/translations";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://zenvy.vercel.app";
const SITE_NAME = "ZENVY";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});
const TAGLINE = "Your complete AI career platform in one place";
const DESCRIPTION =
  "Free AI resume builder, ATS score checker, mock interview coach, and job match analyzer. Land your next job faster — built in India, free to start. ₹299 for 90 days.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `ZENVY — ${TAGLINE}`,
    template: `%s · ZENVY`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  // NOTE: the `keywords` meta tag was removed. Google has ignored it since
  // 2009 and Bing treats it as a spam signal, so it did nothing here except
  // date the site to anyone technical viewing source. Keywords belong in the
  // H1, the body copy and the URL — all of which this site already does.
  authors: [{ name: "Santo Square Automation" }],
  creator: "Santo Square Automation",
  category: "careers",
  alternates: { canonical: APP_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: SITE_NAME,
    title: `ZENVY — ${TAGLINE}`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `ZENVY — ${TAGLINE}`,
    description: DESCRIPTION,
    creator: "@zenvy",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  verification: {
    // Add your Google Search Console verification code here:
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
  },
};

// JSON-LD structured data — helps Google show rich results (SoftwareApp).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  operatingSystem: "Web",
  applicationCategory: "BusinessApplication",
  description: DESCRIPTION,
  url: APP_URL,
  inLanguage: "en-IN",
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "INR",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "30",
      priceCurrency: "INR",
    },
  ],
  // NOTE: an `aggregateRating` was removed here. It claimed 1,240 ratings that
  // don't exist. Google's structured-data policy treats unverifiable review
  // markup as spam and it can trigger a manual action on the whole domain —
  // a real risk for a site that is trying to rank. Add it back only when the
  // ratings come from actual, on-page, user-submitted reviews.
  publisher: {
    "@type": "Organization",
    name: "Santo Square Automation",
    url: APP_URL,
    email: "kumarsanthosh2743@gmail.com",
    contactPoint: {
      "@type": "ContactPoint",
      email: "kumarsanthosh2743@gmail.com",
      contactType: "customer support",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the saved language preference server-side so the very first render
  // is already in the right language — avoids a flash of English before a
  // saved Tamil preference kicks in on the client.
  const cookieLocale = cookies().get(LANG_COOKIE)?.value;
  const initialLocale: Locale = cookieLocale === "ta" ? "ta" : "en";

  return (
    <html lang={initialLocale === "ta" ? "ta" : "en"} suppressHydrationWarning>
      <head>
        {/* JSON-LD structured data for rich Google results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} min-h-screen flex flex-col bg-[#f8f9ff] font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100`}>
        <ThemeProvider>
          <LanguageProvider initialLocale={initialLocale}>
            {children}
            <Toaster position="bottom-right" richColors />
            <CareerChatWrapper />
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
