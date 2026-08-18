import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Background Remover — Remove Backgrounds Online Free" },
  description: "Background Remover is a free online tool that instantly removes the background from an image using the remove.bg AI image-processing service, giving you…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/background-remover" },
  openGraph: {
    title: "Background Remover — Remove Backgrounds Online Free",
    description: "Background Remover is a free online tool that instantly removes the background from an image using the remove.bg AI image-processing service, giving you…",
    url: "https://www.onlineconvertools.com/tools/ai-tools/background-remover",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
