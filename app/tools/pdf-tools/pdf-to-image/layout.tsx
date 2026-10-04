import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF to Image — PNG, JPG, WebP, TIFF, BMP, Online Free" },
  description: "PDF to Image: pages as PNG, JPG, WebP, TIFF or BMP at 72, 150 or 300 dpi, or extract the pictures inside. Choose pages; in your browser on a computer (on iPhone or iPad, a page the device cannot draw is drawn by our PDF service, then deleted).",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-image" },
  openGraph: {
    title: "PDF to Image — PNG, JPG, WebP, TIFF, BMP, Online Free",
    description: "PDF to Image: pages as PNG, JPG, WebP, TIFF or BMP at 72, 150 or 300 dpi, or extract the pictures inside. Choose pages; in your browser on a computer (on iPhone or iPad, a page the device cannot draw is drawn by our PDF service, then deleted).",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-image",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
