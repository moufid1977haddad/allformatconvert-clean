'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors, categoryColors } from '../../lib/toolIcons';

const tools = [
  { title: 'Currency Converter', description: 'Convert amounts at the day\'s rate, with history', href: '/tools/converter-tools/currency-converter' },
  { title: 'Unit Converter', description: '12 categories, from length to fuel economy', href: '/tools/converter-tools/unit-converter' },
  { title: 'Color Converter', description: 'HEX, RGB, HSL, HSV and CMYK, with contrast', href: '/tools/converter-tools/color-converter' },
  { title: 'MOBI to EPUB', description: 'Turn a DRM-free MOBI or AZW3 ebook into EPUB 3', href: '/tools/converter-tools/mobi-to-epub' },
];

export default function ConverterToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="converter-tools" className={`w-8 h-8 ${categoryColors['converter-tools']}`} /> Converter Tools</h1>
        <p className="text-neutral-500 text-center mb-10">Currencies, units, color codes and Kindle ebooks - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <ToolIcon slug={tool.href.split('/').pop()} className={`w-8 h-8 mb-3 ${toolTextColors[tool.href]}`} />
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Converter Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Four converters share this page. Currency Converter applies the rates ExchangeRate-API publishes each day and charts a pair's history from Frankfurter's central-bank reference rates. Unit Converter covers 12 categories, from length and pressure to fuel economy, with exact conversion factors. Color Converter edits one color as HEX, RGB, HSL, HSV or CMYK and shows its WCAG contrast on white and on black. MOBI to EPUB rebuilds a DRM-free Kindle book as an EPUB 3 file in your browser.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Converter Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Open the converter for what you have: an amount of money, a measurement, a color code, or a .mobi, .azw or .azw3 file.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Type the value and choose the two currencies or units, or pick the ebook file.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Read the result: Currency Converter adds the unit rate and the amount in up to 20 popular currencies, Color Converter fills in every format at once.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click Copy in Color Converter, select the result in the other converters, or download the EPUB, which keeps the name of the original file.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How current are the exchange rates?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Daily: ExchangeRate-API updates its table once a day, and the page shows when it was published and when the next update is due. The history chart uses Frankfurter's reference rates, daily up to one year, weekly over 5 years and monthly over 10.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is anything sent when I convert?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, for currencies only. Your browser downloads the day's rate table, the same for every visitor, and the history chart sends the two currency codes you picked to Frankfurter. The amount you type is not sent, and units, colors and ebooks are converted on the page.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can MOBI to EPUB convert a book bought on Amazon?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, not one with DRM. The converter reads DRM-free MOBI, AZW, AZW3 and PRC files and does not remove copy protection, so use it for books you received without DRM.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Which color formats can I type?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Five: HEX with 3, 4, 6 or 8 digits, RGB, HSL, HSV/HSB and CMYK, each in its own editable field. Color names such as rebeccapurple are not accepted.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Unit Converter reads "1,000" as ambiguous and asks again; type 1000 for a thousand.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Color Converter computes contrast with the opacity applied, on white and on black, before you pick a text color.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Switch the currency chart from 1 week to 10 years; 8 currencies, including BGN and HRK, had no history when we checked on October 3, 2026.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For a PDF of the ebook instead, use MOBI to PDF in PDF Tools, which sends the prepared pages to our server to print the PDF.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}