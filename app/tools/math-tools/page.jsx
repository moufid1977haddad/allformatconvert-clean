'use client';
import Link from 'next/link';

const tools = [
  { icon: '🔢', title: 'Number Base Converter', description: 'Convert between binary, decimal, hex', href: '/tools/math-tools/number-base-converter' },
  { icon: '💯', title: 'Percentage Calculator', description: 'Calculate percentages easily', href: '/tools/math-tools/percentage-calculator' },
  { icon: '🔣', title: 'Roman Numeral Converter', description: 'Convert to and from Roman numerals', href: '/tools/math-tools/roman-numeral-converter' },
  { icon: '🔬', title: 'Scientific Calculator', description: 'Advanced scientific calculator', href: '/tools/math-tools/scientific-calculator' },
  { icon: '📏', title: 'Fraction Calculator', description: 'Add, subtract, multiply fractions', href: '/tools/math-tools/fraction-calculator' },
  { icon: '📉', title: 'Statistics Calculator', description: 'Mean, median, mode and more', href: '/tools/math-tools/statistics-calculator' },
];

export default function MathToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">🔢 Math Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your math tools in one place - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <div className="text-3xl mb-3">{tool.icon}</div>
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Math Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Math Tools is a free online calculator suite that helps students, professionals, and educators solve complex mathematical problems instantly. Our easy-to-use platform offers a comprehensive collection of calculators for algebra, geometry, statistics, and more without requiring any registration or payment.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Math Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Math Tools website and select the specific calculator you need from the main menu</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Enter your numerical values or mathematical expressions into the designated input fields</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Calculate' button to process your inputs and generate instant results</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Review your answer along with step-by-step solutions and save or share your results as needed</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Math Tools completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Math Tools is 100% free with no hidden fees, subscriptions, or premium features. All calculators are fully accessible to everyone.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use Math Tools?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No account creation is necessary. You can start using any calculator immediately without registration or personal information.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What types of math problems can Math Tools solve?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Math Tools includes calculators for algebra, geometry, calculus, statistics, trigonometry, fractions, percentages, and many other mathematical operations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use Math Tools on mobile devices?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Math Tools is fully responsive and works seamlessly on smartphones, tablets, and desktop computers.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark Math Tools in your browser for quick access to your most frequently used calculators</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the step-by-step solution feature to understand how answers are derived and improve your math skills</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Explore different calculators to find the most efficient tool for your specific mathematical needs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Share calculator results with classmates or colleagues by copying the URL or using the built-in sharing options</li>
          </ul>
        </div>
      </div>
    </div>
  );
}