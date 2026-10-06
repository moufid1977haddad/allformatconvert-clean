import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "HTML Formatter — Indent HTML, Inline CSS and JavaScript" },
  description: "Re-indent HTML with 2 spaces using js-beautify, in your browser. Inline <script> and <style> are formatted too; <pre> and <textarea> stay as typed.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/html-formatter" },
  openGraph: {
    title: "HTML Formatter — Indent HTML, Inline CSS and JavaScript",
    description: "Re-indent HTML with 2 spaces using js-beautify, in your browser. Inline <script> and <style> are formatted too; <pre> and <textarea> stay as typed.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/html-formatter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/html-formatter">{children}</ToolSeo>;
}
