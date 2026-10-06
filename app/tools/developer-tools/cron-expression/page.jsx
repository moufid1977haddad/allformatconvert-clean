'use client';
import { useState, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import CronPaste from '../../../components/CronPaste';
export default function CronExpressionPage() {
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
  const cron = `${minute} ${hour} ${day} ${month} ${weekday}`;
  const presets = [['Every minute','* * * * *'],['Every hour','0 * * * *'],['Every day at midnight','0 0 * * *'],['Every week','0 0 * * 0'],['Every month','0 0 1 * *'],['Every year','0 0 1 1 *']];
  const applyPreset = (p) => { const parts = p.split(' '); setMinute(parts[0]); setHour(parts[1]); setDay(parts[2]); setMonth(parts[3]); setWeekday(parts[4]); };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Cron Expression</h1>
        <p className="text-neutral-500 text-center mb-8">Paste a cron expression and read it in plain English</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <CronPaste onFields={(f) => applyPreset(f.join(' '))} />
          <div className="grid grid-cols-5 gap-2">
            {[['Minute',minute,setMinute],['Hour',hour,setHour],['Day',day,setDay],['Month',month,setMonth],['Weekday',weekday,setWeekday]].map(([label,val,set]) => <div key={label}><label className="block text-xs text-neutral-500 mb-1">{label}</label><input aria-label={label} type="text" value={val} onChange={e => set(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 font-mono text-center" /></div>)}
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
          <div><label className="block text-sm text-neutral-500 mb-2">Presets</label><div className="grid grid-cols-2 gap-2">{presets.map(([label,p]) => <button key={label} onClick={() => applyPreset(p)} className="bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800 rounded-lg p-2 text-sm text-left transition"><div className="font-semibold">{label}</div><div className="font-mono text-xs opacity-80">{p}</div></button>)}</div></div>
        </div>
      </div>
      <SeoContent
        title="Cron Expression"
        description={"Cron Expression reads a standard five-field cron schedule (minute, hour, day of month, month, day of week) and tells you what it means. Paste a whole expression, a macro such as @daily or a complete crontab line: the schedule is split into the five boxes, a command after the five fields is left out, and the result is described in plain English with the next five run times in your time zone. A value out of range, such as 99 in the minute field, is reported instead of described. Quartz or Spring expressions with six or seven fields are explained, not read. Six presets fill in schedules from every minute to once a year."}
        example={{
          caption: "A crontab line, with the next runs computed as if it were pasted on 6 October 2026 at 12:00 UTC; they are listed for a visitor in UTC whose browser is set to US English (the page uses your zone and language).",
          inputLabel: "Pasted in \"Paste a whole expression\"",
          input: "30 2 * * 1 /usr/local/bin/backup.sh",
          outputLabel: "What the page shows",
          output: "Boxes: 30 2 * * 1\nNote: The first 5 fields are the schedule; the rest (“/usr/local/bin/backup.sh”) looks like the command of a crontab line and was left out.\nAt 02:30, only on Monday\nNext runs (your time zone):\nMon, Oct 12, 2026, 02:30 AM\nMon, Oct 19, 2026, 02:30 AM\nMon, Oct 26, 2026, 02:30 AM\nMon, Nov 2, 2026, 02:30 AM\nMon, Nov 9, 2026, 02:30 AM",
        }}
        howToTitle={"How to read a cron expression in plain English"}
        howTo={[
          "Paste your expression, a macro such as @hourly, or a line copied from your crontab into \"Paste a whole expression\".",
          "Check the five boxes (\"Minute\", \"Hour\", \"Day\", \"Month\", \"Weekday\"): they now hold the schedule, and each can be edited.",
          "Read the plain-English line and the list under \"Next runs (your time zone):\"; a red message gives the wrong value and the range it should be in.",
          "Click \"Copy\" to put the five-field expression on your clipboard.",
        ]}
        specs={[
          { label: "Format read", value: "Standard cron with five fields: minute, hour, day of month, month, day of week" },
          { label: "Macros", value: "@yearly, @annually, @monthly, @weekly, @daily, @midnight, @hourly (@reboot has no schedule to show)" },
          { label: "Not read", value: "Six- or seven-field Quartz and Spring expressions (seconds first): a note explains how to shorten them; for AWS expressions, whose sixth field is the year, delete that year field and lower a numeric day of week by one (AWS counts 1 as Sunday) or write it as a name such as MON" },
          { label: "Next runs", value: "Five, computed from your device’s clock in its time zone" },
          { label: "Presets", value: "Every minute, Every hour, Every day at midnight, Every week, Every month, Every year" },
        ]}
        privacyTitle={"Where your schedule is processed"}
        privacy={"The expression is checked and described in your browser by the cron-parser and cronstrue libraries, which load just after the page appears. The schedule and the command of a pasted crontab line are never sent to our servers. The next run times use your device’s clock and time zone, and nothing is saved, so copy the expression before you leave."}
        faqs={[
          { q: "Can I paste a line straight from my crontab?", a: "Yes. The first five fields are kept as the schedule and the rest, such as /usr/local/bin/backup.sh, is treated as the command: it is left out and a note under the box says so. A line that starts with a macro such as @daily is expanded and its command dropped; the note then gives only the meaning of the macro." },
          { q: "Does it read Quartz or Spring expressions with seconds?", a: "No. An expression with six or seven fields whose extra fields look like Quartz values is not split into the boxes. The note asks you to drop the seconds field (the first) and the year field (the seventh) to read the rest as standard cron." },
          { q: "Are the next runs shown in UTC?", a: "No. They are computed from your browser’s clock and shown in your local time zone. A server set to UTC runs the same expression at UTC times, so shift the hours if your server’s zone differs from yours." },
          { q: "Does it catch values that are out of range?", a: "Yes. A value outside a field’s range, such as 99 in the minute field, replaces the description with a red message giving the parser’s reason, here the expected range 0-59." },
        ]}
        tips={[
          "Writing a new schedule rather than reading one? Cron Expression Builder adds presets for weekdays at 09:00 and for a 15-minute interval.",
        ]}
      />
    </div>
  );
}