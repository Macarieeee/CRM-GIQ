import { CalendarClock, ExternalLink, Mail, Phone, StickyNote } from 'lucide-react';
import { formatDate, formatMoney, isPast, isToday } from '../utils/date.js';

export default function LeadCard({ lead, stage, stages, lang, t, onOpen, onStageChange, onDragStart }) {
  const followUpClass = isPast(lead.nextFollowUp)
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : isToday(lead.nextFollowUp)
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-50 text-slate-500 border-slate-200';

  return (
    <article
      draggable
      onDragStart={(event) => onDragStart(event, lead.id)}
      className="card-shadow rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300"
    >
      <button onClick={() => onOpen(lead)} className="block w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-2 text-base font-black text-slate-950">{lead.companyName || 'Untitled lead'}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{lead.contactName || '—'}</p>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-black ${stage?.color || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
            {stage?.[lang] || stage?.ro || stage?.en || stage?.name}
          </span>
        </div>

        <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-500">
          {lead.phone && <div className="flex items-center gap-2"><Phone size={15} /> {lead.phone}</div>}
          {lead.email && <div className="flex items-center gap-2"><Mail size={15} /> {lead.email}</div>}
          {lead.website && <div className="flex items-center gap-2"><ExternalLink size={15} /> {lead.website}</div>}
          {lead.notes && <div className="flex items-center gap-2"><StickyNote size={15} /> {lead.notes.slice(0, 74)}{lead.notes.length > 74 ? '...' : ''}</div>}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
            {formatMoney(lead.potentialValue || 0)}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${followUpClass}`}>
            <CalendarClock size={13} /> {formatDate(lead.nextFollowUp, lang === 'ro' ? 'ro-RO' : 'en-US')}
          </span>
        </div>
      </button>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <label className="label">{t.quickMove}</label>
        <select
          className="input py-2 text-sm"
          value={lead.stageId}
          onChange={(event) => onStageChange(lead.id, event.target.value)}
        >
          {stages.map((item) => (
            <option key={item.id} value={item.id}>{item[lang] || item.ro || item.en || item.name}</option>
          ))}
        </select>
      </div>
    </article>
  );
}
