import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Converter — Convert Images Between Png, Jpg, Webp" },
  description: "Image Converter is a free online tool that converts images between PNG, JPG, WebP, and AVIF entirely in your browser — nothing is ever uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-converter" },
  openGraph: {
    title: "Image Converter — Convert Images Between Png, Jpg, Webp",
    description: "Image Converter is a free online tool that converts images between PNG, JPG, WebP, and AVIF entirely in your browser — nothing is ever uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
