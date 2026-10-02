'use client';
import SeoContent from '../../../components/SeoContent';
import BaseConverter from '../../../components/BaseConverter';

export default function NumberBaseConverterPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Number Base Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between binary, octal, decimal, hex and any base from 2 to 36</p>
        <BaseConverter />
      </div>
      <SeoContent
        title="Number Base Converter"
        description="Number Base Converter instantly converts a number between binary, octal, decimal, hexadecimal and any base from 2 to 36, fractional parts and numbers of any size included, exactly, as you type — entirely in your browser."
        howTo={[
          "Enter your number in the input field.",
          "Select the base your number is currently in (2 to 36).",
          "View the value in binary, octal, decimal and hexadecimal, plus the base chosen in 'Also convert to', updated instantly.",
          "Click \"Copy\" next to any result to copy it to your clipboard."
        ]}
        faqs={[
          { q: "What number bases does this converter support?", a: "Every base from 2 to 36 (digits 0-9 then A-Z), as input and as output; binary, octal, decimal and hexadecimal are always shown, plus the base you pick in 'Also convert to'." },
          { q: "Can I convert fractional numbers like 10.5?", a: "Yes, exactly. When the fraction does not end in the target base (0.1 decimal in binary), 40 digits are shown followed by '…' rather than a rounded value." },
          { q: "Is Number Base Converter free to use?", a: "Yes, it's completely free with no registration and no usage limits." },
          { q: "Can I convert negative numbers?", a: "Yes, negative numbers are converted using a standard sign-based representation (not two's complement), so a negative decimal converts to a negative value in the target base." },
          { q: "Do I need to pick a target base to convert to?", a: "No — binary, octal, decimal and hexadecimal are always shown; 'Also convert to' adds one more base of your choice." }
        ]}
        tips={[
          "Double-check your \"From Base\" selection before typing — 10 read as hexadecimal is sixteen.",
          "Use the Hexadecimal result directly for CSS/HTML color codes or memory addresses.",
          "If your input contains a digit that isn't valid for the selected source base (e.g., an \"8\" in binary), a message lists the digits that base uses.",
          "Click \"Copy\" on any result card to grab that base's value."
        ]}
      />
    </div>
  );
}