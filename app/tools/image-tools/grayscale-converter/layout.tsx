import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Grayscale Converter — Turn a Color Image Online Free" },
  description: "Grayscale Converter turns a color image into black and white by averaging each pixel's red, green, and blue values, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/grayscale-converter" },
  openGraph: {
    title: "Grayscale Converter — Turn a Color Image Online Free",
    description: "Grayscale Converter turns a color image into black and white by averaging each pixel's red, green, and blue values, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/grayscale-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
