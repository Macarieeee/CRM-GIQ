import { Download, Filter, Search, Upload } from 'lucide-react';

export default function FiltersBar({ t, filters, setFilters, sources, industries, stages, onExportJson, onExportCsv, onImportJson }) {
  return (
    <section className="glass-panel rounded-3xl p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="input pl-10"
            placeholder={t.search}
            value={filters.query}
            onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
          />
        </div>

        <select className="input" value={filters.stageId} onChange={(event) => setFilters((prev) => ({ ...prev, stageId: event.target.value }))}>
          <option value="">{t.allStages}</option>
          {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.ro || stage.en || stage.name}</option>)}
        </select>

        <select className="input" value={filters.source} onChange={(event) => setFilters((prev) => ({ ...prev, source: event.target.value }))}>
          <option value="">{t.allSources}</option>
          {sources.map((source) => <option key={source} value={source}>{source}</option>)}
        </select>

        <select className="input" value={filters.industry} onChange={(event) => setFilters((prev) => ({ ...prev, industry: event.target.value }))}>
          <option value="">{t.allIndustries}</option>
          {industries.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
        </select>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button className="btn-secondary flex items-center gap-2" onClick={onExportCsv}><Download size={16} /> CSV</button>
          <button className="btn-secondary flex items-center gap-2" onClick={onExportJson}><Download size={16} /> JSON</button>
          <label className="btn-secondary flex items-center gap-2">
            <Upload size={16} /> JSON
            <input className="hidden" type="file" accept="application/json" onChange={onImportJson} />
          </label>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-400">
        <Filter size={14} /> {t.importHint}
      </div>
    </section>
  );
}
