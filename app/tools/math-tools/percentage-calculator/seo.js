// One source for this page's search content: the visible FAQ, examples and links (page.jsx) and the metadata and
// structured data (layout.tsx) read the same object, so they can never disagree. Written 29/09 (croissance-29-09,
// point 4) from the queries people actually type (Google suggestions: "formula", "increase", "between two numbers",
// "difference") and from the pages ranked first (Omni Calculator, Calculator Soup, Calculator.net: formula, worked
// example, increase vs decrease, change vs difference). Every number below was checked against the tool itself
// (scripts/browser-tests/seo-pages-29-09.mjs).
export const SEO = {
  name: 'Percentage Calculator',
  path: '/tools/math-tools/percentage-calculator',
  category: { name: 'Math Tools', path: '/tools/math-tools' },
  applicationCategory: 'EducationalApplication',
  title: 'Percentage Calculator — % of a Number, % Change & Formulas',
  description: 'Free percentage calculator: X% of Y, what percent X is of Y, and the percentage increase or decrease between two numbers — exact results as you type, with each formula explained.',
  faqs: [
    { q: 'How do I calculate a percentage of a number?', a: 'Multiply the number by the percentage and divide by 100: X% of Y = X × Y ÷ 100. For example, 15% of 80 = 15 × 80 ÷ 100 = 12. Use the first panel, "What is X% of Y?".' },
    { q: 'How do I find what percent one number is of another?', a: 'Divide the part by the whole and multiply by 100: X ÷ Y × 100. For example, 12 is 12 ÷ 80 × 100 = 15% of 80. Use the second panel, "X is what % of Y?".' },
    { q: 'How do I calculate the percentage change between two numbers?', a: 'Subtract the old value from the new one, divide by the old value and multiply by 100: (new − old) ÷ old × 100. From 60 to 72: (72 − 60) ÷ 60 × 100 = 20%, an increase. From 72 to 60 the result is −16.66666667%, a decrease — the base is different, so the two percentages are not the same. Use the third panel, "Percentage change from X to Y".' },
    { q: 'Is percentage change the same as percentage difference?', a: 'No. Percentage change measures a move from a starting value, so it depends on which number comes first. Percentage difference compares two values with no starting point: the gap divided by their average, |a − b| ÷ ((a + b) ÷ 2) × 100. This calculator computes percentage change, not percentage difference.' },
    { q: 'Why doesn\'t a 20% increase followed by a 20% decrease bring me back to the start?', a: 'Because each percentage applies to a different base: 100 + 20% = 120, and 120 − 20% = 96, not 100. To undo a 20% increase you need a decrease of about 16.67% (20 ÷ 120).' },
    { q: 'Can a percentage change be more than 100%?', a: 'Yes, for an increase: going from 50 to 150 is a 200% increase. A decrease can never go below −100%, which means the value fell to zero.' },
    { q: 'What if the starting value is 0?', a: 'A change from zero cannot be expressed as a percentage, because it would mean dividing by zero; the calculator shows "Cannot divide by zero" instead of a made-up number. The same applies to "X is what % of 0".' },
    { q: 'How precise are the results?', a: 'Results are shown with up to 10 significant digits and are never rounded to zero, so 0.001% of 5 shows 0.00005 rather than 0.00. Round money amounts to cents yourself.' },
    { q: 'Is Percentage Calculator free, and is anything sent to a server?', a: 'It is free with no signup, and every calculation runs in your browser — nothing you type is sent anywhere.' },
    { q: 'Do the three panels work independently?', a: 'Yes — each panel has its own two input fields, so entering values in one doesn\'t change or clear the others.' },
  ],
  example: {
    caption: 'The three calculations, with the numbers used in the answers above (each result is what the calculator shows).',
    inputLabel: 'You enter',
    input: 'What is 15% of 80?\n12 is what % of 80?\nChange from 60 to 72\nChange from 72 to 60',
    outputLabel: 'Result',
    output: '12\n15%\n20%\n-16.66666667%',
  },
  related: [
    { href: '/tools/math-tools/fraction-calculator', label: 'Fraction Calculator', note: 'add, subtract, multiply and divide two fractions, reduced automatically.' },
    { href: '/tools/math-tools/statistics-calculator', label: 'Statistics Calculator', note: 'mean, median, mode, standard deviation, variance and range of a list of numbers.' },
    { href: '/tools/math-tools/scientific-calculator', label: 'Scientific Calculator', note: 'expressions with exponents, square roots, logarithms and trigonometry.' },
    { href: '/tools/converter-tools/currency-converter', label: 'Currency Converter', note: 'convert between 166 currencies with daily exchange rates.' },
    { href: '/tools/converter-tools/unit-converter', label: 'Unit Converter', note: 'length, weight, temperature, speed, area and volume.' },
  ],
};
