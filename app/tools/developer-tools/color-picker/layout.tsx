import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Color Picker — HEX to RGB with Your Browser’s Picker" },
  description: "Pick a color with your browser’s color picker or type a HEX code, with or without #, in 3, 4, 6 or 8 digits, then copy it as HEX or as rgb(r,g,b).",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/color-picker" },
  openGraph: {
    title: "Color Picker — HEX to RGB with Your Browser’s Picker",
    description: "Pick a color with your browser’s color picker or type a HEX code, with or without #, in 3, 4, 6 or 8 digits, then copy it as HEX or as rgb(r,g,b).",
    url: "https://www.onlineconvertools.com/tools/developer-tools/color-picker",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/color-picker">{children}</ToolSeo>;
}
