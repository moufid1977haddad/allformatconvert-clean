import type { Metadata } from 'next';
import ToolTitleIcon from './ToolTitleIcon';

export const metadata: Metadata = {
  title: { absolute: "All Tools — Browse 225+ Free File Converters Online Free" },
  description: "Browse all 225+ free online tools on OnlineConverTools, organized by category: PDF, image, video, audio, GIF, developer, AI, and more.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools" },
  openGraph: {
    title: "All Tools — Browse 225+ Free File Converters Online Free",
    description: "Browse all 225+ free online tools on OnlineConverTools, organized by category: PDF, image, video, audio, GIF, developer, AI, and more.",
    url: "https://www.onlineconvertools.com/tools",
  },
};

// Exists to host the static `metadata` export above, since the page.jsx it wraps
// is a 'use client' component and can't export metadata itself. Also mounts
// ToolTitleIcon, a client component, to inject each tool's icon into its <h1>.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolTitleIcon />
      {children}
    </>
  );
}
