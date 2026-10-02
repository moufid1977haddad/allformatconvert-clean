'use client';
import { useState } from 'react';

// P24 (03/10): paste a whole expression, as crontab.guru reads it, instead of copying it field by field. Macros are
// expanded; a crontab line keeps its five schedule fields (the command is left out and said); a six- or seven-field
// expression (Quartz, Spring: seconds / year) is not split into the wrong boxes but explained.
const MACROS = { '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *', '@monthly': '0 0 1 * *', '@weekly': '0 0 * * 0', '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@hourly': '0 * * * *' };
// a Quartz field (digits, * ? L W #, day and month names), never a command such as /usr/bin/x or php
const FIELD = /^(?:[\d*?LW#]|SUN|MON|TUE|WED|THU|FRI|SAT|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:[\d*?LW#,/-]|SUN|MON|TUE|WED|THU|FRI|SAT|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)*$/i;

export function splitCron(text) {
  const t = text.trim();
  if (!t) return { fields: null, note: '' };
  if (t.startsWith('@')) {
    const m = MACROS[t.split(/\s+/)[0].toLowerCase()];
    if (m) return { fields: m.split(' '), note: `${t.split(/\s+/)[0]} means ${m}.` };
    return { fields: null, note: t.split(/\s+/)[0].toLowerCase() === '@reboot' ? '@reboot runs once at start-up: it has no schedule to show.' : 'Unknown macro: use @yearly, @monthly, @weekly, @daily, @midnight or @hourly.' };
  }
  const parts = t.split(/\s+/);
  if (parts.length < 5) return { fields: null, note: `A cron expression has 5 fields (minute hour day month weekday); this one has ${parts.length}.` };
  if (parts.length === 5) return { fields: parts, note: '' };
  if (parts.length <= 7 && parts.slice(5).every((p) => FIELD.test(p))) {
    return { fields: null, note: `This expression has ${parts.length} fields: seconds and/or year (Quartz, Spring, AWS). This tool reads the standard 5-field cron; drop the seconds field (first) and the year field (seventh) to read it here.` };
  }
  return { fields: parts.slice(0, 5), note: `The first 5 fields are the schedule; the rest (“${parts.slice(5).join(' ').slice(0, 60)}”) looks like the command of a crontab line and was left out.` };
}

export default function CronPaste({ onFields }) {
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const change = (v) => {
    setText(v);
    const { fields, note: n } = splitCron(v);
    setNote(n);
    if (fields) onFields(fields);
  };
  return (
    <div>
      <label htmlFor="cron-paste" className="block text-sm text-neutral-500 mb-1">Paste a whole expression</label>
      <input id="cron-paste" type="text" value={text} onChange={(e) => change(e.target.value)} spellCheck={false} autoComplete="off"
        placeholder="e.g. */15 9-17 * * 1-5  or  @daily" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono text-sm" />
      {note && <p className="text-xs text-neutral-600 mt-1" data-cron-note>{note}</p>}
    </div>
  );
}
