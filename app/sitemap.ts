import { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.onlineconvertools.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, priority: 1.0 },
    { url: `${baseUrl}/tools`, priority: 0.9 },
    { url: `${baseUrl}/about`, priority: 0.7 },
    { url: `${baseUrl}/contact`, priority: 0.7 },
    { url: `${baseUrl}/privacy`, priority: 0.3 },
    { url: `${baseUrl}/terms`, priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = [];
  const toolPages: MetadataRoute.Sitemap = [];

  const toolsDir = path.join(process.cwd(), "app", "tools");
  const categories = fs
    .readdirSync(toolsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  for (const category of categories) {
    categoryPages.push({
      url: `${baseUrl}/tools/${category.name}`,
      priority: 0.8,
      changeFrequency: "weekly",
      lastModified: new Date(),
    });

    const categoryDir = path.join(toolsDir, category.name);
    const slugs = fs
      .readdirSync(categoryDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory());

    for (const slug of slugs) {
      const pageExists = ["page.jsx", "page.js", "page.tsx"].some((f) =>
        fs.existsSync(path.join(categoryDir, slug.name, f))
      );
      if (!pageExists) continue;

      const layoutPath = ["layout.tsx", "layout.ts", "layout.jsx", "layout.js"]
        .map((f) => path.join(categoryDir, slug.name, f))
        .find((p) => fs.existsSync(p));
      if (layoutPath) {
        const layoutSource = fs.readFileSync(layoutPath, "utf-8");
        const isNoindex = /robots\s*:\s*\{[^}]*index\s*:\s*false/s.test(layoutSource);
        if (isNoindex) continue;
      }

      toolPages.push({
        url: `${baseUrl}/tools/${category.name}/${slug.name}`,
        priority: 0.6,
        changeFrequency: "monthly",
        lastModified: new Date(),
      });
    }
  }

  return [...staticPages, ...categoryPages, ...toolPages];
}
