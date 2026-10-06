// The page's path and its hand-written related links (page.jsx), and the canonical address (layout.tsx). P36 (06/10):
// the title, description, FAQ and example moved into layout.tsx and the page's SeoContent, where the content checks
// read them.
export const SEO = {
  name: 'Percentage Calculator',
  path: '/tools/math-tools/percentage-calculator',
  category: { name: 'Math Tools', path: '/tools/math-tools' },
  applicationCategory: 'EducationalApplication',
  related: [
    { href: '/tools/math-tools/fraction-calculator', label: 'Fraction Calculator', note: 'add, subtract, multiply and divide two fractions, reduced automatically, with the steps.' },
    { href: '/tools/math-tools/statistics-calculator', label: 'Statistics Calculator', note: 'mean, median, mode, standard deviation, quartiles and outliers of a list of numbers.' },
    { href: '/tools/math-tools/scientific-calculator', label: 'Scientific Calculator', note: 'expressions with powers, roots, logarithms and trigonometry.' },
    { href: '/tools/converter-tools/currency-converter', label: 'Currency Converter', note: 'convert an amount between currencies at the daily exchange rate.' },
    { href: '/tools/converter-tools/unit-converter', label: 'Unit Converter', note: '12 categories, from length and temperature to data, pressure and fuel economy.' },
  ],
};
