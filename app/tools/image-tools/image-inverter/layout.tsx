import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Invert Image Colors — Photo Negative in One Click" },
  description: "Turn a picture into its color negative: each red, green and blue value is subtracted from 255. Transparency is kept; JPG, PNG and WebP keep their format.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-inverter" },
  openGraph: {
    title: "Invert Image Colors — Photo Negative in One Click",
    description: "Turn a picture into its color negative: each red, green and blue value is subtracted from 255. Transparency is kept; JPG, PNG and WebP keep their format.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-inverter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/image-inverter">{children}</ToolSeo>;
}
