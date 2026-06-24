import { Plus, Trash2, X } from 'lucide-react';

const colors = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-rose-100 text-rose-700 border-rose-200',
];

export default function PipelineManager({ isOpen, t, lang, pipelines, activePipelineId, onClose, onCreatePipeline, onAddStage, onDeleteStage }) {
  if (!isOpen) return null;
  const activePipeline = pipelines.find((pipeline) => pipeline.id === activePipelineId);

  function createPipeline(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = data.get('name')?.trim();
    const description = data.get('description')?.trim();
    if (!name) return;
    onCreatePipeline({ name, description });
    event.currentTarget.reset();
  }

  function addStage(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = data.get('stageName')?.trim();
    if (!name) return;
    onAddStage({
      ro: name,
      en: name,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
    event.currentTarget.reset();
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="mt-6 w-full max-w-4xl rounded-[32px] bg-white p-5 shadow-2xl md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-600">{t.settings}</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{t.pipelines} & {t.manageStages}</h2>
          </div>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200"><X size={20} /></button>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-black text-slate-950">{t.addPipeline}</h3>
            <form className="mt-4 grid gap-3" onSubmit={createPipeline}>
              <label><span className="label">{t.pipelineName}</span><input className="input" name="name" placeholder="Ex: Anna V Design" /></label>
              <label><span className="label">{t.pipelineDescription}</span><textarea className="input min-h-24" name="description" /></label>
              <button className="btn-primary flex items-center justify-center gap-2"><Plus size={17} />{t.create}</button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-black text-slate-950">{activePipeline?.name}</h3>
            <p className="mt-1 text-sm font-bold text-slate-500">{activePipeline?.description}</p>
            <form className="mt-4 flex gap-2" onSubmit={addStage}>
              <input className="input" name="stageName" placeholder={t.stageName} />
              <button className="btn-primary shrink-0">{t.addStage}</button>
            </form>

            <div className="mt-4 grid gap-2">
              {activePipeline?.stages?.map((stage) => (
                <div key={stage.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <span className={`rounded-full border px-3 py-1 text-sm font-black ${stage.color || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {stage[lang] || stage.ro || stage.en || stage.name}
                  </span>
                  {!['new', 'won', 'lost'].includes(stage.slug || stage.id) && (
                    <button className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100" onClick={() => onDeleteStage(stage.id)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-5 rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800">
          {t.permissionsNote}
        </div>
      </div>
    </div>
  );
}
