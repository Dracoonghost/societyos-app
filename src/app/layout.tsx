import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { BillingProvider } from "@/contexts/BillingContext";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, organizationJsonLd, siteConfig, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

/* ---------- Fonts ---------- */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

/* ---------- SEO Metadata ---------- */
export const metadata: Metadata = {
  metadataBase: absoluteUrl(),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: absoluteUrl(siteConfig.ogImage),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} preview image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    creator: siteConfig.xHandle,
    images: [absoluteUrl(siteConfig.ogImage)],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/* ---------- Root Layout ---------- */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <AuthProvider>
          <BillingProvider>
            {children}
          </BillingProvider>
        </AuthProvider>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#18212c",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#edf2f7",
              fontSize: "0.875rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            },
          }}
        />
      </body>
    </html>
  );
}
