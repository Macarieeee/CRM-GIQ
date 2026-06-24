import { DEFAULT_LEADS, DEFAULT_PIPELINES } from '../data/defaultData.js';

const STORAGE_KEY = 'growth-iq-crm-v1';
const SETTINGS_KEY = 'growth-iq-crm-settings-v1';

export function createInitialState() {
  return {
    version: 1,
    activePipelineId: DEFAULT_PIPELINES[0].id,
    pipelines: DEFAULT_PIPELINES,
    leads: DEFAULT_LEADS,
    updatedAt: new Date().toISOString(),
  };
}

export function loadCrmState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed?.pipelines || !parsed?.leads) return createInitialState();
    return parsed;
  } catch (error) {
    console.error('Failed to load CRM state', error);
    return createInitialState();
  }
}

export function saveCrmState(state) {
  const snapshot = { ...state, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export function resetCrmState() {
  const state = createInitialState();
  saveCrmState(state);
  return state;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { language: 'ro' };
  } catch {
    return { language: 'ro' };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  return settings;
}

export function downloadFile(filename, content, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportJson(state) {
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(`growth-iq-crm-backup-${date}.json`, JSON.stringify(state, null, 2));
}

export function exportCsv(leads, activePipeline) {
  const headers = [
    'Pipeline',
    'Company/Lead',
    'Contact',
    'Phone',
    'Email',
    'Website',
    'Instagram',
    'Facebook',
    'Industry',
    'City/Country',
    'Source',
    'Stage',
    'Potential Value',
    'Lead Quality',
    'Lead Quality Comment',
    'Created At',
    'Next Follow-up',
    'Notes',
  ];
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const rows = leads.map((lead) => {
    const stage = activePipeline?.stages?.find((s) => s.id === lead.stageId);
    return [
      activePipeline?.name,
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
      stage?.ro || stage?.en || lead.stageId,
      lead.potentialValue,
      lead.leadQuality,
      lead.leadQualityComment,
      lead.createdAt,
      lead.nextFollowUp,
      lead.notes,
    ].map(escape).join(',');
  });
  const csv = [headers.map(escape).join(','), ...rows].join('\n');
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(`growth-iq-crm-leads-${date}.csv`, csv, 'text/csv;charset=utf-8');
}

export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
