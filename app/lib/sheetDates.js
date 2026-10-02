// Dates were exported as Excel serial numbers (2024-01-15 became 45306) --
// measured 29/09. A cell whose number format is a date becomes an ISO 8601
// text: "2024-01-15", or "2024-02-29T13:45:00" when it has a time. No time
// zone is applied: Excel dates have none.
const pad2 = (n) => String(n).padStart(2, '0');
// P24 review (03/10): a workbook on the 1904 date system (older Mac Excel) shifted every date by 4 years and 1 day.
export function datesToText(ws, XLSX, date1904 = false) {
  for (const addr of Object.keys(ws)) {
    if (addr[0] === '!') continue;
    const c = ws[addr];
    if (c.t !== 'n' || !c.z || !XLSX.SSF.is_date(c.z)) continue;
    // review (03/10): a duration ([h]:mm:ss — 36 h was written 1900-01-01T12:00:00) or a format without a date part
    // (mm:ss) keeps the text Excel shows, as Excel's own CSV does
    const plain = String(c.z).replace(/"[^"]*"|\\./g, '');
    if (/\[(h+|m+|s+)\]/i.test(plain) || !/[yd]/i.test(plain)) { c.t = 's'; c.v = c.w ?? XLSX.SSF.format(c.z, c.v); delete c.w; continue; }
    const d = XLSX.SSF.parse_date_code(c.v, { date1904 });
    if (!d) continue;
    const date = `${String(d.y).padStart(4, '0')}-${pad2(d.m)}-${pad2(d.d)}`;
    const hasTime = d.H || d.M || d.S;
    c.t = 's';
    const time = `${pad2(d.H)}:${pad2(d.M)}:${pad2(d.S)}`;
    // A time with no date (format hh:mm) is stored as a fraction of a day.
    c.v = c.v >= 0 && c.v < 1 ? time : hasTime ? `${date}T${time}` : date;
    delete c.w;
  }
}

// P24 review (03/10): Excel to CSV wrote the "General" format's DISPLAY text, cut to 11 characters by SheetJS: an EAN-13
// 4006381333931 became "4.00638E+12" and 1/3 "0.333333333". Excel's own CSV writes the number to 15 significant
// digits; a number with a format of its own (currency, percent, custom) keeps its formatted text, as in Excel.
export function generalNumbersInFull(ws, XLSX) {
  for (const addr of Object.keys(ws)) {
    if (addr[0] === '!') continue;
    const c = ws[addr];
    if (c.t !== 'n' || (c.z && c.z !== 'General') || !Number.isFinite(c.v)) continue;
    // review (03/10): ODS cells carry no format code — only text that IS the General rendering is rewritten, so
    // "50 %" or "1 234,56 €" keep their formatted text
    if (c.w !== undefined && XLSX && c.w !== XLSX.SSF.format('General', c.v)) continue;
    c.w = String(Number(c.v.toPrecision(15)));
  }
}
export const workbookIs1904 = (wb) => !!(wb && wb.Workbook && wb.Workbook.WBProps && wb.Workbook.WBProps.date1904);
