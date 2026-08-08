import fs from "node:fs";
import path from "node:path";

const PAGE_FILES = ["page.jsx", "page.js", "page.tsx"];

// Server-only: scans app/tools/<category>/<slug>/page.* to count real, live tool pages.
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

    const count = slugs.filter((slug) =>
      PAGE_FILES.some((f) => fs.existsSync(path.join(categoryDir, slug.name, f)))
    ).length;

    counts[category.name] = count;
    total += count;
  }

  return { counts, total };
}
