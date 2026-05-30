'use client';
import Link from 'next/link';

const tools = [
  { icon: '🔢', title: 'Number Base Converter', description: 'Convert between binary, decimal, hex', href: '/tools/math-tools/number-base-converter' },
  { icon: '📊', title: 'Percentage Calculator', description: 'Calculate percentages easily', href: '/tools/math-tools/percentage-calculator' },
  { icon: '🔣', title: 'Roman Numeral Converter', description: 'Convert to and from Roman numerals', href: '/tools/math-tools/roman-numeral-converter' },
  { icon: '📐', title: 'Scientific Calculator', description: 'Advanced scientific calculator', href: '/tools/math-tools/scientific-calculator' },
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
    </div>
  );
}
