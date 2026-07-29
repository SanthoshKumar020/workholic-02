import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { CareerChatWrapper } from "@/components/CareerChatWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@/components/Analytics";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hyrise.swache.in";
const SITE_NAME = "HYRISE";
const TAGLINE = "Your complete AI career platform in one place";
const DESCRIPTION =
  "Free AI resume builder, ATS score checker, mock interview coach, and job match analyzer. Land your next job faster — built in India, free to start. ₹30/mo Pro.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `HYRISE — ${TAGLINE}`,
    template: `%s · HYRISE`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  // NOTE: the `keywords` meta tag was removed. Google has ignored it since
  // 2009 and Bing treats it as a spam signal, so it did nothing here except
  // date the site to anyone technical viewing source. Keywords belong in the
  // H1, the body copy and the URL — all of which this site already does.
  authors: [{ name: "Swache Technologies (OPC) Private Limited" }],
  creator: "Swache Technologies (OPC) Private Limited",
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
    title: `HYRISE — ${TAGLINE}`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `HYRISE — ${TAGLINE}`,
    description: DESCRIPTION,
    creator: "@hyrise",
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
    name: "Swache Technologies (OPC) Private Limited",
    url: APP_URL,
    email: "admin@swache.in",
    address: {
      "@type": "PostalAddress",
      streetAddress: "L 303, Rohan Upavan, Kyalasanahalli, Kothanur",
      addressLocality: "Bangalore North",
      addressRegion: "Karnataka",
      postalCode: "560077",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "admin@swache.in",
      contactType: "customer support",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD structured data for rich Google results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#f8f9ff] text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" richColors />
          <CareerChatWrapper />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
