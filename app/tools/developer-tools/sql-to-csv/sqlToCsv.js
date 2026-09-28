// SQL INSERT statements -> CSV text, pure (unit-tested in scripts/sql-to-csv-tests/).
// 29/09: a multi-row INSERT -- VALUES (1,'Ann'), (2,'Bob'), the form mysqldump and most exports write -- used to keep
// ONLY its first row, silently (measured: 3 rows in, 1 out). CodeShack, ranked first for "sql to csv", reads every
// row. Quoted identifiers (`users`, "users", [users], schema.table), INSERT IGNORE and an INSERT without a column list
// were refused with "No INSERT statements found"; they are read now.

// RFC 4180-style CSV field writer: a value that itself contains a comma,
// double quote, or newline is indistinguishable from a delimiter unless it's
// wrapped in double quotes (with any internal quote doubled).
export function csvField(v) {
  const s = String(v ?? '');
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// Parses a SQL "(a, b, c)" list starting at the '(' at `input[start]`,
// respecting single-quoted string literals (where '' is an escaped quote) so
// a literal ',' or ')' inside a quoted value — e.g. VALUES ('Smith (Jr), II')
// — isn't mistaken for the list's own delimiter or closing paren.
export function parseSqlParenList(input, start) {
  let i = start + 1;
  const n = input.length;
  const items = [];
  let item = '';
  let inString = false;
  while (i < n) {
    const c = input[i];
    if (inString) {
      if (c === "'") {
        if (input[i + 1] === "'") { item += "''"; i += 2; continue; }
        inString = false; item += c; i++; continue;
      }
      item += c; i++; continue;
    }
    if (c === "'") { inString = true; item += c; i++; continue; }
    if (c === ',') { items.push(item.trim()); item = ''; i++; continue; }
    if (c === ')') { items.push(item.trim()); return { items, end: i + 1 }; }
    item += c; i++;
  }
  items.push(item.trim());
  return { items, end: n };
}

// Strips the surrounding quotes from a single SQL value (leaving numeric/NULL
// values as-is) and unescapes a doubled '' back to a literal single quote.
export function unquoteSqlValue(v) {
  const t = v.trim();
  if (t.length >= 2 && t[0] === "'" && t[t.length - 1] === "'") {
    return t.slice(1, -1).replace(/''/g, "'");
  }
  return t;
}

// `id`, "id", [id] -> id
const unquoteIdent = (s) => s.trim().replace(/^[`"[]|[`"\]]$/g, '');
const IDENT = '(?:[`"\\[]?[\\w$]+[`"\\]]?)';
const INSERT_RE = new RegExp(`INSERT\\s+(?:IGNORE\\s+)?INTO\\s+(${IDENT}(?:\\.${IDENT})?)\\s*(\\(|VALUES\\s*\\()`, 'gi');

/** @returns {string} CSV text (header row first) @throws {Error} when no INSERT statement is found */
export function sqlInsertsToCsv(input) {
  const rows = [];
  let headers = null;
  INSERT_RE.lastIndex = 0;
  let match;
  while ((match = INSERT_RE.exec(input)) !== null) {
    const openAt = match.index + match[0].length - 1; // the '(' that ends the match
    let cols = null;
    let valuesAt = openAt;
    if (match[2] === '(') { // a column list first, then VALUES (
      cols = parseSqlParenList(input, openAt);
      const valuesMatch = /^\s*VALUES\s*\(/i.exec(input.slice(cols.end));
      if (!valuesMatch) { INSERT_RE.lastIndex = cols.end; continue; }
      valuesAt = cols.end + valuesMatch[0].length - 1;
    }
    let vals = parseSqlParenList(input, valuesAt);
    if (!headers) {
      headers = cols ? cols.items.map(unquoteIdent) : vals.items.map((_, k) => `column_${k + 1}`);
      rows.push(headers.map(csvField).join(','));
    }
    rows.push(vals.items.map(unquoteSqlValue).map(csvField).join(','));
    // Every further tuple of the same statement: VALUES (...), (...), (...);
    let at = vals.end;
    for (;;) {
      const next = /^\s*,\s*\(/.exec(input.slice(at));
      if (!next) break;
      vals = parseSqlParenList(input, at + next[0].length - 1);
      rows.push(vals.items.map(unquoteSqlValue).map(csvField).join(','));
      at = vals.end;
    }
    INSERT_RE.lastIndex = at;
  }
  if (rows.length === 0) throw new Error('No INSERT statements found');
  return rows.join('\n');
}
