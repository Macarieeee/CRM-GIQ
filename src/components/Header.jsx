import { BarChart3, Database, Globe2, Plus, ShieldCheck } from 'lucide-react';

export default function Header({ t, language, setLanguage, onAddLead, onOpenPipeline, onReset, onSignOut }) {
  return (
    <header className="glass-panel sticky top-0 z-30 border-x-0 border-t-0">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-300">
            <BarChart3 size={24} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{t.appName}</h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <Database size={13} /> {t.localBadge}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                <ShieldCheck size={13} /> {t.supabaseReady}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={() => setLanguage(language === 'ro' ? 'en' : 'ro')}>
            <Globe2 size={17} /> {language === 'ro' ? 'RO' : 'EN'}
          </button>
          <button className="btn-secondary" onClick={onOpenPipeline}>{t.pipelines}</button>
          <button className="btn-secondary" onClick={onReset}>{t.resetDemo}</button>
          <button className="btn-secondary" onClick={onSignOut}>Logout</button>
          <button className="btn-primary flex items-center gap-2" onClick={onAddLead}>
            <Plus size={18} /> {t.addLead}
          </button>
        </div>
      </div>
    </header>
  );
}
