import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: "https://societyos.ai/",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://societyos.ai/pricing",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://societyos.ai/methodology",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: "https://societyos.ai/demo",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://societyos.ai/demo/review",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://societyos.ai/demo/simulation",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://societyos.ai/founder",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.65,
    },
  ];
}
