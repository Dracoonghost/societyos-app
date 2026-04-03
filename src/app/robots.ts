import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/methodology", "/demo", "/founder"],
        disallow: [
          "/login",
          "/dashboard",
          "/account",
          "/reviews",
          "/simulations",
          "/competitor-analysis",
          "/my-brand",
          "/audiences",
          "/context-packs",
          "/share",
        ],
      },
    ],
    sitemap: "https://societyos.ai/sitemap.xml",
    host: "https://societyos.ai",
  };
}
