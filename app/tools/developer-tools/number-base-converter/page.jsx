'use client';
import SeoContent from '../../../components/SeoContent';
import BaseConverter from '../../../components/BaseConverter';

export default function NumberBaseConverterDevPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Number Base Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Hex, binary, octal and decimal, with 0x, 0b and 0o prefixes</p>
        <BaseConverter />
      </div>
      <SeoContent
        title={"Number Base Converter"}
        description={"This page shows how the converter reads programming notation. Paste a value the way source code writes it, such as 0xFF, 0b1010 or 0o17, with _ digit separators as in 0xFFFF_FFFF, set From Base to match, and read binary, octal, decimal and hexadecimal at once, plus a fifth result for any other base up to 36 that you pick. The arithmetic uses BigInt, so a value like 0xFFFF_FFFF_FFFF_FFFF stays exactly 18446744073709551615 instead of being rounded. A negative value keeps its minus sign; two's complement is not computed. Results update on every keystroke."}
        example={{
          caption: "The largest unsigned 64-bit value, typed with its prefix and separators, From Base set to Hexadecimal (16):",
          inputLabel: "Value",
          input: "0xFFFF_FFFF_FFFF_FFFF",
          outputLabel: "Results",
          output: "Binary (2)        1111111111111111111111111111111111111111111111111111111111111111\nOctal (8)         1777777777777777777777\nDecimal (10)      18446744073709551615\nHexadecimal (16)  FFFFFFFFFFFFFFFF\nBase 36 (36)      3W5E11264SGSF",
        }}
        howToTitle={"How to convert hex, binary and octal"}
        howTo={[
          "Set \"From Base\" to the base your value is written in, for example \"Hexadecimal\".",
          "Type or paste the value in \"Value\"; a matching prefix such as 0xFF, 0b101 or 0o17 and _ separators are accepted.",
          "Read binary, octal, decimal and hexadecimal at once, and pick an extra base in \"Also convert to\".",
          "Click \"Copy\" under a result to copy that value."
        ]}
        specs={[
          { label: "Input", value: "Digits 0-9 then A-Z up to the chosen base, an optional sign, one point; _ and spaces ignored; prefixes as in 0b101, 0o17 and 0xFF for bases 2, 8 and 16" },
          { label: "Output", value: "Binary, octal, decimal, hexadecimal, and a fifth card when Also convert to holds another base; upper-case letters unless you untick them" },
          { label: "Integer size", value: "The code sets no digit cap: integers are exact BigInt values" },
          { label: "Point", value: "Accepted once; a result that does not end shows its first 40 digits, then …" }
        ]}
        privacyTitle={"Where your numbers are processed"}
        privacy={"Conversion happens in this page with exact integer arithmetic run by your browser, so the values you type are not sent to our servers. The results are page text: if you turn on a translation in the language menu, Google receives them. When the clipboard refuses a copy, we receive that error, the tool's name and your browser's name and version, not your value."}
        faqs={[
          { q: "How do I convert hex to binary?", a: "Set From Base to Hexadecimal and type the value, with or without its prefix, as in 0x0F or 0F. The Binary card shows the result at once, without leading zeros: 0x0F gives 1111." },
          { q: "Does it show two's complement for negative numbers?", a: "No. A negative value is shown with a minus sign in every base, so -1 stays -1 in hex rather than FFFFFFFF. A two's complement pattern needs a fixed width, which this tool does not ask for." },
          { q: "Can it handle values above 2^64?", a: "Yes. It works with BigInt, so 2^64, written 0x1_0000_0000_0000_0000, converts to 18446744073709551616 exactly, and larger values work the same way. A JavaScript Number would round them." },
          { q: "Why do I get Not a number in base 16?", a: "The value has a character outside that base's digits, such as G in hex, or a prefix that belongs to another base, such as 0x10 with Binary selected. Below the field, the alert lists what base 16 allows: 0123456789…F." }
        ]}
        tips={[
          "Untick \"Upper-case letters\" to match code that prints hex in lower case, such as Python's hex()."
        ]}
      />
    </div>
  );
}