import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PNG to ICO — Multi-Size favicon.ico, Choose the Sizes" },
  description: "Build a real multi-resolution favicon.ico from one PNG: pick the icon sizes and fit or crop a non-square image. Made in your browser, never uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/png-to-ico" },
  openGraph: {
    title: "PNG to ICO — Multi-Size favicon.ico, Choose the Sizes",
    description: "Build a real multi-resolution favicon.ico from one PNG: pick the icon sizes and fit or crop a non-square image. Made in your browser, never uploaded.",
    url: "https://www.onlineconvertools.com/tools/image-tools/png-to-ico",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/png-to-ico">{children}</ToolSeo>;
}
