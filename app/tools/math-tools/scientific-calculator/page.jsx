'use client';
import { useState, useEffect, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { evaluateExpression } from '../../../lib/mathTools';

export default function ScientificCalculatorPage() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');
  const [memory, setMemory] = useState(0);
  const inputRef = useRef(null);

  const [angle, setAngle] = useState('rad');
  // P24 (03/10): Ans (full precision) and a history of the last 10 calculations, as calculator.net and Desmos keep them
  const [ans, setAns] = useState(0);
  const [history, setHistory] = useState([]);
  // mathjs replaces eval(): results keep 12 significant digits (1/3e12 was
  // shown as 0), 2π and 2(3) multiply, and sqrt(-1) / log(0) get their own
  // message instead of "Cannot divide by zero" (29/09).
  const run = async (expr) => {
    try {
      const { text, value } = await evaluateExpression(expr, { angle, ans, raw: true });
      setResult(text); setAns(value);
      setHistory((h) => [{ expr: /\bAns\b/.test(expr) ? expr.replace(/\bAns\b/g, `(${ans})`) : expr, text, angle }, ...h].slice(0, 10));
    } catch (e) { setResult(e.message); }
  };
  // a function key wraps the selection, or (wrapLast) the number / bracket just typed: 4 then 1/x is 1/(4), not 41/(…)
  // (review 03/10); x² on a typed negative number squares the number: -3 then x² is (-3)^2
  const insertAtCursor = (before, after = '', wrapLast = false) => {
    const input = inputRef.current;
    if (!input) return;
    let start = input.selectionStart;
    const end = input.selectionEnd;
    let inner = expression.slice(start, end);
    if (!inner && wrapLast) {
      const m = /(?:(?<=^|[(+\-*/^])-)?(?:\d+\.?\d*(?:e[-+]?\d+)?|\.\d+|π|Ans|\([^()]*\))$/.exec(expression.slice(0, start));
      if (m) { inner = m[0]; start -= m[0].length; }
    }
    const wrapped = inner ? before + inner + after : before + after;
    const newVal = expression.slice(0, start) + wrapped + expression.slice(end);
    const caret = inner ? start + wrapped.length : start + before.length;
    setExpression(newVal);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(caret, caret);
    }, 0);
  };

  const handleBtn = (val) => {
    if (val === 'C') { setExpression(''); setResult('0'); inputRef.current?.focus(); return; }
    if (val === '=') { run(expression); return; }
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
    const funcs = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', 'sqrt(', 'asin(', 'acos(', 'atan('];
    if (funcs.includes(val)) { insertAtCursor(val, ')'); return; }
    if (val === 'x²') { insertAtCursor('(', ')^2', true); return; }
    if (val === '1/x') { insertAtCursor('1/(', ')', true); return; }
    if (val === '|x|') { insertAtCursor('abs(', ')', true); return; }
    if (val === 'Ans') { insertAtCursor('Ans'); return; }
    insertAtCursor(val);
  };

  const memoryAdd = () => {
    const val = parseFloat(result);
    if (!isNaN(val)) setMemory(m => m + val);
  };
  const memoryRecall = () => insertAtCursor(String(memory));
  const memoryClear = () => setMemory(0);

  useEffect(() => {
    const handleKey = (e) => {
      // the field has its own Enter handler: running here too evaluated twice (Ans*2 gave Ans*4), review 03/10
      if (e.key === 'Enter' && e.target !== inputRef.current) { e.preventDefault(); run(expression); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expression, angle, ans]);

  const getLabel = (btn) => {
    const m = { 'sin(': 'sin()', 'cos(': 'cos()', 'tan(': 'tan()', 'log(': 'log()', 'ln(': 'ln()', 'sqrt(': 'sqrt()', 'asin(': 'sin⁻¹', 'acos(': 'cos⁻¹', 'atan(': 'tan⁻¹' };
    return m[btn] || btn;
  };

  const buttons = [
    ['sin(', 'cos(', 'tan(', 'log('],
    ['ln(', 'sqrt(', 'π', 'e'],
    ['asin(', 'acos(', 'atan(', 'x²'],
    ['!', '1/x', '|x|', 'Ans'],
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
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); run(expression); } }}
              className="w-full bg-transparent text-right text-neutral-600 dark:text-neutral-300 text-sm outline-none font-mono"
              placeholder="Type or click buttons..."
              autoFocus
            />
            <div className="text-2xl font-bold font-mono mt-1 break-all text-neutral-800 dark:text-white">
              {memory !== 0 && <span className="text-xs font-sans text-indigo-500 mr-2 align-middle">M</span>}
              {result}
            </div>
          </div>
          <div className="flex justify-center gap-2 text-sm" role="radiogroup" aria-label="Angle unit">
            {[['rad', 'Radians'], ['deg', 'Degrees']].map(([v, l]) => (
              <button key={v} onMouseDown={e => { e.preventDefault(); setAngle(v); }} aria-pressed={angle === v} className={"px-3 py-1 rounded-lg font-semibold transition " + (angle === v ? 'bg-indigo-600 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white')}>{l}</button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onMouseDown={e => { e.preventDefault(); memoryClear(); }} className="py-3 rounded-xl font-semibold transition text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white">MC</button>
            <button onMouseDown={e => { e.preventDefault(); memoryRecall(); }} className="py-3 rounded-xl font-semibold transition text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white">MR</button>
            <button onMouseDown={e => { e.preventDefault(); memoryAdd(); }} className="py-3 rounded-xl font-semibold transition text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white">M+</button>
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
          {history.length > 0 && (
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2" data-history>
              <div className="text-xs text-neutral-500 mb-1">History (click to reuse)</div>
              <ul className="space-y-1 text-sm font-mono">
                {history.map((h, i) => (
                  <li key={i}><button type="button" onMouseDown={(e) => { e.preventDefault(); setExpression(h.expr); if (/sin|cos|tan/.test(h.expr)) setAngle(h.angle); }} className="w-full text-right text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 break-all">{h.expr} = <b>{h.text}</b>{/sin|cos|tan/.test(h.expr) ? ` (${h.angle})` : ''}</button></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title={"Scientific Calculator"}
        description={"Scientific Calculator evaluates expressions with trigonometric functions (in radians or degrees), logarithms (log = base 10, ln = natural), square roots, powers, factorials (5!), π, e and parentheses, entirely in your browser — type an expression or build it with the buttons. It uses the mathjs expression engine instead of raw JavaScript evaluation: implicit multiplication works (2π, 3(4+1)), results keep 12 significant digits (1/3e12 = 3.33333333333e-13, never rounded to 0), 0.1+0.2 shows 0.3, and impossible results get a precise message (not a real number, infinite, or tan undefined). Includes a memory register (M+/MR/MC)."}
        howTo={[
          "Choose Radians or Degrees for trigonometric functions.",
          "Type an expression or build it with the buttons.",
          "Press '=' or Enter.",
          "Use M+, MR and MC to keep a value in memory."
        ]}
        faqs={[
          { q: "Is Scientific Calculator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it work in degrees?", a: "Yes — switch to Degrees and sin(30) gives 0.5, cos(90) gives 0 and tan(90) is reported as undefined." },
          { q: "What is the difference between log and ln?", a: "log is the base-10 logarithm (log(1000) = 3); ln is the natural logarithm (ln(e) = 1)." },
          { q: "How precise are the results?", a: "Results are computed in double precision and shown to 12 significant digits; very large or very small results use scientific notation instead of being rounded to 0." },
          { q: "Can I type 2π or 3(4+1)?", a: "Yes — implicit multiplication is supported, as on a handheld scientific calculator." },
          { q: "Does it have inverse trigonometry, factorials and an Ans key?", a: "Yes: sin⁻¹, cos⁻¹ and tan⁻¹ (in the angle unit you chose), x², n! (5! = 120), 1/x, |x|, and Ans, the previous result at full precision. The last 10 calculations are listed under the keypad; click one to reuse it." }
        ]}
        tips={[
          "Use ^ for powers (2^10) and ! for factorials (5!).",
          "The square root or logarithm of a negative number is reported as 'not a real number'.",
          "Press Enter to evaluate what you typed."
        ]}
      />
    </div>
  );
}