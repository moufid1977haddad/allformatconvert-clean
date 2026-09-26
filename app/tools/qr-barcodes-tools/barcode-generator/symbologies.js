// The barcode types offered, grouped as on the page. `bcid` is bwip-js's encoder name; `sample` is a valid value;
// `extra` holds options the type always needs; `zxing` is the format name zxing-cpp reads it as (the page reads every code back before offering it, and the test
// suite does the same) -- null where no independent reader exists: those are checked by the suite's own decoders
// (scripts/browser-tests/barcode-generator.mjs). `check` says what the page does about a check digit.
// Kept to what is proved: every entry here is generated and read back in Chromium and Firefox by the suite.
export const GROUPS = [
  {
    name: 'Linear',
    items: [
      { bcid: 'code128', label: 'Code 128', sample: 'ABC-12345', hint: 'Any text (ASCII). The most widely used general-purpose barcode.', zxing: 'Code128' },
      { bcid: 'gs1-128', label: 'GS1-128 (UCC/EAN-128)', sample: '(01)09501101530003(17)261231(10)ABC123', hint: 'GS1 Application Identifiers in brackets, e.g. (01)GTIN(17)expiry(10)batch. Check digits are verified.', zxing: 'Code128', gs1: true },
      { bcid: 'code39', label: 'Code 39', sample: 'CODE-39 TEST', hint: 'Upper-case letters, digits, space and - . $ / + %', zxing: 'Code39', checkOption: 'includecheck' },
      { bcid: 'code39ext', label: 'Code 39 Extended (Full ASCII)', sample: 'Code 39 ext', hint: 'Any ASCII text, encoded with Code 39 pairs.', zxing: 'Code39' },
      { bcid: 'code93', label: 'Code 93', sample: 'CODE93', hint: 'Upper-case letters, digits, space and - . $ / + %', zxing: 'Code93', extra: { includecheck: true } }, // the two check characters are mandatory: without them zxing cannot read it (measured)
      { bcid: 'code32', label: 'Code 32 (Italian Pharmacode)', sample: '01234567', hint: '8 digits (the check digit is added).', zxing: 'Code32' },
      { bcid: 'rationalizedCodabar', label: 'Codabar', sample: 'A40156B', hint: 'Digits and - $ : / . +, between start/stop letters A-D (e.g. A40156B).', zxing: 'Codabar' },
      { bcid: 'interleaved2of5', label: 'Interleaved 2 of 5 (ITF)', sample: '12345678', hint: 'An even number of digits.', zxing: 'ITF', checkOption: 'includecheck' },
      { bcid: 'itf14', label: 'ITF-14 (GTIN-14 cartons)', sample: '1540014128876', hint: '13 digits (check digit added) or 14 digits (check digit verified).', zxing: 'ITF', check: 'auto' },
      { bcid: 'msi', label: 'MSI Plessey', sample: '1234567', hint: 'Digits only. Choose the check digit scheme your scanner expects.', zxing: null, msi: true },
      { bcid: 'pharmacode', label: 'Pharmacode (one-track)', sample: '1234', hint: 'A number from 3 to 131070.', zxing: null },
      { bcid: 'code11', label: 'Code 11', sample: '0123-4567', hint: 'Digits and dash.', zxing: null },
      { bcid: 'telepen', label: 'Telepen (alpha)', sample: 'Telepen 1', hint: 'Any ASCII text.', zxing: 'Telepen' },
      { bcid: 'pzn', label: 'PZN8 (German pharmacy)', sample: '1234562', hint: '7 digits (check digit added) or 8 digits (verified).', zxing: 'PZN', extra: { pzn8: true } }, // PZN7 was retired in 2013; bwip-js's default is PZN7, which readers take for plain Code 39
    ],
  },
  {
    name: 'EAN / UPC / ISBN',
    items: [
      { bcid: 'ean13', label: 'EAN-13', sample: '5901234123457', hint: '12 digits (check digit added) or 13 digits (verified).', zxing: 'EAN13', check: 'auto' },
      { bcid: 'ean8', label: 'EAN-8', sample: '96385074', hint: '7 digits (check digit added) or 8 digits (verified).', zxing: 'EAN8', check: 'auto' },
      { bcid: 'upca', label: 'UPC-A', sample: '036000291452', hint: '11 digits (check digit added) or 12 digits (verified).', zxing: 'UPCA', check: 'auto' },
      { bcid: 'upce', label: 'UPC-E', sample: '01234565', hint: '7 digits starting with 0 or 1 (check digit added) or 8 digits.', zxing: 'UPCE', check: 'auto' },
      { bcid: 'isbn', label: 'ISBN (Bookland EAN-13)', sample: '978-1-56581-231-4', hint: 'ISBN-13 with hyphens, e.g. 978-1-56581-231-4 (ISBN-10 is converted).', zxing: 'EAN13' },
      { bcid: 'ismn', label: 'ISMN (sheet music)', sample: '979-0-2605-3211-3', hint: 'ISMN with hyphens.', zxing: 'EAN13' },
      { bcid: 'issn', label: 'ISSN (periodicals)', sample: '0311-175X', hint: 'ISSN with hyphen, e.g. 0311-175X.', zxing: 'EAN13' },
    ],
  },
  {
    name: 'GS1 DataBar',
    items: [
      { bcid: 'databaromni', label: 'DataBar Omnidirectional', sample: '(01)09501101530003', hint: '(01) followed by a 14-digit GTIN.', zxing: 'DataBar', gs1: true },
      { bcid: 'databarstacked', label: 'DataBar Stacked', sample: '(01)09501101530003', hint: '(01) followed by a 14-digit GTIN.', zxing: 'DataBar', gs1: true },
      { bcid: 'databarstackedomni', label: 'DataBar Stacked Omnidirectional', sample: '(01)09501101530003', hint: '(01) followed by a 14-digit GTIN.', zxing: 'DataBar', gs1: true },
      { bcid: 'databarlimited', label: 'DataBar Limited', sample: '(01)09501101530003', hint: '(01) and a GTIN starting with 0 or 1.', zxing: 'DataBarLimited', gs1: true },
      { bcid: 'databarexpanded', label: 'DataBar Expanded', sample: '(01)09501101530003(3103)000123', hint: 'GS1 Application Identifiers in brackets.', zxing: 'DataBarExpanded', gs1: true },
      { bcid: 'databarexpandedstacked', label: 'DataBar Expanded Stacked', sample: '(01)09501101530003(3103)000123(15)261231', hint: 'GS1 Application Identifiers in brackets.', zxing: 'DataBarExpanded', gs1: true },
    ],
  },
  {
    name: '2D',
    items: [
      { bcid: 'qrcode', label: 'QR Code', sample: 'https://www.onlineconvertools.com', hint: 'Any text or URL.', zxing: 'QRCode', twoD: 'qr' },
      { bcid: 'microqrcode', label: 'Micro QR', sample: '12345', hint: 'Short text (up to 35 digits or 21 characters).', zxing: 'MicroQRCode', twoD: 'qr' },
      { bcid: 'datamatrix', label: 'Data Matrix', sample: 'Data Matrix 123', hint: 'Any text.', zxing: 'DataMatrix', twoD: 'dm' },
      { bcid: 'gs1datamatrix', label: 'GS1 DataMatrix', sample: '(01)09501101530003(17)261231(10)ABC123', hint: 'GS1 Application Identifiers in brackets.', zxing: 'DataMatrix', gs1: true, twoD: 'dm' },
      { bcid: 'pdf417', label: 'PDF417', sample: 'PDF417 sample text', hint: 'Any text; used on ID cards, boarding passes and shipping labels.', zxing: 'PDF417', twoD: 'pdf417' },
      { bcid: 'micropdf417', label: 'MicroPDF417', sample: 'MicroPDF', hint: 'Short text.', zxing: 'MicroPDF417' },
      { bcid: 'azteccode', label: 'Aztec Code', sample: 'Aztec Code 123', hint: 'Any text; used on transport tickets.', zxing: 'Aztec', twoD: 'aztec' },
      { bcid: 'maxicode', label: 'MaxiCode', sample: 'MaxiCode test', hint: 'Short text (UPS parcels).', zxing: 'MaxiCode' },
    ],
  },
];

export const ALL = GROUPS.flatMap((g) => g.items);
export const byId = (bcid) => ALL.find((s) => s.bcid === bcid);
export const IS_2D = (s) => ['qrcode', 'microqrcode', 'datamatrix', 'gs1datamatrix', 'pdf417', 'micropdf417', 'azteccode', 'maxicode'].includes(s.bcid);
