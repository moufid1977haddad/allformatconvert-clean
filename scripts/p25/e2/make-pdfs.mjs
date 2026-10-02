import { chromium } from '@playwright/test';
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Quarterly report</title>
<style>body{font-family:Arial,sans-serif;margin:2cm} table{border-collapse:collapse} td,th{border:1px solid #444;padding:4px}</style></head>
<body><h1>Quarterly report</h1><p>Revenue grew by 12 % — café, naïve, Straße, Ελληνικά, Кириллица.</p>
<h2>Highlights</h2><ul><li>New customers: 1,204</li><li>Churn: 2.1 %</li></ul>
<table><thead><tr><th>Region</th><th>Sales</th></tr></thead><tbody><tr><td>Europe</td><td>4.2 M</td></tr><tr><td>Americas</td><td>6.8 M</td></tr></tbody></table>
<p><img alt="Bar chart of sales by region" width="200" height="80" src="data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'80\'><rect width=\'80\' height=\'40\' y=\'40\' fill=\'#36c\'/><rect x=\'100\' width=\'80\' height=\'80\' fill=\'#c63\'/></svg>')}"></p>
</body></html>`;
const b = await chromium.launch(); const p = await b.newPage();
await p.setContent(html);
await p.pdf({ path: process.argv[2] + '/tagged.pdf', format: 'A4', tagged: true, printBackground: true });
await p.pdf({ path: process.argv[2] + '/untagged.pdf', format: 'A4', tagged: false, printBackground: true });
await b.close(); console.log('ok');
