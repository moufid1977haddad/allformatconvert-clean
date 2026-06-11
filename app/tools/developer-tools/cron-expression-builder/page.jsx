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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Cron Expression Builder</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Cron Expression Builder is a free online tool that helps developers and system administrators create and validate cron expressions without memorizing complex syntax. Whether you're scheduling tasks, automating jobs, or setting up recurring events, this intuitive builder simplifies the process with an easy-to-use interface.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Cron Expression Builder</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Select your desired frequency from the dropdown menu (every minute, hourly, daily, weekly, monthly, or custom)</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose the specific time, day, or interval you want your task to run using the interactive calendar and time pickers</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the generated cron expression that appears in real-time as you make selections</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the cron expression to your clipboard and paste it into your application, server, or scheduling system</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is a cron expression?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">A cron expression is a special syntax used in Unix-like operating systems to schedule tasks at specific times. It consists of five or six fields representing minute, hour, day, month, day of week, and optionally seconds.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Cron Expression Builder free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Cron Expression Builder is completely free and requires no registration or account creation. You can use it as many times as you need without any limitations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I validate an existing cron expression?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can paste your existing cron expression into the tool, and it will break down each field and show you exactly when your task will run in plain English.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What operating systems support cron expressions?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Cron expressions are supported by Linux, macOS, Unix, and many other Unix-like systems. They're also widely used in scheduling libraries across programming languages like Python, Java, Node.js, and PHP.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the 'Every' option for simple recurring tasks like daily backups or hourly reports to avoid manual expression writing</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Take advantage of the preview feature that shows your next 10 scheduled run times to verify the expression works as intended</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Learn cron field syntax gradually by observing how the builder constructs expressions based on your selections</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this tool for future use and share it with team members to ensure consistent scheduling across your projects</li>
          </ul>
        </div>
      </div>
    </div>
  );
}