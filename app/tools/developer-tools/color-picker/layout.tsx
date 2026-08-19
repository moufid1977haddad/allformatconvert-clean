import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Color Picker — Let You Pick a Color Online Free" },
  description: "Color Picker lets you pick a color and shows the matching HEX and RGB values, entirely client-side in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/color-picker" },
  openGraph: {
    title: "Color Picker — Let You Pick a Color Online Free",
    description: "Color Picker lets you pick a color and shows the matching HEX and RGB values, entirely client-side in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/color-picker",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
