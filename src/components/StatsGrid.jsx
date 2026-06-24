import { CalendarClock, CheckCircle2, CircleDollarSign, ClipboardList, PhoneCall, Send, TrendingDown, Users } from 'lucide-react';
import { formatMoney } from '../utils/date.js';

const iconMap = {
  total: Users,
  newLeads: ClipboardList,
  calls: PhoneCall,
  proposals: Send,
  won: CheckCircle2,
  lost: TrendingDown,
  totalValue: CircleDollarSign,
  followUpsToday: CalendarClock,
};

export default function StatsGrid({ t, stats }) {
  const cards = [
    ['total', t.totalLeads, stats.total],
    ['newLeads', t.newLeads, stats.newLeads],
    ['calls', t.calls, stats.calls],
    ['proposals', t.proposals, stats.proposals],
    ['won', t.won, stats.won],
    ['lost', t.lost, stats.lost],
    ['totalValue', t.totalValue, formatMoney(stats.totalValue)],
    ['followUpsToday', t.followUpsToday, stats.followUpsToday],
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([key, label, value]) => {
        const Icon = iconMap[key];
        return (
          <div key={key} className="glass-panel rounded-3xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Icon size={20} />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
