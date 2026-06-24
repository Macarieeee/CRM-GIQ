import LeadCard from './LeadCard.jsx';

export default function KanbanBoard({ t, lang, stages, leads, onOpenLead, onStageChange }) {
  function handleDrop(event, stageId) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    const leadId = event.dataTransfer.getData('leadId');
    if (leadId) onStageChange(leadId, stageId);
  }

  function handleDragStart(event, leadId) {
    event.dataTransfer.setData('leadId', leadId);
    event.dataTransfer.effectAllowed = 'move';
  }

  return (
    <section className="no-scrollbar flex gap-4 overflow-x-auto pb-8">
      {stages.map((stage) => {
        const stageLeads = leads.filter((lead) => lead.stageId === stage.id);
        return (
          <div
            key={stage.id}
            onDragOver={(event) => { event.preventDefault(); event.currentTarget.classList.add('drag-over'); }}
            onDragLeave={(event) => event.currentTarget.classList.remove('drag-over')}
            onDrop={(event) => handleDrop(event, stage.id)}
            className="kanban-column rounded-[28px] border border-slate-200 bg-slate-100/70 p-3 transition"
          >
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-sm font-black text-slate-950">{stage[lang] || stage.ro || stage.en || stage.name}</h2>
                <p className="text-xs font-bold text-slate-400">{stageLeads.length} leads</p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${stage.color || 'bg-white text-slate-600 border-slate-200'}`}>{stageLeads.length}</span>
            </div>

            <div className="grid gap-3">
              {stageLeads.length > 0 ? stageLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  stage={stage}
                  stages={stages}
                  lang={lang}
                  t={t}
                  onOpen={onOpenLead}
                  onStageChange={onStageChange}
                  onDragStart={handleDragStart}
                />
              )) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-5 text-center text-sm font-bold text-slate-400">
                  {t.noLeads}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
