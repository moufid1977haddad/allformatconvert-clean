import Link from 'next/link';
import { getToolCounts } from '@/lib/toolCounts';
import { SITE_CATEGORIES } from '@/app/lib/siteCategories';
// Measured from the code at every build by scripts/content-checks/privacy-claims.mjs, which stops the build when these
// figures no longer match the tools (P36): tools that send data in at least one case, and those that only do so on an
// iPhone or iPad (when the device cannot finish the work itself, or, for PDF OCR since P37, always there).
import SERVER_TOOLS from '@/app/lib/serverToolCount.json';

const SITE = 'https://www.onlineconvertools.com';
const TAGLINE = 'Every conversion tool you need, in one place.';
// Year of the repository's first commit (19 May 2026).
const FOUNDED = '2026';
const EMAIL = 'contact@onlineconvertools.com';

export const metadata = {
  title: { absolute: 'About OnlineConverTools — Moufid Haddad, Founder' },
  description: `OnlineConverTools brings ${SERVER_TOOLS.total} free online tools together in one place. Founded in ${FOUNDED} by Moufid Haddad in Québec, Canada.`,
  alternates: { canonical: `${SITE}/about` },
  openGraph: {
    title: 'About OnlineConverTools — Moufid Haddad, Founder',
    description: `OnlineConverTools brings ${SERVER_TOOLS.total} free online tools together in one place. Founded in ${FOUNDED} by Moufid Haddad in Québec, Canada.`,
    url: `${SITE}/about`,
  },
};

const card = 'bg-white border border-neutral-200 rounded-xl p-8 mb-5';
const h2 = 'text-xl font-bold text-neutral-800 mb-3';
const p = 'text-neutral-600 text-sm leading-relaxed';
const a = 'text-indigo-600 underline hover:no-underline';

// Organization + Person, built from the very facts this page shows ("<" escaped against script injection).
function jsonLd() {
  const founder = {
    '@type': 'Person',
    '@id': `${SITE}/about#founder`,
    name: 'Moufid Haddad',
    jobTitle: 'Founder',
    address: { '@type': 'PostalAddress', addressRegion: 'Québec', addressCountry: 'CA' },
    worksFor: { '@id': `${SITE}/#organization` },
  };
  const org = {
    '@type': 'Organization',
    '@id': `${SITE}/#organization`,
    name: 'OnlineConverTools',
    url: SITE,
    slogan: TAGLINE,
    email: EMAIL,
    foundingDate: FOUNDED,
    founder: { '@id': `${SITE}/about#founder` },
    address: { '@type': 'PostalAddress', addressRegion: 'Québec', addressCountry: 'CA' },
  };
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, founder] }).replace(/</g, '\\u003c');
}

export default function AboutPage() {
  const { total } = getToolCounts();
  const local = total - SERVER_TOOLS.server;
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd() }} />
      <div className="max-w-3xl mx-auto">

        <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800">About OnlineConverTools</h1>
        <p className="text-neutral-500 text-center mb-10">{TAGLINE}</p>

        <div className={card}>
          <h2 className={h2}>Why I built it</h2>
          <p className={p}>
            I built OnlineConverTools because converting one file often meant visiting five different websites. So I
            brought every tool together — PDF, images, audio, video, text and developer tools — in one place, free and
            easy to use. I want everyone to find the tool they need here, without looking anywhere else.
          </p>
          <p className="text-neutral-800 text-sm font-semibold mt-4">Moufid Haddad, Founder</p>
          <p className="text-neutral-500 text-sm">Québec, Canada · OnlineConverTools since {FOUNDED}</p>
        </div>

        <div className={card}>
          <h2 className={h2}>What you will find here</h2>
          <p className={`${p} mb-4`}>
            {total} free tools in {SITE_CATEGORIES.length} categories, for converting, compressing and editing files and
            for everyday text, developer, math and AI tasks.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SITE_CATEGORIES.map((c) => (
              <Link key={c.slug} href={c.href} className="bg-neutral-100 hover:bg-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-700 text-center transition">
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        <div className={card}>
          <h2 className={h2}>Where your files are processed</h2>
          <p className={p}>
            Most tools, {local} of the {total}, need no server. These tools run entirely in your browser: the file is
            read and converted on your device and is not sent to us. The other {SERVER_TOOLS.server} send your file or text to a server in at
            least one case: to our own processing servers, or to a provider named in our{' '}
            <Link href="/privacy" className={a}>privacy policy</Link> (ConvertAPI, OpenAI, Pangram Labs, Google). For{' '}
            {SERVER_TOOLS.iosFallbackOnly} of them this happens only on an iPhone or iPad, and the page says so. The
            privacy policy lists every one of these tools by name.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Free, with fair-use limits</h2>
          <p className={p}>
            Every tool is free to use, and no tool requires an account. Tools that rely on a server or a paid provider
            have hourly and daily limits per connection, and some share a monthly budget for the whole site, so that they
            can stay free for everyone.
          </p>
        </div>

        <div className={card}>
          <h2 className={h2}>Contact</h2>
          <p className={p}>
            Questions, a bug, a tool you would like to see: write to{' '}
            <a href={`mailto:${EMAIL}`} className={a}>{EMAIL}</a> or use the <Link href="/contact" className={a}>contact form</Link>.
          </p>
        </div>

        <div className="text-center mt-8">
          <Link href="/tools" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-3 rounded-lg transition">
            Explore All Tools
          </Link>
        </div>

      </div>
    </div>
  );
}
