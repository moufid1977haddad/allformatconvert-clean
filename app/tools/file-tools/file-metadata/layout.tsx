import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "File Metadata Viewer — Real Format, EXIF, PDF, Office Info" },
  description: "See the name, size, date and real format of a file, read from its first bytes, plus EXIF and GPS, PDF, Office, ZIP or MP3 tags, without uploading it.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/file-metadata" },
  openGraph: {
    title: "File Metadata Viewer — Real Format, EXIF, PDF, Office Info",
    description: "See the name, size, date and real format of a file, read from its first bytes, plus EXIF and GPS, PDF, Office, ZIP or MP3 tags, without uploading it.",
    url: "https://www.onlineconvertools.com/tools/file-tools/file-metadata",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/file-tools/file-metadata">{children}</ToolSeo>;
}
