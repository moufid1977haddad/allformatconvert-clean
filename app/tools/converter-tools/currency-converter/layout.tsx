import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Currency Converter — Daily Rates and 10-Year Rate History" },
  description: "Convert an amount between world currencies at the rate ExchangeRate-API publishes daily, then chart the pair over 1 week to 10 years. Free, no account.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/converter-tools/currency-converter" },
  openGraph: {
    title: "Currency Converter — Daily Rates and 10-Year Rate History",
    description: "Convert an amount between world currencies at the rate ExchangeRate-API publishes daily, then chart the pair over 1 week to 10 years. Free, no account.",
    url: "https://www.onlineconvertools.com/tools/converter-tools/currency-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/converter-tools/currency-converter">{children}</ToolSeo>;
}
