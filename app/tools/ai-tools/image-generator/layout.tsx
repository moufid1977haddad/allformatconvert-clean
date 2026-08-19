import type { Metadata } from 'next';

// TODO: remove `robots: { index: false }` and swap back to a search-intent
// title once this tool ships (see page.jsx's "Coming Soon" state).
export const metadata: Metadata = {
  title: { absolute: "AI Image Generator — Coming Soon" },
  description: "AI Image Generator is not yet available — this feature is under development.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/image-generator" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "AI Image Generator — Coming Soon",
    description: "AI Image Generator is not yet available — this feature is under development.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/image-generator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
