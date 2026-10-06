import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Protect PDF with a Password — AES-128 Encryption" },
  description: "Lock a PDF with an open password and AES-128 encryption, and choose whether readers may print, copy, edit, comment or rearrange its pages.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-protect" },
  openGraph: {
    title: "Protect PDF with a Password — AES-128 Encryption",
    description: "Lock a PDF with an open password and AES-128 encryption, and choose whether readers may print, copy, edit, comment or rearrange its pages.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-protect",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-protect">{children}</ToolSeo>;
}
