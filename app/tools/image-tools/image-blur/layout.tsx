import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Image Blur — Apply a Uniform Blur Effect Across Your Online" },
  description: "Blur an image online, free: a uniform Gaussian blur at full resolution, from 1 to 20 px, computed on your device (even 48 MP iPhone photos). Nothing is uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-blur" },
  openGraph: {
    title: "Image Blur — Apply a Uniform Blur Effect Across Your Online",
    description: "Blur an image online, free: a uniform Gaussian blur at full resolution, from 1 to 20 px, computed on your device (even 48 MP iPhone photos). Nothing is uploaded.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-blur",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/image-blur">{children}</ToolSeo>;
}
