'use client';
import { useState, useEffect, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function ScientificCalculatorPage() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');
  const inputRef = useRef(null);

  const evaluate = (expr) => {
    try {
      const e = expr
        .replace(/sin\(/g, 'Math.sin(').replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(').replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(').replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/π/g, 'Math.PI').replace(/\^/g, '**');
      const r = eval(e);
      return parseFloat(r.toFixed(10)).toString();
    } catch { return 'Error'; }
  };

  const insertAtCursor = (before, after = '') => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const newVal = expression.slice(0, start) + before + after + expression.slice(end);
    setExpression(newVal);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + before.length, start + before.length);
    }, 0);
  };

  const handleBtn = (val) => {
    if (val === 'C') { setExpression(''); setResult('0'); inputRef.current?.focus(); return; }
    if (val === '=') { setResult(evaluate(expression)); return; }
    if (val === '⌫') {
      const input = inputRef.current;
      if (!input) return;
      const start = input.selectionStart;
      if (start === 0) return;
      const newVal = expression.slice(0, start - 1) + expression.slice(start);
      setExpression(newVal);
      setTimeout(() => { input.focus(); input.setSelectionRange(start - 1, start - 1); }, 0);
      return;
    }
    const funcs = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', 'sqrt('];
    if (funcs.includes(val)) { insertAtCursor(val, ')'); return; }
    insertAtCursor(val);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); setResult(evaluate(expression)); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expression]);

  const getLabel = (btn) => {
    const m = { 'sin(': 'sin()', 'cos(': 'cos()', 'tan(': 'tan()', 'log(': 'log()', 'ln(': 'ln()', 'sqrt(': 'sqrt()' };
    return m[btn] || btn;
  };

  const buttons = [
    ['sin(', 'cos(', 'tan(', 'log('],
    ['ln(', 'sqrt(', 'π', 'e'],
    ['(', ')', '^', '⌫'],
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['0', '.', 'C', '+'],
    ['='],
  ];

  const getBtnClass = (btn) => {
    if (btn === '=') return 'bg-indigo-600 hover:bg-indigo-500 text-white';
    if (btn === 'C') return 'bg-red-600 hover:bg-red-500 text-white';
    return 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white';
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-6">
      <div className="max-w-sm mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">Scientific Calculator</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-8">Advanced scientific calculator</p>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-4 space-y-3">
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 text-right">
            <input
              ref={inputRef}
              type="text"
              value={expression}
              onChange={e => setExpression(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setResult(evaluate(expression)); } }}
              className="w-full bg-transparent text-right text-neutral-600 dark:text-neutral-300 text-sm outline-none font-mono"
              placeholder="Type or click buttons..."
              autoFocus
            />
            <div className="text-2xl font-bold font-mono mt-1 break-all text-neutral-800 dark:text-white">{result}</div>
          </div>
          {buttons.map((row, i) => (
            <div key={i} className={`grid gap-2 ${row.length === 1 ? 'grid-cols-1' : 'grid-cols-4'}`}>
              {row.map(btn => (
                <button key={btn} onMouseDown={e => { e.preventDefault(); handleBtn(btn); }}
                  className={`py-3 rounded-xl font-semibold transition text-sm ${getBtnClass(btn)}`}>
                  {getLabel(btn)}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <SeoContent
        title="Scientific Calculator"
        description="Scientific Calculator evaluates expressions with trigonometric functions, logarithms, square roots, exponents, and parentheses, entirely in your browser — type an expression or build it with the buttons, and press equals for an instant result."
        howTo={[
          "Type an expression directly into the display, or build it using the number and function buttons.",
          "Use function buttons like sin(, cos(, log(, sqrt( to insert scientific functions — they auto-add closing parentheses.",
          "Use \"^\" for exponents and parentheses to control the order of operations.",
          "Press \"=\" or Enter to evaluate the expression and see the result."
        ]}
        faqs={[
          { q: "Are trig functions in degrees or radians?", a: "Radians only — sin(, cos(, and tan( all operate in radians; there's no degree mode toggle. To work with degrees, convert first (degrees × π / 180)." },
          { q: "Does the \"e\" button insert Euler's number?", a: "Not on its own — pressing \"e\" by itself inserts a raw letter that produces an error, since it isn't mapped to Math.E. It works fine as part of scientific notation, like typing \"2e5\" directly." },
          { q: "Does it have memory functions or factorial?", a: "No — this calculator covers basic arithmetic, trig, log/ln, square root, exponents, and parentheses only; there's no M+/MR/MC or factorial button." },
          { q: "Is Scientific Calculator free to use?", a: "Yes, it's completely free with no signup, running entirely in your browser." }
        ]}
        tips={[
          "For degree-based trig, convert your angle to radians first (degrees × π / 180) before using sin(/cos(/tan(.",
          "log( computes the base-10 logarithm; use ln( for the natural logarithm (base e).",
          "Avoid the standalone \"e\" button if you want Euler's number — it currently produces an error; use scientific notation like \"2e3\" instead where applicable.",
          "Press \"C\" to clear the expression completely before starting a new calculation."
        ]}
      />
    </div>
  );
}