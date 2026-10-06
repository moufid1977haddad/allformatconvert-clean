// The page's path and its hand-written related links (page.jsx), and the canonical address (layout.tsx). P36 (06/10):
// the title, description and FAQ moved into layout.tsx and the page's SeoContent, where the content checks read them.
export const SEO = {
  name: 'Barcode Generator',
  path: '/tools/qr-barcodes-tools/barcode-generator',
  category: { name: 'QR & Barcode Tools', path: '/tools/qr-barcodes-tools' },
  applicationCategory: 'UtilitiesApplication',
  related: [
    { href: '/tools/qr-barcodes-tools/qr-generator', label: 'QR Code Generator', note: 'QR codes for links, Wi-Fi, contacts and SMS, with colors and a logo, checked by a QR reader before download.' },
    { href: '/tools/qr-barcodes-tools/qr-scanner', label: 'QR Code Scanner', note: 'read a QR code or a barcode from your camera or a picture; the image is not uploaded.' },
  ],
};
