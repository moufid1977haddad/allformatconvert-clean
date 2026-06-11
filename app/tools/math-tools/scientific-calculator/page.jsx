'use client';
import { useState, useEffect, useRef } from 'react';

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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Scientific Calculator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">The Scientific Calculator is a free online tool that performs advanced mathematical calculations including trigonometric functions, logarithms, exponents, and complex equations. Perfect for students, engineers, and professionals who need quick and accurate scientific computations without downloading software.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Scientific Calculator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Scientific Calculator website and you'll see a display screen at the top with a full numeric keypad and function buttons below</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Enter your mathematical expression using the number buttons, operation symbols (+, -, Ã, Ã·), and scientific function buttons (sin, cos, log, etc.)</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Use parentheses to control the order of operations and ensure complex calculations are performed correctly</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Press the equals button (=) to get your result instantly displayed on the screen</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is the Scientific Calculator really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the Scientific Calculator is completely free with no registration required, no hidden fees, and no limitations on the number of calculations you can perform.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What types of calculations can I perform?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can perform basic arithmetic, trigonometric functions (sine, cosine, tangent), logarithmic calculations, exponents, square roots, factorials, and many other advanced mathematical operations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install anything to use this calculator?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No installation is necessary. The Scientific Calculator works directly in your web browser, making it accessible from any device with an internet connection.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use this calculator on my mobile phone?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the Scientific Calculator is fully responsive and works seamlessly on smartphones, tablets, and desktop computers.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the memory functions (M+, M-, MR, MC) to store intermediate results and streamline complex multi-step calculations</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Switch between degree and radian modes depending on your calculation needs for trigonometric functions</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Clear your previous calculation by pressing the C button before starting a new problem to avoid confusion</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use parentheses liberally in complex equations to ensure the calculator follows your intended order of operations and produces accurate results</li>
          </ul>
        </div>
      </div>
    </div>
  );
}