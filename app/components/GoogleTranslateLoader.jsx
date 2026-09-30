'use client';
import { useEffect } from 'react';
import { loadGoogleTranslate, translationActive } from '../lib/googleTranslate';

// Loads Google Translate at page load ONLY when the visitor already chose a language (googtrans cookie), so the
// element re-applies it on this page as it always did; otherwise the Navbar loads it when the language menu is used.
export default function GoogleTranslateLoader() {
  useEffect(() => {
    if (translationActive()) loadGoogleTranslate();
  }, []);
  return null;
}
