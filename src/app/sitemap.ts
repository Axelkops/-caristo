import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return ["", "/cgv", "/confidentialite", "/mentions-legales"].map((p) => ({ url: `${base}${p}`, lastModified: new Date() }));
}
