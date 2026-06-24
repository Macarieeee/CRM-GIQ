import { CalendarClock } from 'lucide-react';
import { formatDate, isPast, isThisWeek, isToday } from '../utils/date.js';

export default function FollowUpsPanel({ t, lang, leads, onOpenLead }) {
  const items = leads
    .filter((lead) => lead.nextFollowUp && (isPast(lead.nextFollowUp) || isToday(lead.nextFollowUp) || isThisWeek(lead.nextFollowUp)))
    .sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp))
    .slice(0, 8);

  function labelFor(date) {
    if (isPast(date)) return t.late;
    if (isToday(date)) return t.today;
    return t.thisWeek;
  }

  return (
    <aside className="glass-panel rounded-3xl p-4 xl:sticky xl:top-28 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">{t.followUps}</h2>
          <p className="text-sm font-bold text-slate-400">{t.overdue}: {leads.filter((lead) => isPast(lead.nextFollowUp)).length}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><CalendarClock size={20} /></div>
      </div>

      <div className="grid gap-3">
        {items.length ? items.map((lead) => (
          <button key={lead.id} onClick={() => onOpenLead(lead)} className="rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-950">{lead.companyName}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{lead.contactName || lead.phone || lead.email || '—'}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${isPast(lead.nextFollowUp) ? 'bg-rose-100 text-rose-700' : isToday(lead.nextFollowUp) ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{labelFor(lead.nextFollowUp)}</span>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-500">{formatDate(lead.nextFollowUp, lang === 'ro' ? 'ro-RO' : 'en-US')}</p>
          </button>
        )) : <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-5 text-center text-sm font-bold text-slate-400">{t.noFollowUps}</div>}
      </div>
    </aside>
  );
}
