import { ALL } from './symbologies';

export const faqs = [
          { q: 'Is Barcode Generator free?', a: 'Yes — no signup, no watermark, no limit on how many barcodes you make, and you may use them commercially. Up to 5,000 codes fit in one ZIP.' },
          { q: 'Which barcode types are supported?', a: `${ALL.length} types: ${ALL.map((s) => s.label).join(', ')}.` },
          { q: 'How do I know the barcode scans?', a: 'After drawing it, the page decodes it with zxing-cpp, an open-source reader independent of the engine that drew it, and only offers the files if it reads exactly what you entered (check digits included). MSI Plessey, Pharmacode and Code 11 have no such reader in a browser: they are marked as not scanned back. Test with your own scanner before printing large runs.' },
          { q: 'What size should I choose for print?', a: 'Retail EAN/UPC codes are nominally 0.33 mm per module (100 %), from 0.264 mm (80 %) to 0.66 mm (200 %). Vector files (SVG, PDF, EPS) have exactly the module width you set. PNG, JPG and GIF use a whole number of pixels per module so bars stay sharp: the page shows the closest size it can make at your resolution, and writes that resolution into the file.' },
          { q: 'Does it add the check digit?', a: 'For EAN-13, EAN-8, UPC-A, UPC-E and ITF-14, type the number without its last digit and it is calculated; type it in full and it is verified. GS1 codes check the digits of each Application Identifier. Code 93 always includes its two check characters, as its standard requires; Code 39 and Interleaved 2 of 5 can add an optional one; MSI offers the usual schemes.' },
          { q: 'Can I make many barcodes at once?', a: 'Yes. Paste one value per line (or import a CSV or TSV file: first column the value, second column an optional text to print under the code), or set a prefix, a first number, a count, a step, zero-padding and a suffix to number a series; every code is checked and they come as one ZIP, with any value that could not be encoded listed in errors.txt.' },
          { q: 'How do I add a price or issue add-on (EAN-5, EAN-2)?', a: 'Type it after the code and a space: 978-1-56581-231-4 51299 for a book price, 0311-175X 00 05 for a periodical issue (ISSN, variant, issue). The add-on is drawn 9 modules from the code, inside the 7-12 modules the GS1 standard allows, and scanned back with it. EAN-5 and EAN-2 can also be made on their own.' },
          { q: 'Can I print barcodes on label sheets?', a: 'Yes. In "Many", choose "Label sheets (PDF)", pick an Avery A4 or US Letter sheet, a thermal roll size, or your own layout, the first free label and the number of copies. Each code keeps the size you set (it is only shrunk if it does not fit, and the page tells you by how much), or you can ask it to fill the label. Print the PDF at 100 % ("Actual size").' },
          { q: 'Is my data private?', a: 'Yes. Everything is drawn and checked in your browser; nothing you type is sent to a server.' },
        ];

// One source for this page's search content (visible FAQ and links in page.jsx, metadata and structured data in
// layout.tsx). 29/09 (croissance-29-09, point 4): the metadata said 35 types while the page makes ALL.length (37);
// the count now comes from the same list as the tool itself.
export const SEO = {
  name: 'Barcode Generator',
  path: '/tools/qr-barcodes-tools/barcode-generator',
  category: { name: 'QR & Barcode Tools', path: '/tools/qr-barcodes-tools' },
  applicationCategory: 'UtilitiesApplication',
  title: `Barcode Generator — ${ALL.length} Types: EAN-13, UPC, Code 128, SVG/PDF`,
  description: `Free barcode generator: ${ALL.length} types (Code 128, EAN-13, UPC-A, ISBN, GS1-128, Data Matrix, PDF417, Aztec…) in print sizes as PNG, SVG, PDF or EPS, one or thousands, and label sheets. Every code is scanned back before you download it.`,
  faqs,
  related: [
    { href: '/tools/qr-barcodes-tools/qr-generator', label: 'QR Code Generator', note: 'QR codes for links, Wi-Fi, contacts and SMS, each scanned back before download.' },
    { href: '/tools/qr-barcodes-tools/qr-scanner', label: 'QR Scanner', note: 'decode a QR code from an image; the image never leaves your device.' },
  ],
};
