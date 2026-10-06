import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "TAR Extractor — Open .tar, .tar.gz and .tgz Files Online" },
  description: "Extract the files of a TAR, TAR.GZ or TGZ archive in your browser, with long and accented names kept. Download one file or all of them as a ZIP.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/tar-extractor" },
  openGraph: {
    title: "TAR Extractor — Open .tar, .tar.gz and .tgz Files Online",
    description: "Extract the files of a TAR, TAR.GZ or TGZ archive in your browser, with long and accented names kept. Download one file or all of them as a ZIP.",
    url: "https://www.onlineconvertools.com/tools/file-tools/tar-extractor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/file-tools/tar-extractor">{children}</ToolSeo>;
}
