import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent the page from being embedded in an iframe (clickjacking protection)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control referrer information
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser features
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Enable XSS protection in older browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Tie the build ID to a deploy-time env var injected by Northflank, falling back
  // to a timestamp. This lets Next.js detect build/client mismatches and trigger a
  // hard reload instead of surfacing "Failed to find Server Action" errors.
  generateBuildId: async () => {
    return process.env.GIT_SHA || process.env.BUILD_ID || Date.now().toString();
  },
  // Map runtime env vars so Northflank can inject them without a rebuild.
  // All NEXT_PUBLIC_* values here are read at server startup from process.env.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAwOYjBldcL6Y33_ZwcgL-gX-kGs0Ec_S4",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "societyos-acdc4.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "societyos-acdc4",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "societyos-acdc4.firebasestorage.app",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "902450452448",
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:902450452448:web:928ed55f081e0fe827fd85",
  },
  async headers() {
    return [
      {
        // Prevent browsers from caching HTML pages — ensures clients always get
        // fresh page HTML (and thus fresh Server Action IDs) after a redeploy.
        source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot|css|js)).*)",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        // Static assets can be cached aggressively — Next.js content-hashes them.
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
