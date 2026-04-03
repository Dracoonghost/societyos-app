import type { Metadata } from "next";

const SITE_URL = "https://societyos.ai";
const SITE_NAME = "SocietyOS";
const DEFAULT_TITLE = "SocietyOS | AI Decision Lab for Founders and Operators";
const DEFAULT_DESCRIPTION =
  "Validate decisions before you build, launch, or spend. SocietyOS combines AI expert panels, audience simulations, and decision-ready artifacts in one workspace.";
const OG_IMAGE_PATH = "/opengraph-image";

export const siteConfig = {
  name: SITE_NAME,
  url: SITE_URL,
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  ogImage: OG_IMAGE_PATH,
  xHandle: "@societyos",
};

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL);
}

type MetadataOptions = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: MetadataOptions): Metadata {
  const url = path ? absoluteUrl(path) : undefined;

  return {
    title,
    description,
    alternates: path
      ? {
          canonical: path,
        }
      : undefined,
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: absoluteUrl(OG_IMAGE_PATH),
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} preview image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: siteConfig.xHandle,
      images: [absoluteUrl(OG_IMAGE_PATH)],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : undefined,
  };
}

export function createNoIndexMetadata(title: string, description: string): Metadata {
  return createPageMetadata({ title, description, noIndex: true });
}

export function createBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path).toString(),
    })),
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/logo.svg").toString(),
  sameAs: ["https://societyos.ai"],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
  },
};
