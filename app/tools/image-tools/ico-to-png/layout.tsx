import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "ICO to PNG — Extract Every Icon Size as a Separate PNG" },
  description: "Turn a Windows .ico icon into PNG: take its largest image, or every size stored inside as separate PNG files or one ZIP. All in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/ico-to-png" },
  openGraph: {
    title: "ICO to PNG — Extract Every Icon Size as a Separate PNG",
    description: "Turn a Windows .ico icon into PNG: take its largest image, or every size stored inside as separate PNG files or one ZIP. All in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/ico-to-png",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/ico-to-png">{children}</ToolSeo>;
}
