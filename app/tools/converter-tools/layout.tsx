import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Converters: Currency, Units, Color Codes and MOBI to EPUB" },
  description: "Convert amounts at the day's exchange rate, units in 12 categories, colors between HEX, RGB, HSL, HSV and CMYK, and DRM-free MOBI ebooks to EPUB.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/converter-tools" },
  openGraph: {
    title: "Converters: Currency, Units, Color Codes and MOBI to EPUB",
    description: "Convert amounts at the day's exchange rate, units in 12 categories, colors between HEX, RGB, HSL, HSV and CMYK, and DRM-free MOBI ebooks to EPUB.",
    url: "https://www.onlineconvertools.com/tools/converter-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
