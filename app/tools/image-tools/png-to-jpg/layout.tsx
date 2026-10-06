import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PNG to JPG Converter — Pick the Background for Transparency" },
  description: "Convert a PNG to JPG with a quality slider (92 to start) and the color of your choice for transparent areas. The PNG stays on your device.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/png-to-jpg" },
  openGraph: {
    title: "PNG to JPG Converter — Pick the Background for Transparency",
    description: "Convert a PNG to JPG with a quality slider (92 to start) and the color of your choice for transparent areas. The PNG stays on your device.",
    url: "https://www.onlineconvertools.com/tools/image-tools/png-to-jpg",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/png-to-jpg">{children}</ToolSeo>;
}
