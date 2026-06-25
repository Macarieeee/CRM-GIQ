import { X } from 'lucide-react';
import { EMPTY_LEAD } from '../data/defaultData.js';

function Field({ label, children, className = '' }) {
  return <label className={className}><span className="label">{label}</span>{children}</label>;
}

function ReadOnlyBlock({ label, value, emptyLabel }) {
  return (
    <div className="md:col-span-2 lg:col-span-3">
      <span className="label">{label}</span>
      <div className="min-h-16 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
        {value?.trim() || <span className="text-slate-400">{emptyLabel}</span>}
      </div>
    </div>
  );
}

export default function LeadModal({ isOpen, lead, activePipeline, t, lang, onClose, onSave, onDelete }) {
  if (!isOpen) return null;
  const isEdit = Boolean(lead?.id);
  const initial = { ...EMPTY_LEAD, pipelineId: activePipeline.id, ...lead };

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    if (!payload.companyName.trim()) return;
    onSave({
      ...initial,
      ...payload,
      potentialValue: Number(payload.potentialValue || 0),
      pipelineId: activePipeline.id,
    });
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <form onSubmit={handleSubmit} className="mt-6 w-full max-w-5xl rounded-[32px] bg-white p-5 shadow-2xl md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-600">{activePipeline.name}</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{isEdit ? t.editLead : t.newLead}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200"><X size={20} /></button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label={t.companyName} className="lg:col-span-2">
            <input className="input" name="companyName" defaultValue={initial.companyName} required placeholder={t.companyName} />
          </Field>
          <Field label={t.contactName}>
            <input className="input" name="contactName" defaultValue={initial.contactName} />
          </Field>
          <Field label={t.phone}><input className="input" name="phone" defaultValue={initial.phone} /></Field>
          <Field label={t.email}><input className="input" name="email" type="email" defaultValue={initial.email} /></Field>
          <Field label={t.website}><input className="input" name="website" defaultValue={initial.website} /></Field>
          <Field label={t.instagram}><input className="input" name="instagram" defaultValue={initial.instagram} /></Field>
          <Field label={t.facebook}><input className="input" name="facebook" defaultValue={initial.facebook} /></Field>
          <Field label={t.industry}><input className="input" name="industry" defaultValue={initial.industry} /></Field>
          <Field label={t.cityCountry}><input className="input" name="cityCountry" defaultValue={initial.cityCountry} /></Field>
          <Field label={t.source}><input className="input" name="source" defaultValue={initial.source} /></Field>
          <Field label={t.status}>
            <select className="input" name="stageId" defaultValue={initial.stageId}>
              {activePipeline.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage[lang] || stage.ro || stage.en || stage.name}</option>)}
            </select>
          </Field>
          <Field label={`${t.potentialValue} (${t.valueCurrency})`}>
            <input className="input" name="potentialValue" type="number" min="0" step="1" defaultValue={initial.potentialValue} />
          </Field>
          <Field label={t.leadQuality}>
            <select className="input" name="leadQuality" defaultValue={initial.leadQuality}>
              <option value="">{t.leadQualitySelect}</option>
              {Array.from({ length: 10 }, (_, index) => {
                const value = String(index + 1);
                return <option key={value} value={value}>{value}</option>;
              })}
            </select>
          </Field>
          <Field label={t.nextFollowUp}>
            <input className="input" name="nextFollowUp" type="date" defaultValue={initial.nextFollowUp} />
          </Field>
          <Field label={t.leadQualityComment} className="md:col-span-2 lg:col-span-3">
            <textarea className="input min-h-28 resize-y" name="leadQualityComment" defaultValue={initial.leadQualityComment} placeholder={t.leadQualityCommentPlaceholder} />
          </Field>
          <Field label={t.notes} className="md:col-span-2 lg:col-span-3">
            <textarea className="input min-h-36 resize-y" name="notes" defaultValue={initial.notes} placeholder="Scrie aici contextul, ce a zis lead-ul, următorul pas, obiecții, buget etc." />
          </Field>
          {isEdit ? (
            <>
              <ReadOnlyBlock label={t.leadQuestion} value={initial.leadQuestion} emptyLabel={t.noLeadQuestion} />
              <ReadOnlyBlock label={t.leadAnswer} value={initial.leadAnswer} emptyLabel={t.noLeadAnswer} />
            </>
          ) : (
            <>
              <Field label={t.leadQuestion} className="md:col-span-2 lg:col-span-3">
                <textarea className="input min-h-24 resize-y" name="leadQuestion" defaultValue={initial.leadQuestion} placeholder={t.leadQuestionPlaceholder} />
              </Field>
              <Field label={t.leadAnswer} className="md:col-span-2 lg:col-span-3">
                <textarea className="input min-h-28 resize-y" name="leadAnswer" defaultValue={initial.leadAnswer} placeholder={t.leadAnswerPlaceholder} />
              </Field>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {isEdit && <button type="button" className="btn-danger" onClick={() => onDelete(initial.id)}>{t.delete}</button>}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>{t.cancel}</button>
            <button type="submit" className="btn-primary">{isEdit ? t.update : t.save}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
