'use client';
import { useState } from 'react';
export default function CronExpressionBuilderPage() {
  const [minute, setMinute] = useState('*');
  const [hour, setHour] = useState('*');
  const [day, setDay] = useState('*');
  const [month, setMonth] = useState('*');
  const [weekday, setWeekday] = useState('*');
  const cron = minute + ' ' + hour + ' ' + day + ' ' + month + ' ' + weekday;
  const presets = [['Every minute','* * * * *'],['Every hour','0 * * * *'],['Every day','0 0 * * *'],['Every week','0 0 * * 0'],['Every month','0 0 1 * *'],['Every year','0 0 1 1 *'],['Every weekday','0 9 * * 1-5'],['Every 15 min','*/15 * * * *']];
  const apply = (p) => { const parts = p.split(' '); setMinute(parts[0]); setHour(parts[1]); setDay(parts[2]); setMonth(parts[3]); setWeekday(parts[4]); };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Cron Expression Builder</h1>
        <p className="text-neutral-500 text-center mb-8">Build and validate cron expressions</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {[['Minute',minute,setMinute],['Hour',hour,setHour],['Day',day,setDay],['Month',month,setMonth],['Weekday',weekday,setWeekday]].map(([label,val,set]) => (
              <div key={label}><label className="block text-xs text-neutral-500 mb-1">{label}</label><input type="text" value={val} onChange={e => set(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 font-mono text-center text-sm" /></div>
            ))}
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="font-mono text-2xl text-indigo-400">{cron}</div></div>
          <button onClick={() => navigator.clipboard.writeText(cron)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
          <div><label className="block text-sm text-neutral-500 mb-2">Presets</label><div className="grid grid-cols-2 gap-2">{presets.map(([label,p]) => <button key={label} onClick={() => apply(p)} className="bg-neutral-800 hover:bg-neutral-100 rounded-lg p-2 text-left transition"><div className="text-sm font-semibold">{label}</div><div className="text-neutral-500 font-mono text-xs">{p}</div></button>)}</div></div>
        </div>
      </div>
    </div>

      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Cron Expression Builder</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Cron Expression Builder tool. No signup required, no watermark, works on all devices.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Why use OnlineConverTools?</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>100% free — no hidden fees</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No signup or account required</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Files processed locally — your data stays private</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Works on all devices — desktop, tablet, mobile</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No watermarks added to your files</li>
          </ul>
        </div>
      </div>
  );
}