import type { Metadata } from 'next';
import { SEO } from './seo';
import ToolSeo from '@/app/components/ToolSeo';

// P36 (06/10): title and description written here, where the content checks read them; seo.js keeps the path, example and links.
const url = 'https://www.onlineconvertools.com' + SEO.path;

export const metadata: Metadata = {
  title: { absolute: "TOML to JSON Converter — Cargo.toml, pyproject.toml & More" },
  description: "Paste TOML and get indented JSON: tables become nested objects, dates ISO strings, and large integers keep every digit. Parsed by smol-toml.",
  alternates: { canonical: url },
  openGraph: { title: "TOML to JSON Converter — Cargo.toml, pyproject.toml & More", description: "Paste TOML and get indented JSON: tables become nested objects, dates ISO strings, and large integers keep every digit. Parsed by smol-toml.", url },
};

// The page is a 'use client' component and can't export metadata itself; this layout hosts it. Its structured data is
// rendered by SeoContent from the page's visible texts since P35 (ToolSeo: related tools + JSON-LD).
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSeo path="/tools/developer-tools/toml-to-json">{children}</ToolSeo>
    </>
  );
}
