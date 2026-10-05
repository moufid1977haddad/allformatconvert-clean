import { RELATED_TOOLS, TOOL_NAMES } from '@/app/lib/relatedTools';
import { SITE_CATEGORIES } from '@/app/lib/siteCategories';
import { ToolContextProvider } from './ToolContext';

// P35 (lot 3, S2 + S3): wraps every tool page in its server layout. Looks up the page's related tools (hand-chosen,
// app/lib/relatedTools.js — the whole map stays on the server) and its category, and gives them to SeoContent through
// ToolContext; SeoContent renders the block and the structured data from them.
// A tool missing from the map stops the build (scripts/p35/related-tools-check.mjs keeps it complete): no silent page
// without its block.
export default function ToolSeo({ path, children }: { path: string; children: React.ReactNode }) {
  const links = (RELATED_TOOLS as Record<string, string[]>)[path];
  const names = TOOL_NAMES as Record<string, string>;
  const slug = path.split('/')[2];
  const category = SITE_CATEGORIES.find((c) => c.slug === slug);
  if (!links || !category || !names[path]) throw new Error(`ToolSeo: ${path} has no related tools, name or category (app/lib/relatedTools.js)`);
  const value = {
    path,
    category: { name: category.name, path: category.href },
    related: links.map((href) => ({ href, label: names[href] })),
  };
  return <ToolContextProvider value={value}>{children}</ToolContextProvider>;
}
