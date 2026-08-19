import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Background Remover — Remove Backgrounds Online Free" },
  description: "Background Remover instantly removes an image's background using the remove.bg AI service, giving you a transparent PNG in one click.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/background-remover" },
  openGraph: {
    title: "Background Remover — Remove Backgrounds Online Free",
    description: "Background Remover instantly removes an image's background using the remove.bg AI service, giving you a transparent PNG in one click.",
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
