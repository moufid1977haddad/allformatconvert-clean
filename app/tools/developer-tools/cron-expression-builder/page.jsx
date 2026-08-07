'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
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
      <SeoContent
        title="Cron Expression Builder"
        description="Cron Expression Builder assembles a 5-field cron string (minute, hour, day, month, weekday) live as you fill in five text boxes, with eight presets that go beyond the basics to include a weekday-only schedule and a 15-minute interval. It runs entirely client-side with no syntax checking, next-run preview, or calendar/time pickers — the value in each field is joined directly into the final expression, so double-check it against your scheduler's syntax."
        howTo={[
          "Type values into the Minute, Hour, Day, Month, and Weekday fields, or click a preset below to fill them in automatically.",
          "Watch the generated cron expression update live as you type.",
          "Click 'Copy' to copy the expression to your clipboard.",
          "Paste it into your application, server, or scheduling system."
        ]}
        faqs={[
          { q: "What is a cron expression?", a: "A string of five space-separated fields — minute, hour, day of month, month, and day of week — that defines when a scheduled task should run." },
          { q: "Is Cron Expression Builder free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I paste an existing cron expression to validate it?", a: "You can paste text into any single field, but it won't be split across the five boxes or checked for correctness — only clicking a preset fills in all five fields at once. There's no plain-English breakdown of an expression." },
          { q: "What operating systems support cron expressions?", a: "Cron expressions are used by Linux, macOS, Unix, and many scheduling libraries across languages like Python, Java, Node.js, and PHP." }
        ]}
        tips={[
          "The eight presets (including 'Every weekday' and 'Every 15 min') fill in all five fields at once — a fast starting point you can then tweak.",
          "Cron fields are minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-6, Sunday=0).",
          "Since there's no validation, test your expression in your actual scheduler or a dedicated cron-syntax checker before relying on it in production.",
          "Use ranges like 1-5 (e.g. in the weekday field for Monday-Friday) or intervals like */15 for recurring schedules."
        ]}
      />
    </div>
  );
}