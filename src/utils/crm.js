import { isPast, isThisWeek, isToday } from './date.js';

export function getStageName(stage, lang = 'ro') {
  if (!stage) return '—';
  return stage[lang] || stage.ro || stage.en || stage.name || '—';
}

export function filterLeads(leads, filters) {
  const query = filters.query.trim().toLowerCase();
  return leads.filter((lead) => {
    const haystack = [
      lead.companyName,
      lead.contactName,
      lead.phone,
      lead.email,
      lead.website,
      lead.instagram,
      lead.facebook,
      lead.industry,
      lead.cityCountry,
      lead.source,
      lead.leadQuality,
      lead.leadQualityComment,
      lead.notes,
      lead.leadQuestion,
      lead.leadAnswer,
      ...(lead.leadQa || []).flatMap((item) => [item.question, item.answer]),
    ].join(' ').toLowerCase();

    const matchesQuery = !query || haystack.includes(query);
    const matchesSource = !filters.source || lead.source === filters.source;
    const matchesIndustry = !filters.industry || lead.industry === filters.industry;
    const matchesStage = !filters.stageId || lead.stageId === filters.stageId;

    return matchesQuery && matchesSource && matchesIndustry && matchesStage;
  });
}

export function getUniqueOptions(leads, field) {
  return Array.from(new Set(leads.map((lead) => lead[field]).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function calculateStats(leads) {
  const totalValue = leads.reduce((sum, lead) => sum + Number(lead.potentialValue || 0), 0);
  return {
    total: leads.length,
    newLeads: leads.filter((lead) => lead.stageId === 'new').length,
    calls: leads.filter((lead) => lead.stageId === 'call-scheduled').length,
    proposals: leads.filter((lead) => lead.stageId === 'proposal-sent').length,
    won: leads.filter((lead) => lead.stageId === 'won').length,
    lost: leads.filter((lead) => lead.stageId === 'lost').length,
    totalValue,
    followUpsToday: leads.filter((lead) => isToday(lead.nextFollowUp)).length,
    overdue: leads.filter((lead) => isPast(lead.nextFollowUp)).length,
    thisWeek: leads.filter((lead) => isThisWeek(lead.nextFollowUp)).length,
  };
}

export function buildHistoryEntry(text) {
  return { at: new Date().toISOString(), text };
}
