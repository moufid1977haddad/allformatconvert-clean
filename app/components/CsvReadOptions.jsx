'use client';
import { CSV_ENCODINGS, encodingLabel } from '../lib/csvEncoding';

// Shared by the CSV-reading tools (csv-to-json, csv-to-excel, csv-to-sql, csv-to-tsv):
// the file's character encoding (auto-detected, as ConvertCSV and TableConvert do,
// with an override) and whether whole columns of numbers become numbers.
export default function CsvReadOptions({ showEncoding, encodingChoice, detectedEncoding, onEncoding, numbers, onNumbers, numbersLabel = 'Numbers as numbers' }) {
  const sel = 'bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg px-3 py-1.5 text-neutral-800 dark:text-neutral-200';
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
      {showEncoding && (
        <span className="flex items-center gap-2">
          <label htmlFor="csv-encoding" className="text-neutral-500 dark:text-neutral-400">Encoding:</label>
          <select id="csv-encoding" value={encodingChoice} onChange={(e) => onEncoding(e.target.value)} className={sel}>
            <option value="auto">Auto-detected: {encodingLabel(detectedEncoding)}</option>
            {CSV_ENCODINGS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </span>
      )}
      {onNumbers && (
        <label className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 cursor-pointer">
          <input id="csv-numbers" type="checkbox" checked={numbers} onChange={(e) => onNumbers(e.target.checked)} />
          {numbersLabel}
        </label>
      )}
    </div>
  );
}

// One sentence for the result line: what was read as numbers, and with which decimal separator.
export function numbersNote(msg) {
  if (!msg || !msg.numericCount) return '';
  return ` ${msg.numericCount} column${msg.numericCount > 1 ? 's' : ''} read as numbers${msg.decimalSep === ',' ? ' (decimal comma: 12,5 → 12.5)' : ''}.`;
}
