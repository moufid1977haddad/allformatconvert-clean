import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JWT Decoder & Signature Verifier — HS, RS, PS, ES, EdDSA" },
  description: "Decode a JWT's header and payload, see exp and iat as UTC dates, and verify the signature with a secret, PEM or JWK key, all in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/jwt-decoder" },
  openGraph: {
    title: "JWT Decoder & Signature Verifier — HS, RS, PS, ES, EdDSA",
    description: "Decode a JWT's header and payload, see exp and iat as UTC dates, and verify the signature with a secret, PEM or JWK key, all in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/jwt-decoder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/jwt-decoder">{children}</ToolSeo>;
}
