'use client';
import { createContext } from 'react';

// P35 (lot 3, S2 + S3): what the tool's server layout knows about the page (app/components/ToolSeo.tsx) — its path, its
// category, its 4-6 related tools — handed to SeoContent, which renders the "Related tools" block and the structured
// data where the page's own SEO content already is. Only this page's few links travel to the browser.
export const ToolContext = createContext(null);

export function ToolContextProvider({ value, children }) {
  return <ToolContext.Provider value={value}>{children}</ToolContext.Provider>;
}
