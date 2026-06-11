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
    </div>
  );
}
