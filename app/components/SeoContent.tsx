type SeoContentProps = {
  title: string;
  description: string;
  howTo?: string[];
  faqs?: { q: string; a: string }[];
  tips?: string[];
};

export default function SeoContent({ title, description, howTo, faqs, tips }: SeoContentProps) {
  return (
    <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About {title}</h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">{description}</p>
      </div>
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
    </div>
  );
}