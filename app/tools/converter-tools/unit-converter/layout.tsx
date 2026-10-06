import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Unit Converter — 12 Categories with Exact Factors" },
  description: "Convert length, weight, temperature, fuel economy, data, pressure, energy, power and more with exact factors, shown to 12 significant digits.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/converter-tools/unit-converter" },
  openGraph: {
    title: "Unit Converter — 12 Categories with Exact Factors",
    description: "Convert length, weight, temperature, fuel economy, data, pressure, energy, power and more with exact factors, shown to 12 significant digits.",
    url: "https://www.onlineconvertools.com/tools/converter-tools/unit-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/converter-tools/unit-converter">{children}</ToolSeo>;
}
