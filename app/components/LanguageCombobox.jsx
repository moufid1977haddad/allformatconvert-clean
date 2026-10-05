'use client';
import { useEffect, useId, useRef, useState } from 'react';

// P33 (05/10): ONE control to choose the OCR language(s), with the search inside it (owner's brief: before, a "Search
// languages…" box above a separate list). WAI-ARIA 1.2 combobox with a listbox popup (an <input role="combobox">,
// aria-expanded / aria-controls / aria-activedescendant; options role="option" aria-selected), usable with a finger on
// an iPhone (rows and chips at least 44 px high, the list opens on tap, a tap toggles) and with a keyboard (↑ ↓ move,
// Enter toggles, Escape closes, Backspace in the empty field removes the last language).
// Several languages, up to `max`, in the same control (iLovePDF asks for "the main languages" of the PDF; Smallpdf and
// Adobe for one): chosen languages show as chips inside the field, each with its own remove button.
//
//   <LanguageCombobox options={[{code, label}]} value={['eng']} onChange={(codes) => …} search={(q) => options}
//                     optionLabel={(o) => text} max={3} disabled={false} label="Language" />
export default function LanguageCombobox({ options, value, onChange, search, optionLabel = (o) => o.label, max = 3, disabled = false, label = 'Language' }) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState('');
  const inputRef = useRef(null);
  const boxRef = useRef(null);
  const listRef = useRef(null);
  const shown = search(query);
  const byCode = Object.fromEntries(options.map((o) => [o.code, o]));

  // a tap or click outside closes the list (and keeps what was chosen)
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) { setOpen(false); setQuery(''); } };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  // the active option stays visible while moving with the keyboard
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${active}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const toggle = (code) => {
    setNotice('');
    if (value.includes(code)) { onChange(value.filter((c) => c !== code)); return; }
    if (value.length >= max) { setNotice(`Up to ${max} languages. Remove one to add ${byCode[code]?.label || code}.`); return; }
    onChange([...value, code]);
    setQuery('');
    setActive(0);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) setOpen(true); else setActive((a) => Math.min(a + 1, shown.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { if (open && shown[active]) { e.preventDefault(); toggle(shown[active].code); } }
    else if (e.key === 'Escape') { if (open) { e.preventDefault(); setOpen(false); setQuery(''); } }
    else if (e.key === 'Backspace' && !query && value.length) { onChange(value.slice(0, -1)); }
  };

  return (
    <div ref={boxRef} className="relative" data-language-combobox>
      <label htmlFor={`${id}-input`} className="block text-sm text-neutral-500 mb-1">{label}{max > 1 ? ` (up to ${max})` : ''}</label>
      <div className={`flex flex-wrap items-center gap-1.5 w-full bg-neutral-50 border rounded-lg px-2 py-1.5 text-sm ${open ? 'border-indigo-400' : 'border-neutral-200'} ${disabled ? 'opacity-60' : ''}`} onClick={() => { if (!disabled) { setOpen(true); inputRef.current?.focus(); } }}>
        {value.map((code) => (
          <span key={code} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full pl-3 min-h-[44px] sm:min-h-[32px]" data-language-chip={code}>
            {byCode[code]?.label || code}
            <button type="button" disabled={disabled} onClick={(e) => { e.stopPropagation(); toggle(code); inputRef.current?.focus(); }} aria-label={`Remove ${byCode[code]?.label || code}`} className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] rounded-full text-indigo-700 hover:bg-indigo-100">×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${id}-opt-${shown[active].code}` : undefined}
          aria-describedby={`${id}-help`}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="done"
          disabled={disabled}
          value={query}
          placeholder={value.length ? 'Add a language…' : 'Search languages…'}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={onKeyDown}
          className="flex-1 min-w-[8rem] min-h-[44px] bg-transparent px-2 focus:outline-none"
        />
      </div>
      <p id={`${id}-help`} className="sr-only">Type to search by English or native name or code; choose up to {max} languages.</p>
      <p aria-live="polite" className="text-xs text-amber-700 mt-1 min-h-[1rem]" data-language-notice>{notice}</p>
      {open && !disabled && (
        <ul ref={listRef} id={listId} role="listbox" aria-multiselectable={max > 1} aria-label={label} className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg text-sm">
          {shown.length ? shown.map((o, i) => {
            const selected = value.includes(o.code);
            return (
              <li
                key={o.code}
                id={`${id}-opt-${o.code}`}
                role="option"
                aria-selected={selected}
                data-index={i}
                data-code={o.code}
                onPointerDown={(e) => e.preventDefault() /* keeps the field focused (and the iPhone keyboard up) */}
                onClick={() => toggle(o.code)}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center gap-2 px-3 min-h-[44px] cursor-pointer ${i === active ? 'bg-indigo-50' : ''} ${selected ? 'font-semibold text-indigo-800' : 'text-neutral-800'}`}
              >
                <span aria-hidden="true" className="w-4 text-indigo-600">{selected ? '✓' : ''}</span>
                {optionLabel(o)}
              </li>
            );
          }) : <li role="option" aria-selected={false} aria-disabled="true" className="px-3 min-h-[44px] flex items-center text-neutral-500">No language matches — try the English name</li>}
        </ul>
      )}
    </div>
  );
}

// The browser's languages (navigator.languages, BCP 47) → the first one PDF OCR offers, as a Tesseract code.
const FROM_BCP47 = {
  af: 'afr', sq: 'sqi', am: 'amh', ar: 'ara', as: 'asm', az: 'aze', eu: 'eus', be: 'bel', bn: 'ben', bs: 'bos', bg: 'bul',
  my: 'mya', ca: 'cat', ceb: 'ceb', km: 'khm', chr: 'chr', hr: 'hrv', cs: 'ces', da: 'dan', nl: 'nld', dz: 'dzo',
  en: 'eng', eo: 'epo', et: 'est', fi: 'fin', fr: 'fra', gl: 'glg', ka: 'kat', de: 'deu', el: 'ell', gu: 'guj', ht: 'hat',
  he: 'heb', iw: 'heb', hi: 'hin', hu: 'hun', is: 'isl', id: 'ind', in: 'ind', iu: 'iku', ga: 'gle', it: 'ita', ja: 'jpn',
  jv: 'jav', kn: 'kan', kk: 'kaz', ky: 'kir', ko: 'kor', ku: 'kmr', kmr: 'kmr', lo: 'lao', la: 'lat', lv: 'lav', lt: 'lit',
  mk: 'mkd', ms: 'msa', ml: 'mal', mt: 'mlt', mr: 'mar', ne: 'nep', no: 'nor', nb: 'nor', nn: 'nor', or: 'ori',
  pa: 'pan', fa: 'fas', pl: 'pol', pt: 'por', ps: 'pus', ro: 'ron', mo: 'ron', ru: 'rus', sa: 'san', sr: 'srp', si: 'sin',
  sk: 'slk', sl: 'slv', es: 'spa', sw: 'swa', sv: 'swe', syr: 'syr', fil: 'fil', tl: 'fil', tg: 'tgk', ta: 'tam',
  te: 'tel', th: 'tha', bo: 'bod', ti: 'tir', tr: 'tur', ug: 'uig', uk: 'ukr', ur: 'urd', uz: 'uzb', vi: 'vie',
  cy: 'cym', yi: 'yid',
};

/** @param {readonly string[]} langs  navigator.languages  @param {Set<string>} offered  codes PDF OCR offers */
export function languageFromBrowser(langs, offered) {
  for (const raw of langs || []) {
    const tag = String(raw || '').toLowerCase();
    const [base] = tag.split('-');
    let code = FROM_BCP47[base];
    if (base === 'zh') code = /hant|-tw|-hk|-mo/.test(tag) ? 'chi_tra' : 'chi_sim';
    if (base === 'sr' && /latn/.test(tag)) code = 'srp_latn';
    if (base === 'az' && /cyrl/.test(tag)) code = 'aze_cyrl';
    if (base === 'uz' && /cyrl/.test(tag)) code = 'uzb_cyrl';
    if (code && offered.has(code)) return code;
  }
  return null;
}
