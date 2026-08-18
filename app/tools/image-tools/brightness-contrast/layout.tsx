import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Brightness and Contrast — Let You Adjust an Image's" },
  description: "Brightness and Contrast lets you adjust an image's brightness and contrast with two sliders, applied via the browser's canvas filter, entirely on your device.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/brightness-contrast" },
  openGraph: {
    title: "Brightness and Contrast — Let You Adjust an Image's",
    description: "Brightness and Contrast lets you adjust an image's brightness and contrast with two sliders, applied via the browser's canvas filter, entirely on your device.",
    url: "https://www.onlineconvertools.com/tools/image-tools/brightness-contrast",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
