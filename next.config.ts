import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Strip "X-Powered-By: Next.js" header — small SEO/security hygiene.
  poweredByHeader: false,
  // Compress responses for faster page loads (also a Core Web Vitals factor).
  compress: true,
  // Keep these large native/binary deps OUT of the bundler so the serverless
  // function bundle stays small and Chromium loads correctly on Vercel.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        // Apply security + SEO-friendly headers globally.
        source: "/:path*",
        headers: [
          // Prevents MIME sniffing — security hardening.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Modern referrer policy preserving origin context only.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Lock down sensitive browser features we don't need.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          // Allow framing only on same origin.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      {
        // Belt-and-suspenders: tell crawlers to NOT index API responses.
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
