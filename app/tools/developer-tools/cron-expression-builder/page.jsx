'use client';
import { useState, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import CronPaste from '../../../components/CronPaste';
export default function CronExpressionBuilderPage() {
  const [minute, setMinute] = useState('*');
  const [hour, setHour] = useState('*');
  const [day, setDay] = useState('*');
  const [month, setMonth] = useState('*');
  const [weekday, setWeekday] = useState('*');
  // Next runs depend on the current time: computed after mount only, so the
  // server-rendered HTML and the first client render match.
  // The cron engine (cron-parser + cronstrue, the heaviest code of the page) loads right after the first paint, and the
  // "next runs" box keeps its height meanwhile, so nothing below it jumps (Lighthouse CLS 0.1-0.22 and TBT ≈ 1.1 s
  // on a phone before, 30/09/2026).
  const [now, setNow] = useState(null);
  const [cronInfo, setCronInfo] = useState(null);
  useEffect(() => { setNow(new Date()); import('../../../lib/cronInfo').then((m) => setCronInfo(() => m.cronInfo)); }, []);
  const cron = minute + ' ' + hour + ' ' + day + ' ' + month + ' ' + weekday;
  const presets = [['Every minute','* * * * *'],['Every hour','0 * * * *'],['Every day','0 0 * * *'],['Every week','0 0 * * 0'],['Every month','0 0 1 * *'],['Every year','0 0 1 1 *'],['Every weekday','0 9 * * 1-5'],['Every 15 min','*/15 * * * *']];
  const apply = (p) => { const parts = p.split(' '); setMinute(parts[0]); setHour(parts[1]); setDay(parts[2]); setMonth(parts[3]); setWeekday(parts[4]); };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Cron Expression Builder</h1>
        <p className="text-neutral-500 text-center mb-8">Build a cron schedule from presets, field by field</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <CronPaste onFields={(f) => apply(f.join(' '))} />
          <div className="grid grid-cols-5 gap-2">
            {[['Minute',minute,setMinute],['Hour',hour,setHour],['Day',day,setDay],['Month',month,setMonth],['Weekday',weekday,setWeekday]].map(([label,val,set]) => (
              <div key={label}><label className="block text-xs text-neutral-500 mb-1">{label}</label><input aria-label={label} type="text" value={val} onChange={e => set(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 font-mono text-center text-sm" /></div>
            ))}
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="font-mono text-2xl text-indigo-400">{cron}</div></div>
          <div className="min-h-[13rem]">
          {now && cronInfo && (() => { const info = cronInfo(cron, { from: now }); return info.ok ? (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-sm space-y-2">
              <div className="text-neutral-800 font-semibold">{info.description}</div>
              <div className="text-neutral-500">Next runs (your time zone):</div>
              <ul className="font-mono text-neutral-700">{info.next.map(d => <li key={d.getTime()}>{d.toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</li>)}</ul>
            </div>
          ) : <p className="text-red-500 text-sm text-center">{info.error}</p>; })()}
          </div>
          <button onClick={() => navigator.clipboard.writeText(cron)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
          <div><label className="block text-sm text-neutral-500 mb-2">Presets</label><div className="grid grid-cols-2 gap-2">{presets.map(([label,p]) => <button key={label} onClick={() => apply(p)} className="bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800 rounded-lg p-2 text-left transition"><div className="text-sm font-semibold">{label}</div><div className="font-mono text-xs opacity-80">{p}</div></button>)}</div></div>
        </div>
      </div>
      <SeoContent
        title="Cron Expression Builder"
        description={"Cron Expression Builder helps you write a new five-field cron schedule. Start from one of eight presets (every minute, hour, day, week, month or year, every weekday at 09:00, every 15 min) and adjust the Minute, Hour, Day, Month and Weekday boxes. Each keystroke is checked: the schedule is described in plain English and its next five run times are listed in your time zone, or the wrong value is reported with its allowed range. Ranges (1-5), lists (1,15), steps (*/15) and names such as MON or JAN are understood. An expression you already have can be pasted as a starting point. The page Cron Expression offers the same checker with six presets."}
        example={{
          caption: "The Every weekday preset, with the next runs computed as if it were clicked on Tuesday 6 October 2026 at 12:00 UTC; run times listed for a visitor in UTC whose browser is set to US English (the page uses your zone and language).",
          inputLabel: "Preset clicked",
          input: "Every weekday",
          outputLabel: "Expression and check",
          output: "0 9 * * 1-5\nAt 09:00, Monday through Friday\nNext runs (your time zone):\nWed, Oct 7, 2026, 09:00 AM\nThu, Oct 8, 2026, 09:00 AM\nFri, Oct 9, 2026, 09:00 AM\nMon, Oct 12, 2026, 09:00 AM\nTue, Oct 13, 2026, 09:00 AM",
        }}
        howToTitle={"How to build a cron expression"}
        howTo={[
          "Under \"Presets\", click the schedule closest to yours, for example \"Every weekday\" or \"Every 15 min\".",
          "Edit the boxes that differ: \"Minute\" 0-59, \"Hour\" 0-23, \"Day\" 1-31, \"Month\" 1-12, \"Weekday\" 0-6 with 0 for Sunday.",
          "Watch the line under the expression: the description and the next runs change with every edit.",
          "When the runs match what you want, click \"Copy\" and paste the expression into your crontab or scheduler.",
        ]}
        specs={[
          { label: "Presets", value: "Every minute, Every hour, Every day, Every week, Every month, Every year, Every weekday (0 9 * * 1-5), Every 15 min (*/15 * * * *)" },
          { label: "Field syntax", value: "Numbers, ranges (1-5), lists (1,15), steps (*/15) and names such as MON or JAN" },
          { label: "Check", value: "After every edit; an out-of-range value is reported with the allowed range" },
          { label: "Next runs listed", value: "Five, in your browser’s time zone" },
          { label: "Output", value: "One line in the order minute hour day month weekday, copied with the Copy button" },
        ]}
        privacyTitle={"Where your schedule is built"}
        privacy={"Building and checking happen in your browser: the cron-parser and cronstrue libraries load into the page after it opens, and the expression you build is never sent to our servers. Next runs are computed from your device’s clock. The boxes are not saved, so a reload brings back five asterisks."}
        faqs={[
          { q: "Is there a preset for every 15 minutes?", a: "Yes. \"Every 15 min\" fills in */15 * * * *, which runs at minutes 0, 15, 30 and 45 of every hour. Change 15 to 5 or 10 in the \"Minute\" box for other intervals; the next runs list shows the effect at once." },
          { q: "Can I run a job only on weekdays?", a: "Yes. Put 1-5 in the \"Weekday\" box (1 is Monday, 5 is Friday), or click the \"Every weekday\" preset, which also sets the time to 09:00. Use 0,6 instead to run on Saturday and Sunday only." },
          { q: "Will 0 0 31 * * run every month?", a: "No. It runs only in months that have a 31st day, so February, April, June, September and November are skipped; from October 2026, for example, the five runs listed go from 31 October to 31 December. The \"Every month\" preset, 0 0 1 * *, runs on the first day of every month instead." },
        ]}
        tips={[
          "Already have an expression to adapt? Paste it into \"Paste a whole expression\" and edit the boxes from there.",
        ]}
      />
    </div>
  );
}