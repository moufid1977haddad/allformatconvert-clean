import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Diff Viewer — Line-by-Line Text Diff with Line Numbers" },
  description: "Compare an original and a modified text in one column: removed lines in red, added lines in green, changed words highlighted, both line numbers.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/diff-viewer" },
  openGraph: {
    title: "Diff Viewer — Line-by-Line Text Diff with Line Numbers",
    description: "Compare an original and a modified text in one column: removed lines in red, added lines in green, changed words highlighted, both line numbers.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/diff-viewer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/diff-viewer">{children}</ToolSeo>;
}
