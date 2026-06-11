'use client';
import { useState } from 'react';
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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Cron Expression</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Cron Expression is a free online tool that helps you create, validate, and understand cron syntax for scheduling automated tasks and jobs. Whether you're managing server maintenance, backups, or recurring processes, this tool simplifies complex cron scheduling with an intuitive interface and instant validation.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Cron Expression</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter your cron expression in the input field using the standard five-field format (minute, hour, day of month, month, day of week)</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Use the visual cron builder to select specific times, days, and frequencies instead of typing raw syntax if you prefer a guided approach</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the validate button to check your expression for errors and see if it's properly formatted according to cron standards</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Review the next run times displayed below to confirm your schedule executes when intended, then copy your validated expression for use in your system</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is a cron expression?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">A cron expression is a string of five fields separated by spaces that defines when a scheduled task should run. Each field represents minute, hour, day of month, month, and day of week, allowing precise scheduling of recurring jobs.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use this tool for any programming language?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, cron expressions are universal and work with Unix/Linux systems, cron daemon, task schedulers, and most programming frameworks that support cron syntax including Python, Node.js, Java, and PHP.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What do asterisks mean in cron expressions?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">An asterisk in a cron field means any value is allowed for that field. For example, an asterisk in the hour field means the task will run every hour.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How far in advance can I see upcoming run times?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool displays the next several upcoming execution times for your cron expression, typically showing the next 10-20 occurrences so you can verify your schedule is correct.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the */n syntax to create intervals, such as */5 in the minute field to run every 5 minutes, or */2 in the hour field to run every 2 hours</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Remember that cron uses 24-hour time format and day of week starts with 0 for Sunday through 6 for Saturday to avoid scheduling errors</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Combine multiple values with commas to specify exact times, like 0,6,12,18 in the hour field to run at midnight, 6 AM, noon, and 6 PM</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your cron expressions with this tool before deploying them to production to ensure they run at the intended times and avoid missed or duplicate executions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}