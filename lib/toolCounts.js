import fs from "node:fs";
import path from "node:path";

const PAGE_FILES = ["page.jsx", "page.js", "page.tsx"];
const LAYOUT_FILES = ["layout.tsx", "layout.ts", "layout.jsx", "layout.js"];

// A "Coming Soon" placeholder is the only kind of tool page marked noindex
// (image-generator, pdf-to-excel, pdf-to-ppt). It is not a working tool, so it
// is neither counted on the site nor listed in the sitemap.
export function isNoindexLayoutSource(source) {
  return /robots\s*:\s*\{[^}]*index\s*:\s*false/.test(source);
}

export function isComingSoonTool(toolDir) {
  const layoutPath = LAYOUT_FILES.map((f) => path.join(toolDir, f)).find((p) => fs.existsSync(p));
  return Boolean(layoutPath) && isNoindexLayoutSource(fs.readFileSync(layoutPath, "utf-8"));
}

// Server-only: scans app/tools/<category>/<slug>/page.* to count real, live
// (working) tool pages.
export function getToolCounts() {
  const toolsDir = path.join(process.cwd(), "app", "tools");
  const counts = {};
  let total = 0;

  const categories = fs
    .readdirSync(toolsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  for (const category of categories) {
    const categoryDir = path.join(toolsDir, category.name);
    const slugs = fs
      .readdirSync(categoryDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory());

    const count = slugs.filter((slug) => {
      const dir = path.join(categoryDir, slug.name);
      return PAGE_FILES.some((f) => fs.existsSync(path.join(dir, f))) && !isComingSoonTool(dir);
    }).length;

    counts[category.name] = count;
    total += count;
  }

  return { counts, total };
}
