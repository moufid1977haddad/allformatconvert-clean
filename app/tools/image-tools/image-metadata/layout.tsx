import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Image Metadata Viewer — EXIF, GPS, IPTC, XMP and Remover" },
  description: "See the EXIF, GPS, IPTC, XMP and ICC data in a photo, and remove it from a JPG, PNG or WebP without re-encoding. The file is read in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-metadata" },
  openGraph: {
    title: "Image Metadata Viewer — EXIF, GPS, IPTC, XMP and Remover",
    description: "See the EXIF, GPS, IPTC, XMP and ICC data in a photo, and remove it from a JPG, PNG or WebP without re-encoding. The file is read in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-metadata",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/image-metadata">{children}</ToolSeo>;
}
