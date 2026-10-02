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
  let depth = 0; // P24 review (03/10): NOW(), CONCAT('a', 'b') — a function's own brackets used to close the list
  while (i < n) {
    const c = input[i];
    if (inString) {
      // MySQL (mysqldump) escapes a quote as \' -- 'O\'Brien'. Standard SQL keeps a backslash literal, so 'C:\' closes
      // right after it: a \' followed by a comma or a closing parenthesis is read as that end of string.
      if (c === '\\' && input[i + 1] === "'" && !/^\s*[,)]/.test(input.slice(i + 2))) { item += "\\'"; i += 2; continue; }
      if (c === "'") {
        if (input[i + 1] === "'") { item += "''"; i += 2; continue; }
        inString = false; item += c; i++; continue;
      }
      item += c; i++; continue;
    }
    if (c === "'") { inString = true; item += c; i++; continue; }
    if (c === '(') { depth++; item += c; i++; continue; }
    if (c === ')' && depth > 0) { depth--; item += c; i++; continue; }
    if (c === ',' && depth === 0) { items.push(item.trim()); item = ''; i++; continue; }
    if (c === ')') { items.push(item.trim()); return { items, end: i + 1 }; }
    item += c; i++;
  }
  items.push(item.trim());
  return { items, end: n };
}

// Strips the surrounding quotes from a single SQL value (leaving numeric/NULL
// values as-is) and unescapes a doubled '' (standard) or a \' (MySQL) back to a literal single quote. Other
// backslash sequences are kept as written: their meaning differs between MySQL and standard SQL.
export function unquoteSqlValue(v) {
  const t = v.trim();
  if (/^NULL$/i.test(t)) return ''; // SQL NULL is an empty CSV field (convertcsv's default), not the word NULL
  if (t.length >= 2 && t[0] === "'" && t[t.length - 1] === "'") {
    return t.slice(1, -1).replace(/''/g, "'").replace(/\\'/g, "'");
  }
  return t;
}

// `id`, "id", [id] -> id
const unquoteIdent = (s) => s.trim().replace(/^[`"[]|[`"\]]$/g, '');
const IDENT = '(?:[`"\\[]?[\\w$]+[`"\\]]?)';
const INSERT_RE = new RegExp(`INSERT\\s+(?:IGNORE\\s+)?INTO\\s+(${IDENT}(?:\\.${IDENT})?)\\s*(\\(|VALUES\\s*\\()`, 'gi');

/** @returns {string} CSV text (header row first) @throws {Error} when no INSERT statement is found */
export function sqlInsertsToCsv(input, { table = null } = {}) {
  const rows = [];
  let headers = null;
  // P24 review (03/10): a dump with INSERTs into several tables put the second table's rows under the first one's
  // header. One CSV holds one table: the tables are listed and one is chosen (`table`).
  const tables = [];
  { INSERT_RE.lastIndex = 0; let m; while ((m = INSERT_RE.exec(input)) !== null) { const t = unquoteIdent(m[1].split('.').pop()); if (!tables.includes(t)) tables.push(t); } }
  if (tables.length > 1 && !table) { const e = new Error(`This SQL inserts into ${tables.length} tables (${tables.join(', ')}); a CSV holds one table. Choose the table to convert.`); e.tables = tables; throw e; }
  const only = table || tables[0];
  let headerCols = null;
  INSERT_RE.lastIndex = 0;
  let match;
  while ((match = INSERT_RE.exec(input)) !== null) {
    const openAt = match.index + match[0].length - 1; // the '(' that ends the match
    if (unquoteIdent(match[1].split('.').pop()) !== only) { INSERT_RE.lastIndex = openAt + 1; continue; }
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
      headerCols = cols ? headers.join('\u0000') : null;
      rows.push(headers.map(csvField).join(','));
    } else if (cols && headerCols !== null && cols.items.map(unquoteIdent).join('\u0000') !== headerCols) {
      throw new Error(`The INSERT statements for ${only} list their columns in different orders or sets (${cols.items.map(unquoteIdent).join(', ')} vs ${headers.join(', ')}): the rows would not line up.`);
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
