// node --test scripts/sql-to-csv-tests/sql-to-csv.test.mjs  (29/09: a multi-row INSERT kept only its first row, silently)
import test from 'node:test';
import assert from 'node:assert/strict';
import { sqlInsertsToCsv } from '../../app/tools/developer-tools/sql-to-csv/sqlToCsv.js';

test('multi-row INSERT: every row is kept (was: first row only)', () => {
  assert.equal(sqlInsertsToCsv("INSERT INTO users (id, name) VALUES (1, 'Ann'), (2, 'Bob'), (3, 'Cy');"), 'id,name\n1,Ann\n2,Bob\n3,Cy');
});
test('mysqldump style: backticks, no spaces, several statements', () => {
  const sql = "INSERT INTO `users` (`id`,`name`) VALUES (1,'Ann'),(2,'O''Brien');\nINSERT INTO `users` (`id`,`name`) VALUES (3,'Smith, John');";
  assert.equal(sqlInsertsToCsv(sql), 'id,name\n1,Ann\n2,O\'Brien\n3,"Smith, John"');
});
test('double-quoted, bracketed and schema-qualified names; INSERT IGNORE', () => {
  assert.equal(sqlInsertsToCsv('INSERT INTO "public"."t" ("a","b") VALUES (1,2);'), 'a,b\n1,2');
  assert.equal(sqlInsertsToCsv('INSERT INTO [dbo].[t] ([a],[b]) VALUES (1,2);'), 'a,b\n1,2');
  assert.equal(sqlInsertsToCsv("INSERT IGNORE INTO t (a) VALUES ('x'),('y');"), 'a\nx\ny');
});
test('no column list: generic headers', () => {
  assert.equal(sqlInsertsToCsv("INSERT INTO t VALUES (1,'a'),(2,'b');"), 'column_1,column_2\n1,a\n2,b');
});
// P24 (03/10): SQL NULL is now an empty CSV field (convertcsv's default), no longer the word NULL
test('commas and parentheses inside quoted values; NULL is an empty field', () => {
  assert.equal(sqlInsertsToCsv("INSERT INTO t (a,b) VALUES ('Smith (Jr), II', NULL), ('x', 'y');"), 'a,b\n"Smith (Jr), II",\nx,y');
});
test('a separate tuple-looking text after the statement is not swallowed', () => {
  assert.equal(sqlInsertsToCsv("INSERT INTO t (a) VALUES (1);\nSELECT (2);"), 'a\n1');
});
test('no INSERT: clear error', () => {
  assert.throws(() => sqlInsertsToCsv('SELECT 1;'), /No INSERT statements found/);
});
test("MySQL \' escape keeps one value (was: split into wrong columns)", () => {
  assert.equal(sqlInsertsToCsv(String.raw`INSERT INTO t (a,b) VALUES ('O\'Brien, Pat', 2),('it\'s', 3);`), 'a,b\n"O\'Brien, Pat",2\nit\'s,3');
});
test("standard SQL: a backslash just before the closing quote stays literal ('C:\\')", () => {
  assert.equal(sqlInsertsToCsv(String.raw`INSERT INTO t (a,b) VALUES ('C:\', 2);`), 'a,b\nC:\\,2');
});
