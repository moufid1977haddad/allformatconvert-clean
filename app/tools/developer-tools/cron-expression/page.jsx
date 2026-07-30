'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function CronExpressionPage() {
  const [minute, setMinute] = useState('*');
  const [hour, setHour] = useState('*');
  const [day, setDay] = useState('*');
  const [month, setMonth] = useState('*');
  const [weekday, setWeekday] = useState('*');
  const cron = `${minute} ${hour} ${day} ${month} ${weekday}`;
  const presets = [['Every minute','* * * * *'],['Every hour','0 * * * *'],['Every day at midnight','0 0 * * *'],['Every week','0 0 * * 0'],['Every month','0 0 1 * *'],['Every year','0 0 1 1 *']];
  const applyPreset = (p) => { const parts = p.split(' '); setMinute(parts[0]); setHour(parts[1]); setDay(parts[2]); setMonth(parts[3]); setWeekday(parts[4]); };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Cron Expression Builder</h1>
        <p className="text-neutral-500 text-center mb-8">Build and validate cron expressions</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {[['Minute',minute,setMinute],['Hour',hour,setHour],['Day',day,setDay],['Month',month,setMonth],['Weekday',weekday,setWeekday]].map(([label,val,set]) => <div key={label}><label className="block text-xs text-neutral-500 mb-1">{label}</label><input type="text" value={val} onChange={e => set(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 font-mono text-center" /></div>)}
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="font-mono text-2xl text-indigo-400">{cron}</div></div>
          <button onClick={() => navigator.clipboard.writeText(cron)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
          <div><label className="block text-sm text-neutral-500 mb-2">Presets</label><div className="grid grid-cols-2 gap-2">{presets.map(([label,p]) => <button key={label} onClick={() => applyPreset(p)} className="bg-neutral-800 hover:bg-neutral-100 rounded-lg p-2 text-sm text-left transition"><div className="font-semibold">{label}</div><div className="text-neutral-500 font-mono text-xs">{p}</div></button>)}</div></div>
        </div>
      </div>
      <SeoContent
        title="Cron Expression"
        description="Cron Expression lets you build a 5-field cron expression (minute, hour, day, month, weekday) by typing directly into five text boxes, or by clicking one of six presets, entirely in your browser. There's no syntax validation, no next-run-time preview, and no visual calendar or dropdown pickers — whatever you type in each field is joined as-is into the final expression."
        howTo={[
          "Type values into the Minute, Hour, Day, Month, and Weekday fields, or click a preset below to fill them in automatically.",
          "Watch the generated cron expression update live as you type.",
          "Click 'Copy' to copy the expression to your clipboard.",
          "Paste it into your cron job, task scheduler, or scheduling library."
        ]}
        faqs={[
          { q: "What is a cron expression?", a: "A string of five space-separated fields — minute, hour, day of month, month, and day of week — that defines when a scheduled task should run." },
          { q: "Is Cron Expression free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it validate my expression or show upcoming run times?", a: "No — there's no syntax checking or 'next run' preview. Whatever you type in each field is joined directly into the output, so double-check the syntax yourself." },
          { q: "Can I paste an existing cron expression to see what it means in plain English?", a: "No, there's no parser that decodes an expression back into a description — you can only build one field by field, or use a preset." }
        ]}
        tips={[
          "Presets fill in all five fields at once for common schedules like 'every hour' or 'every month' — a fast starting point you can then tweak.",
          "Cron fields are minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-6, Sunday=0).",
          "Since there's no validation, test your expression in your actual scheduler or a dedicated cron-syntax checker before relying on it in production.",
          "Use */n syntax (e.g. */5 in the minute field) for interval-based schedules like 'every 5 minutes.'"
        ]}
      />
    </div>
  );
}