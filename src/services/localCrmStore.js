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
