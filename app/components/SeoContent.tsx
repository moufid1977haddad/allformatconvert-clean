'use client';
import Link from 'next/link';
import { useContext } from 'react';
import { ToolContext } from './ToolContext';

const SITE = 'https://www.onlineconvertools.com';
// schema.org applicationCategory of a tool, from its site category (P35, lot 3 S3)
const APP_CATEGORY: Record<string, string> = {
  'image-tools': 'MultimediaApplication', 'gif-tools': 'MultimediaApplication', 'audio-tools': 'MultimediaApplication',
  'video-tools': 'MultimediaApplication', 'developer-tools': 'DeveloperApplication', 'math-tools': 'EducationalApplication',
};
type ToolInfo = { path: string; category: { name: string; path: string }; related: { href: string; label: string }[] };

type SeoContentProps = {
  title: string;
  description: string;
  howTo?: string[];
  faqs?: { q: string; a: string }[];
  tips?: string[];
  // Optional (29/09): a real input and the output this tool gives for it, and links to related tools. Pages that do not
  // pass them render exactly as before.
  example?: { caption: string; inputLabel: string; input: string; outputLabel: string; output: string };
  related?: { href: string; label: string; note?: string }[];
};

// P35 (lot 3, S3): the tool's structured data — WebApplication (free: offers at 0), BreadcrumbList, and FAQPage only
// when the FAQ is on the page — built from the very texts this component shows (name, the "About" paragraph, the
// questions and answers), so the markup never says more than the page (the ten pages of 29/09 had theirs from their
// meta description, which the page does not show: replaced). "<" escaped against script injection.
function toolJsonLd(tool: ToolInfo, title: string, description: string, faqs?: { q: string; a: string }[]) {
  const url = SITE + tool.path;
  const graph: object[] = [
    {
      '@type': 'WebApplication',
      '@id': url + '#app',
      name: title,
      url,
      description,
      applicationCategory: APP_CATEGORY[tool.path.split('/')[2]] || 'UtilitiesApplication',
      operatingSystem: 'Any (runs in a web browser)',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: 'OnlineConverTools', url: SITE },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: tool.category.name, item: SITE + tool.category.path },
        { '@type': 'ListItem', position: 3, name: title, item: url },
      ],
    },
  ];
  if (faqs && faqs.length) graph.push({ '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

export default function SeoContent({ title, description, howTo, faqs, tips, example, related }: SeoContentProps) {
  // P35 (lot 3, S2): the hand-chosen neighbours from the tool's layout (app/components/ToolSeo.tsx); the ten pages of
  // 29/09 keep their own links (with their notes) first, completed from the same list up to 4-6
  const tool = useContext(ToolContext) as ToolInfo | null;
  const own = related || [];
  const links: { href: string; label: string; note?: string }[] = [...own, ...(tool ? tool.related.filter((r) => !own.some((o) => o.href === r.href)) : [])].slice(0, Math.max(own.length, 6));
  return (
    <div data-seo-content className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
      {tool && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toolJsonLd(tool, title, description, faqs) }} />}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About {title}</h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">{description}</p>
      </div>
      {example && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">Example</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">{example.caption}</p>
          {/* min-w-0: a grid item is as wide as its widest line by default; a long code line widened the whole page
              on a phone (CSV to SQL at 375 px: 520 px wide, P21). The block scrolls inside instead. */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">{example.inputLabel}</p>
              <pre data-example="input" tabIndex={0} className="text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 overflow-x-auto whitespace-pre text-neutral-700 dark:text-neutral-200">{example.input}</pre>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">{example.outputLabel}</p>
              <pre data-example="output" tabIndex={0} className="text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 overflow-x-auto whitespace-pre text-neutral-700 dark:text-neutral-200">{example.output}</pre>
            </div>
          </div>
        </div>
      )}
      {howTo && howTo.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use {title}</h2>
          <ol className="space-y-2">
            {howTo.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
      {faqs && faqs.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">{faq.q}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {tips && tips.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips & Tricks</h2>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-indigo-500 shrink-0">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
      {links.length > 0 && (
        <div data-related-tools className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Related tools</h2>
          <ul className="space-y-2">
            {links.map((r) => (
              <li key={r.href} className="text-sm text-neutral-600 dark:text-neutral-400">
                <Link href={r.href} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">{r.label}</Link>{'note' in r && r.note ? <> — {r.note}</> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
