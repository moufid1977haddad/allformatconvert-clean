'use client';
import { adsEnabled } from '../lib/ads';

// "Privacy choices": reopens Google's consent message so a visitor can change or withdraw consent at any time (required
// with a consent platform in the EEA/UK/CH). googlefc is Google's consent API, loaded with the AdSense script; the
// callback queue waits for it if the link is clicked before it is ready. Rendered only while ads are on.
export default function PrivacyChoicesLink({ className }) {
  if (!adsEnabled()) return null;
  const open = () => {
    window.googlefc = window.googlefc || {};
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
    window.googlefc.callbackQueue.push(() => window.googlefc.showRevocationMessage());
  };
  return <li><button type="button" onClick={open} className={className}>Privacy choices</button></li>;
}
