import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "JSON to Python Class — Generate a Python @dataclass Online" },
  description: "JSON to Python Class generates a Python @dataclass with one type-annotated field per top-level JSON key — not a populated dictionary or list containing your…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-to-python" },
  openGraph: {
    title: "JSON to Python Class — Generate a Python @dataclass Online",
    description: "JSON to Python Class generates a Python @dataclass with one type-annotated field per top-level JSON key — not a populated dictionary or list containing your…",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-to-python",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
