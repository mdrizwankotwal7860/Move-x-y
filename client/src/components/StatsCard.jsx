import React from 'react';

export default function StatsCard({ title, value, icon, description, colorClass = 'text-teal-400' }) {
  return (
    <div className="glass p-6 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between hover:scale-[1.01] transition-transform duration-200">
      <div className="space-y-2">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{title}</span>
        <span className="text-3xl font-black text-slate-100 block">{value}</span>
        {description && <span className="text-[11px] text-slate-500 font-medium block">{description}</span>}
      </div>
      <div className={`p-4 rounded-xl bg-slate-900 border border-white/5 ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}
