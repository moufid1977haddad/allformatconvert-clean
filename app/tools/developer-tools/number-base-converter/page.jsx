'use client';
import SeoContent from '../../../components/SeoContent';
import BaseConverter from '../../../components/BaseConverter';

export default function NumberBaseConverterDevPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Number Base Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between binary, octal, decimal, hex and any base from 2 to 36</p>
        <BaseConverter />
      </div>
      <SeoContent
        title="Number Base Converter"
        description="Number Base Converter shows a number in binary, octal, decimal, hexadecimal and any base from 2 to 36 you choose, live as you type, with fractional parts and numbers of any size converted exactly, entirely in your browser — nothing is uploaded to a server. Pick the base your input is written in, and the results update instantly; negative numbers and fractional parts are handled."
        howTo={[
          "Type a number into the Value field.",
          "Select the base your input is written in from the 'From Base' dropdown (2 to 36).",
          "Read the binary, octal, decimal and hexadecimal results, plus the base chosen in 'Also convert to', updating live below.",
          "Change the value or the 'From Base' setting at any time to see updated results instantly."
        ]}
        faqs={[
          { q: "What number bases does it support?", a: "Every base from 2 to 36 (digits 0-9 then A-Z), as input and as output. Binary, octal, decimal and hexadecimal are always shown, plus the base you pick in 'Also convert to'." },
          { q: "Is there a Convert button or a target-base selector?", a: "There's no Convert button: results update as you type. The 'Also convert to' selector adds any base from 2 to 36 to the four usual ones." },
          { q: "Can I convert negative numbers?", a: "Yes, negative numbers are supported and converted correctly across all four bases." },
          { q: "Can I convert decimal (fractional) numbers, like 3.5?", a: "Yes. The fractional part is converted exactly; when it does not end in the target base (0.1 in binary is 0.000110011…), 40 digits are shown followed by '…' instead of a rounded value." }
        ]}
        tips={[
          "All four bases update live as you type — there's no need to click a button.",
          "Set 'From Base' to match how your input is written; entering '10' as hexadecimal gives a different result than entering it as decimal.",
          "Numbers of any size are exact: 2^64 - 1 shows as FFFFFFFFFFFFFFFF, not rounded.",
          "The base's own prefix is accepted: 0b101 in binary, 0o17 in octal, 0xFF in hexadecimal."
        ]}
      />
    </div>
  );
}