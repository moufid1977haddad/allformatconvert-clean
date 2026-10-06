import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Add Vignette to Photo — Dark Edges, Adjustable Clear Center" },
  description: "Darken the edges of a photo with a black radial vignette. Two sliders set how dark the corners get and how wide the untouched center is.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/add-vignette" },
  openGraph: {
    title: "Add Vignette to Photo — Dark Edges, Adjustable Clear Center",
    description: "Darken the edges of a photo with a black radial vignette. Two sliders set how dark the corners get and how wide the untouched center is.",
    url: "https://www.onlineconvertools.com/tools/image-tools/add-vignette",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/add-vignette">{children}</ToolSeo>;
}
