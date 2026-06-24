import { Plus } from 'lucide-react';

export default function PipelineTabs({ pipelines, activePipelineId, setActivePipelineId, onNewPipeline }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto py-1">
      {pipelines.map((pipeline) => {
        const active = pipeline.id === activePipelineId;
        return (
          <button
            key={pipeline.id}
            onClick={() => setActivePipelineId(pipeline.id)}
            className={`whitespace-nowrap rounded-2xl border px-4 py-3 text-sm font-black transition ${active ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-200' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
          >
            {pipeline.name}
          </button>
        );
      })}
      <button onClick={onNewPipeline} className="flex items-center gap-2 whitespace-nowrap rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-600 hover:border-slate-500">
        <Plus size={16} /> New
      </button>
    </div>
  );
}
