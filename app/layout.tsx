import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Injaazh — AI Report Architect",
  description:
    "Cinematic AI-powered audit report generator by Injaazh. Upload an SEO/Technical screenshot and receive an enterprise-grade glassmorphism report.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans antialiased text-white selection:bg-gold-400/30 selection:text-white">
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
