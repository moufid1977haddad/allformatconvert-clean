import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "ZIP Extractor — Open ZIP, RAR and 7Z Files in Your Browser" },
  description: "Open ZIP, RAR, 7Z, TAR, GZ and other archives with 7-Zip and zip.js in your browser, including password-protected and split archives.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/zip-extractor" },
  openGraph: {
    title: "ZIP Extractor — Open ZIP, RAR and 7Z Files in Your Browser",
    description: "Open ZIP, RAR, 7Z, TAR, GZ and other archives with 7-Zip and zip.js in your browser, including password-protected and split archives.",
    url: "https://www.onlineconvertools.com/tools/file-tools/zip-extractor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/file-tools/zip-extractor">{children}</ToolSeo>;
}
