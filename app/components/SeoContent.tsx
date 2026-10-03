'use client';
import Link from 'next/link';

type SeoContentProps = {
  title: string;
  description: string;
  howTo?: string[];
  faqs?: { q: string; a: string }[];
  tips?: string[];
  // Optional (29/09): a real input and the output this tool gives for it, and links to related tools. Pages that do not
  // pass them render exactly as before.
  example?: { caption: string; inputLabel: string; input: string; outputLabel: string; output: string };
  related?: { href: string; label: string; note: string }[];
};

export default function SeoContent({ title, description, howTo, faqs, tips, example, related }: SeoContentProps) {
  return (
    <div data-seo-content className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
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
      {related && related.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Related tools</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.href} className="text-sm text-neutral-600 dark:text-neutral-400">
                <Link href={r.href} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">{r.label}</Link> — {r.note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
