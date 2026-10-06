import type { Metadata } from 'next';
import { SEO } from './seo';
import ToolSeo from '@/app/components/ToolSeo';

// P36 (06/10): title and description written here, where the content checks read them; seo.js keeps the path, example and links.
const url = 'https://www.onlineconvertools.com' + SEO.path;

export const metadata: Metadata = {
  title: { absolute: "JSON to TOML Converter — Tables and Arrays of Tables" },
  description: "Paste a JSON object and get TOML: nested objects become [tables], arrays of objects [[tables]], null keys are left out and big integers kept.",
  alternates: { canonical: url },
  openGraph: { title: "JSON to TOML Converter — Tables and Arrays of Tables", description: "Paste a JSON object and get TOML: nested objects become [tables], arrays of objects [[tables]], null keys are left out and big integers kept.", url },
};

// The page is a 'use client' component and can't export metadata itself; this layout hosts it. Its structured data is
// rendered by SeoContent from the page's visible texts since P35 (ToolSeo: related tools + JSON-LD).
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSeo path="/tools/developer-tools/json-to-toml">{children}</ToolSeo>
    </>
  );
}
