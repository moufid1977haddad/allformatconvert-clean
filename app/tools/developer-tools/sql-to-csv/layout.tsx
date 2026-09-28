import type { Metadata } from 'next';
import ToolJsonLd from '../../../components/ToolJsonLd';
import { SEO } from './seo';

// Title, description and structured data come from seo.js, the same object the page renders its FAQ from.
const url = 'https://www.onlineconvertools.com' + SEO.path;

export const metadata: Metadata = {
  title: { absolute: SEO.title },
  description: SEO.description,
  alternates: { canonical: url },
  openGraph: { title: SEO.title, description: SEO.description, url },
};

// The page is a 'use client' component and can't export metadata itself; this layout hosts it and adds the
// JSON-LD script. It has no effect on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolJsonLd seo={SEO} />
      {children}
    </>
  );
}
