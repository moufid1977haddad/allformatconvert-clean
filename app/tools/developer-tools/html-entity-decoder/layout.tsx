import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "HTML Entity Decoder — &amp;, &nbsp;, &#8364; to Characters" },
  description: "Turn &amp;, &nbsp;, &eacute; or &#x1F600; into real characters without stripping tags. Useful for feed, CMS or e-mail source text.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/html-entity-decoder" },
  openGraph: {
    title: "HTML Entity Decoder — &amp;, &nbsp;, &#8364; to Characters",
    description: "Turn &amp;, &nbsp;, &eacute; or &#x1F600; into real characters without stripping tags. Useful for feed, CMS or e-mail source text.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/html-entity-decoder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/html-entity-decoder">{children}</ToolSeo>;
}
