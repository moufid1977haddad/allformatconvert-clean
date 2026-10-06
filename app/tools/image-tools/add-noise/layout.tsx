import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Add Noise to Image — Film Grain, Gray or Color" },
  description: "Sprinkle film grain on a photo: uniform random noise with an intensity from 1 to 100, gray or colored. Full size kept; JPG, PNG and WebP keep their format.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/add-noise" },
  openGraph: {
    title: "Add Noise to Image — Film Grain, Gray or Color",
    description: "Sprinkle film grain on a photo: uniform random noise with an intensity from 1 to 100, gray or colored. Full size kept; JPG, PNG and WebP keep their format.",
    url: "https://www.onlineconvertools.com/tools/image-tools/add-noise",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/add-noise">{children}</ToolSeo>;
}
