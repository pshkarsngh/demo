import type { MetadataRoute } from "next";
import { COLLEGES } from "@/lib/data/colleges";

const BASE_URL = "https://campuspulse.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const collegePages = COLLEGES.map((c) => ({
    url: `${BASE_URL}/colleges/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/colleges`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...collegePages,
    { url: `${BASE_URL}/courses`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/compare`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/scholarships`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/resources`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/dashboard`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}