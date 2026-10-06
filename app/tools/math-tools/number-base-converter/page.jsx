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
        title={"Number Base Converter"}
        description={"Number Base Converter rewrites a number from one positional base to another, for every base from 2 to 36, with digits 0-9 followed by the letters A-Z. It keeps a fractional part exact: when the fraction never ends in the new base, as 0.1 does in base 2, the first 40 digits appear followed by …, cut and not rounded. Binary, octal, decimal and hexadecimal are always displayed, and Also convert to adds a fifth result when you pick a base other than 2, 8, 10 or 16 (base 36 at first). Negative numbers keep their minus sign. The answer changes with each keystroke, computed with exact fractions of whole numbers in this tab."}
        example={{
          caption: "A negative decimal number with a fractional part, From Base on Decimal (10) and Also convert to on Base 3:",
          inputLabel: "Value",
          input: "-10.1",
          outputLabel: "Results",
          output: "Binary (2)        -1010.0001100110011001100110011001100110011001…\nOctal (8)         -12.0631463146314631463146314631463146314631…\nDecimal (10)      -10.1\nHexadecimal (16)  -A.1999999999999999999999999999999999999999…\nBase 3            -101.0022002200220022002200220022002200220022…",
        }}
        howToTitle={"How to change the base of a number"}
        howTo={[
          "Write the number in \"Value\", with a point before the fractional part if there is one.",
          "Choose its current base in \"From Base\"; \"Decimal\" is selected when the page opens.",
          "Pick a fifth result base in \"Also convert to\", for instance base 3 or base 7.",
          "Click \"Copy\" under a result; a value ending in … is copied with its 40 digits after the point."
        ]}
        specs={[
          { label: "Bases", value: "Any base from 2 to 36, both for the number you enter and for the results" },
          { label: "Digits", value: "0-9, then A = 10, B = 11 and so on up to Z = 35" },
          { label: "Fractions", value: "Exact; a fraction that does not end stops after 40 digits, marked …" },
          { label: "Negative numbers", value: "Sign kept in front; not two's complement" }
        ]}
        privacyTitle={"Where your numbers are processed"}
        privacy={"Every step of the conversion runs in this tab with exact fractions of whole numbers, so nothing you type travels to our servers or is saved. Results are shown as page text, which Google receives if you switch on a translation in the language menu. A failed copy to the clipboard sends us the error, the tool's name and your browser's name and version, never your number."}
        faqs={[
          { q: "Does 0.1 end in binary?", a: "No. 0.1 is 1/10, and 10 has the prime factor 5, which 2 does not; a fraction ends in base b only when its reduced denominator has no prime factor outside those of b. The tool shows 40 digits of 0.0001100110011… instead of a rounded number." },
          { q: "Can I convert a number from base 3 to base 7?", a: "Yes. Choose Base 3 in From Base, type the number with the digits 0, 1 and 2, then choose Base 7 in Also convert to. The base 7 result appears next to the binary, octal, decimal and hexadecimal ones." },
          { q: "How many digits does base 36 use?", a: "36: 0 to 9, then A for 10, B for 11 and so on up to Z for 35. Upper and lower case are both accepted when you type; untick Upper-case letters to see the results in lower case." },
          { q: "Does it use two's complement for negative numbers?", a: "No. The minus sign is kept and the size of the number is converted: -10.1 in decimal is -1010.0001100110011… in binary. Two's complement depends on a fixed number of bits, which this converter does not use." },
          { q: "Is 9 accepted in octal?", a: "No. Octal uses only the digits 0 to 7, just as binary uses 0 and 1. A number with a digit its base lacks, or with two points, is refused, and a red line names the digits that base allows." }
        ]}
        tips={[
          "Check a conversion done by hand: type your answer in \"Value\", select its base in \"From Base\", and compare with the number you started from."
        ]}
      />
    </div>
  );
}