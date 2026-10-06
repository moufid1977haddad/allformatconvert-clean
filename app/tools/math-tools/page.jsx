'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors, categoryColors } from '../../lib/toolIcons';

const tools = [
  { title: 'Number Base Converter', description: 'Binary, octal, decimal, hex and any base to 36', href: '/tools/math-tools/number-base-converter' },
  { title: 'Percentage Calculator', description: 'Six percentage calculations, updated as you type', href: '/tools/math-tools/percentage-calculator' },
  { title: 'Roman Numeral Converter', description: 'Numbers 1 to 3999 to Roman numerals and back', href: '/tools/math-tools/roman-numeral-converter' },
  { title: 'Scientific Calculator', description: 'Trigonometry, logs, powers, memory and history', href: '/tools/math-tools/scientific-calculator' },
  { title: 'Fraction Calculator', description: 'Exact fraction arithmetic with the steps shown', href: '/tools/math-tools/fraction-calculator' },
  { title: 'Statistics Calculator', description: '23 statistics: mean, median, quartiles, skewness', href: '/tools/math-tools/statistics-calculator' },
];

export default function MathToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="math-tools" className={`w-8 h-8 ${categoryColors['math-tools']}`} /> Math Tools</h1>
        <p className="text-neutral-500 text-center mb-10">Calculators and number converters - {tools.length} tools</p>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Math Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Six calculators and number converters, each computing on the page as you use it. Fraction Calculator and Number Base Converter use exact arithmetic on whole numbers of any size, so 1/3 + 1/6 gives exactly 1/2. Scientific Calculator evaluates expressions with the mathjs library and shows 12 significant digits. Statistics Calculator turns a pasted list of numbers into 23 descriptive statistics, and Percentage Calculator solves six common percentage questions side by side.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Math Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Choose the calculator: percentages, fractions, statistics, a scientific expression, Roman numerals or number bases.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Type your numbers; Percentage Calculator, Roman Numeral Converter and Number Base Converter update the answer as you type.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>In Scientific Calculator, type an expression or use its keypad, and choose radians or degrees for trigonometry.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Read the result, and in Fraction Calculator the numbered steps that lead to it.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How precise are the results?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">12 significant digits in Scientific and Statistics Calculator, and 10 in Percentage Calculator. Fraction Calculator is exact and shows a repeating decimal in parentheses; Number Base Converter is exact and stops at 40 digits after the point, marked …, when a fraction never ends.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does Scientific Calculator use degrees or radians?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Both: you choose the mode, and sin, cos and tan follow it. The calculator also has log10, ln, square roots, powers, factorials, π, e, the Ans key, a memory and the last 10 calculations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Why does Roman Numeral Converter stop at 3999?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">MMMCMXCIX, 3999, is the largest standard form: there is no symbol above M, and M repeats at most three times. The converter also refuses non-standard forms such as IIII.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Which statistics does Statistics Calculator give?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">23 values, including the mean, geometric and harmonic means, median, mode, range, variance and standard deviation, quartiles computed inclusively or exclusively, skewness, kurtosis and outliers.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Paste a column from a spreadsheet into Statistics Calculator: tabs, new lines, commas and semicolons all separate values.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>In Fraction Calculator, enter 1 3/4 as 1 in the small whole-number box, 3 as numerator and 4 as denominator; a decimal such as 0.75 becomes an exact fraction.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Scientific Calculator keeps your last 10 calculations, and Ans reuses the previous result.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Percentage change divides by the absolute starting value, so going from -50 to -25 is a change of 50%.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}