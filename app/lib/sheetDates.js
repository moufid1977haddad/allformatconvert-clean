// Dates were exported as Excel serial numbers (2024-01-15 became 45306) --
// measured 29/09. A cell whose number format is a date becomes an ISO 8601
// text: "2024-01-15", or "2024-02-29T13:45:00" when it has a time. No time
// zone is applied: Excel dates have none.
const pad2 = (n) => String(n).padStart(2, '0');
export function datesToText(ws, XLSX) {
  for (const addr of Object.keys(ws)) {
    if (addr[0] === '!') continue;
    const c = ws[addr];
    if (c.t !== 'n' || !c.z || !XLSX.SSF.is_date(c.z)) continue;
    const d = XLSX.SSF.parse_date_code(c.v);
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
