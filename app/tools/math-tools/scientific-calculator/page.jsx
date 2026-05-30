'use client';
import { useState } from 'react';

export default function ScientificCalculatorPage() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');

  const handleBtn = (val) => {
    if (val === 'C') { setDisplay('0'); setExpression(''); return; }
    if (val === '=') {
      try {
        const expr = expression.replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos').replace(/tan/g, 'Math.tan').replace(/log/g, 'Math.log10').replace(/ln/g, 'Math.log').replace(/sqrt/g, 'Math.sqrt').replace(/π/g, 'Math.PI').replace(/e/g, 'Math.E').replace(/\^/g, '**');
        const result = eval(expr);
        setDisplay(parseFloat(result.toFixed(10)).toString());
        setExpression(parseFloat(result.toFixed(10)).toString());
      } catch { setDisplay('Error'); setExpression(''); }
      return;
    }
    if (val === '⌫') {
      const newExpr = expression.slice(0, -1) || '0';
      setExpression(newExpr);
      setDisplay(newExpr);
      return;
    }
    const newExpr = expression === '0' || expression === 'Error' ? val : expression + val;
    setExpression(newExpr);
    setDisplay(newExpr);
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

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-sm mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Scientific Calculator</h1>
        <p className="text-neutral-500 text-center mb-8">Advanced scientific calculator</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-4 space-y-3">
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-right">
            <div className="text-neutral-500 text-sm h-5">{expression}</div>
            <div className="text-2xl font-bold font-mono mt-1 break-all">{display}</div>
          </div>
          {buttons.map((row, i) => (
            <div key={i} className={`grid gap-2 ${row.length === 1 ? 'grid-cols-1' : 'grid-cols-4'}`}>
              {row.map(btn => (
                <button key={btn} onClick={() => handleBtn(btn)} className={`py-3 rounded-xl font-semibold transition text-sm ${btn === '=' ? 'bg-indigo-600 hover:bg-indigo-500' : btn === 'C' ? 'bg-red-600 hover:bg-red-500' : 'bg-neutral-800 hover:bg-neutral-100'}`}>
                  {btn}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}