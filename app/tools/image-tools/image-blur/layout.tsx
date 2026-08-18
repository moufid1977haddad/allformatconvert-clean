import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Blur — Apply a Uniform Blur Effect Across Your Online" },
  description: "Image Blur applies a uniform blur effect across your entire image using the browser's built-in canvas blur filter, with an adjustable intensity from 1 to 20…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-blur" },
  openGraph: {
    title: "Image Blur — Apply a Uniform Blur Effect Across Your Online",
    description: "Image Blur applies a uniform blur effect across your entire image using the browser's built-in canvas blur filter, with an adjustable intensity from 1 to 20…",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-blur",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
