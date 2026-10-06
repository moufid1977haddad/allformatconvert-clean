import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Color Converter — HEX, RGB, HSL, HSV & CMYK with Alpha" },
  description: "Convert one color between HEX, RGB, HSL, HSV and CMYK, opacity included, and see its WCAG grade as text on white and black, with a Copy button per format.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/converter-tools/color-converter" },
  openGraph: {
    title: "Color Converter — HEX, RGB, HSL, HSV & CMYK with Alpha",
    description: "Convert one color between HEX, RGB, HSL, HSV and CMYK, opacity included, and see its WCAG grade as text on white and black, with a Copy button per format.",
    url: "https://www.onlineconvertools.com/tools/converter-tools/color-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/converter-tools/color-converter">{children}</ToolSeo>;
}
