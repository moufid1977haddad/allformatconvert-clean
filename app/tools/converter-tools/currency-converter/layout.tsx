import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Currency Converter — Convert Between 24 Major World" },
  description: "Currency Converter converts between 166 world currencies, with their full names, using daily exchange rates fetched directly in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/converter-tools/currency-converter" },
  openGraph: {
    title: "Currency Converter — Convert Between 24 Major World",
    description: "Currency Converter converts between 166 world currencies, with their full names, using daily exchange rates fetched directly in your browser.",
    url: "https://www.onlineconvertools.com/tools/converter-tools/currency-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
