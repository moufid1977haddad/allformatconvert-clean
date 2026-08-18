import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Add Noise — Apply a Random Film-grain Effect Online Free" },
  description: "Add Noise applies a random film-grain effect to your image by adding random variation to each pixel's brightness, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/add-noise" },
  openGraph: {
    title: "Add Noise — Apply a Random Film-grain Effect Online Free",
    description: "Add Noise applies a random film-grain effect to your image by adding random variation to each pixel's brightness, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/add-noise",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
