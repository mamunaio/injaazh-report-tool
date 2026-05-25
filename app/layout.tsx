import type { Metadata, Viewport } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

/**
 * Production site URL.
 * Set NEXT_PUBLIC_SITE_URL in .env / hosting environment to override.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://injaazh.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Injaazh — AI Report Architect | Multi-Source SEO Audit Generator",
    template: "%s · Injaazh",
  },
  description:
    "Generate enterprise-grade SEO and technical audit reports from multiple screenshots in seconds. Injaazh's cinematic AI engine extracts metrics, cross-references data across tools, and engineers a 5-month strategic roadmap. Free to use, no signup required.",
  applicationName: "Injaazh Report Architect",
  authors: [{ name: "Injaazh" }],
  generator: "Next.js",
  keywords: [
    "SEO audit report",
    "AI SEO report generator",
    "technical SEO audit",
    "PageSpeed report",
    "Lighthouse report generator",
    "Core Web Vitals analysis",
    "multi-source SEO analysis",
    "screenshot to report",
    "AI audit tool",
    "Gemini Vision SEO",
    "Injaazh",
    "SEO roadmap generator",
    "5-month SEO plan",
  ],
  referrer: "origin-when-cross-origin",
  creator: "Injaazh",
  publisher: "Injaazh",
  category: "Technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Injaazh",
    title: "Injaazh — AI Report Architect | Multi-Source SEO Audit Generator",
    description:
      "Drop multiple SEO or technical audit screenshots. Our cinematic AI engine extracts metrics, cross-references data, exposes critical issues, and engineers a comprehensive 5-month strategic roadmap.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Injaazh — Architect a Master Report from multiple screenshots",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Injaazh — AI Report Architect",
    description:
      "Generate enterprise-grade SEO audit reports from multiple screenshots in seconds with Gemini Vision AI.",
    images: ["/og-image.png"],
    creator: "@injaazh",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070709" },
    { media: "(prefers-color-scheme: light)", color: "#070709" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // JSON-LD structured data — helps search engines understand the app
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#webapp`,
        name: "Injaazh Report Architect",
        url: SITE_URL,
        description:
          "AI-powered SEO and technical audit report generator. Upload multiple screenshots and receive a cinematic, enterprise-grade report with a 5-month strategic roadmap.",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any (Web)",
        browserRequirements: "Requires JavaScript and a modern browser.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        creator: {
          "@type": "Organization",
          name: "Injaazh",
          url: SITE_URL,
        },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Injaazh",
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Injaazh — AI Report Architect",
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-US",
      },
    ],
  };

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          // Structured data is static, dangerouslySetInnerHTML is the
          // standard Next.js pattern for embedding JSON-LD.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased text-white selection:bg-gold-400/30 selection:text-white" suppressHydrationWarning>
        <div className="relative z-10">{children}</div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(11,11,16,0.85)",
              color: "#ececf2",
              border: "1px solid rgba(212,175,55,0.25)",
              backdropFilter: "blur(12px)",
              borderRadius: "14px",
              fontFamily: "var(--font-body), system-ui, sans-serif",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#d4af37", secondary: "#0b0b10" },
            },
            error: {
              iconTheme: { primary: "#ff6b6b", secondary: "#0b0b10" },
            },
          }}
        />
      </body>
    </html>
  );
}
