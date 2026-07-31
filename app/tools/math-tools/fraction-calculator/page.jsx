'use client';
import { useState, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';

const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
const simplify = (num, den) => {
  const g = gcd(Math.abs(num), Math.abs(den));
  return { num: num / g, den: den / g };
};

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export default function FractionCalculatorPage() {
  const dark = useDarkMode();
  const [n1, setN1] = useState('');
  const [d1, setD1] = useState('');
  const [n2, setN2] = useState('');
  const [d2, setD2] = useState('');
  const [result, setResult] = useState(null);
  const [op, setOp] = useState('+');

  const calculate = () => {
    const a = parseInt(n1), b = parseInt(d1), c = parseInt(n2), d = parseInt(d2);
    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d) || b === 0 || d === 0) return;
    let num, den;
    if (op === '+') { num = a*d + c*b; den = b*d; }
    else if (op === '-') { num = a*d - c*b; den = b*d; }
    else if (op === '*') { num = a*c; den = b*d; }
    else { num = a*d; den = b*c; }
    const simplified = simplify(num, den);
    setResult({ ...simplified, decimal: (simplified.num / simplified.den).toFixed(6) });
  };

  const bg = dark ? '#111111' : '#f5f5f5';
  const cardBg = dark ? '#1c1c1e' : '#ffffff';
  const border = dark ? '#2c2c2e' : '#e5e7eb';
  const textMain = dark ? '#ffffff' : '#1f2937';
  const textSub = dark ? '#9ca3af' : '#6b7280';
  const inputBg = dark ? '#2c2c2e' : '#f9fafb';
  const btnBg = dark ? '#2c2c2e' : '#e5e7eb';
  const btnText = dark ? '#ffffff' : '#1f2937';

  return (
    <div style={{ minHeight:'100vh', background: bg, padding:'24px' }}>
      <div style={{ maxWidth:'520px', margin:'0 auto' }}>
        <h1 style={{ fontSize:'28px', fontWeight:'800', textAlign:'center', marginBottom:'8px', color: textMain }}>Fraction Calculator</h1>
        <p style={{ textAlign:'center', marginBottom:'32px', color: textSub }}>Add, subtract, multiply and divide fractions</p>

        <div style={{ background: cardBg, border:`1px solid ${border}`, borderRadius:'16px', padding:'28px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px', justifyContent:'center' }}>

            {/* Fraction 1 */}
            <div style={{ textAlign:'center' }}>
              <input type="number" value={n1} onChange={e => setN1(e.target.value)}
                style={{ width:'80px', background: inputBg, border:`1px solid ${border}`, borderRadius:'8px', padding:'8px', textAlign:'center', color: textMain, outline:'none' }} placeholder="1" />
              <div style={{ borderTop:`2px solid ${textSub}`, margin:'6px 0' }} />
              <input type="number" value={d1} onChange={e => setD1(e.target.value)}
                style={{ width:'80px', background: inputBg, border:`1px solid ${border}`, borderRadius:'8px', padding:'8px', textAlign:'center', color: textMain, outline:'none' }} placeholder="2" />
            </div>

            {/* Operators */}
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {['+','-','*','/'].map(o => (
                <button key={o} onClick={() => setOp(o)} style={{
                  width:'44px', height:'44px', borderRadius:'10px', fontWeight:'700', fontSize:'16px',
                  border:'none', cursor:'pointer', transition:'all 0.15s',
                  background: op === o ? '#6366f1' : btnBg,
                  color: op === o ? '#ffffff' : btnText,
                }}>{o}</button>
              ))}
            </div>

            {/* Fraction 2 */}
            <div style={{ textAlign:'center' }}>
              <input type="number" value={n2} onChange={e => setN2(e.target.value)}
                style={{ width:'80px', background: inputBg, border:`1px solid ${border}`, borderRadius:'8px', padding:'8px', textAlign:'center', color: textMain, outline:'none' }} placeholder="1" />
              <div style={{ borderTop:`2px solid ${textSub}`, margin:'6px 0' }} />
              <input type="number" value={d2} onChange={e => setD2(e.target.value)}
                style={{ width:'80px', background: inputBg, border:`1px solid ${border}`, borderRadius:'8px', padding:'8px', textAlign:'center', color: textMain, outline:'none' }} placeholder="3" />
            </div>
          </div>

          {/* Calculate button */}
          <button onClick={calculate} disabled={!n1 || !d1 || !n2 || !d2} style={{
            width:'100%', marginTop:'24px',
            background: (!n1 || !d1 || !n2 || !d2) ? (dark ? '#2c2c2e' : '#c7d2fe') : '#6366f1',
            color: (!n1 || !d1 || !n2 || !d2) ? (dark ? '#6b7280' : '#818cf8') : '#ffffff',
            border:'none', borderRadius:'12px', padding:'14px',
            fontWeight:'700', fontSize:'15px', cursor: (!n1 || !d1 || !n2 || !d2) ? 'not-allowed' : 'pointer',
            transition:'all 0.15s',
          }}>Calculate</button>

          {/* Result */}
          {result && (
            <div style={{ marginTop:'20px', background: dark ? '#0a0a0a' : '#f9fafb', border:`1px solid ${border}`, borderRadius:'12px', padding:'24px', textAlign:'center' }}>
              <div style={{ fontSize:'36px', fontWeight:'800', color:'#6366f1' }}>{result.num}/{result.den}</div>
              <div style={{ color: textSub, marginTop:'8px' }}>= {result.decimal}</div>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Fraction Calculator"
        description="Fraction Calculator adds, subtracts, multiplies, and divides two fractions entirely in your browser, automatically reducing every result to its simplest form and showing the decimal equivalent alongside it."
        howTo={[
          "Enter the numerator and denominator of your first fraction.",
          "Click one of the four operator buttons (+, −, ×, ÷) to choose the operation.",
          "Enter the numerator and denominator of your second fraction.",
          "Click \"Calculate\" to see the simplified result and its decimal equivalent."
        ]}
        faqs={[
          { q: "Does this calculator simplify fractions automatically?", a: "Yes, every result is automatically reduced to its lowest terms using the greatest common divisor." },
          { q: "Is Fraction Calculator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What operations can I perform?", a: "Addition, subtraction, multiplication, and division, working with positive and negative whole-number numerators and denominators." },
          { q: "Does it show a decimal equivalent?", a: "Yes, the decimal value is displayed alongside the simplified fraction result." }
        ]}
        tips={[
          "Enter a negative sign in the numerator field to work with negative fractions.",
          "Use the decimal result shown alongside the fraction to sanity-check your answer.",
          "Make sure your second fraction's numerator isn't zero when dividing — division by zero won't produce a valid result.",
          "Bookmark this page for quick access whenever you need to check fraction homework or calculations."
        ]}
      />
    </div>
  );
}