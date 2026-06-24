import { supabase } from './supabaseClient.js';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Complete VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.');
  }
  return supabase;
}

function mapStageFromDb(stage) {
  return {
    id: stage.id,
    pipelineId: stage.pipeline_id,
    slug: stage.slug,
    ro: stage.name_ro,
    en: stage.name_en,
    color: stage.color,
    displayOrder: stage.display_order,
    createdAt: stage.created_at,
    updatedAt: stage.updated_at,
  };
}

function mapPipelineFromDb(pipeline) {
  return {
    id: pipeline.id,
    organizationId: pipeline.organization_id,
    name: pipeline.name,
    description: pipeline.description || '',
    stages: (pipeline.stages || []).map(mapStageFromDb),
    createdAt: pipeline.created_at,
    updatedAt: pipeline.updated_at,
  };
}

function mapLeadFromDb(lead) {
  return {
    id: lead.id,
    pipelineId: lead.pipeline_id,
    stageId: lead.stage_id,
    assignedTo: lead.assigned_to,
    companyName: lead.company_name,
    contactName: lead.contact_name || '',
    phone: lead.phone || '',
    email: lead.email || '',
    website: lead.website || '',
    instagram: lead.instagram || '',
    facebook: lead.facebook || '',
    industry: lead.industry || '',
    cityCountry: lead.city_country || '',
    source: lead.source || '',
    potentialValue: Number(lead.potential_value || 0),
    leadQuality: lead.lead_quality ? String(lead.lead_quality) : '',
    leadQualityComment: lead.lead_quality_comment || '',
    nextFollowUp: lead.next_follow_up || '',
    notes: lead.notes || '',
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
    history: (lead.lead_history || []).map((item) => ({
      at: item.created_at,
      text: item.body,
    })),
  };
}

function mapLeadToDb(lead) {
  return {
    id: lead.id || undefined,
    pipeline_id: lead.pipelineId,
    stage_id: lead.stageId || null,
    assigned_to: lead.assignedTo || null,
    company_name: lead.companyName,
    contact_name: lead.contactName || null,
    phone: lead.phone || null,
    email: lead.email || null,
    website: lead.website || null,
    instagram: lead.instagram || null,
    facebook: lead.facebook || null,
    industry: lead.industry || null,
    city_country: lead.cityCountry || null,
    source: lead.source || null,
    potential_value: Number(lead.potentialValue || 0),
    lead_quality: lead.leadQuality ? Number(lead.leadQuality) : null,
    lead_quality_comment: lead.leadQualityComment || null,
    next_follow_up: lead.nextFollowUp || null,
    notes: lead.notes || null,
  };
}

export const supabaseAdapter = {
  async listPipelines() {
    const client = requireSupabase();
    const { data, error } = await client
      .from('pipelines')
      .select('*, stages(*)')
      .order('created_at', { ascending: true })
      .order('display_order', { referencedTable: 'stages', ascending: true });

    if (error) throw error;
    return data.map(mapPipelineFromDb);
  },

  async listLeads(pipelineId) {
    const client = requireSupabase();
    let query = client
      .from('leads')
      .select('*, lead_history(*)')
      .order('created_at', { ascending: false });

    if (pipelineId) query = query.eq('pipeline_id', pipelineId);

    const { data, error } = await query;
    if (error) throw error;
    return data.map(mapLeadFromDb);
  },

  async upsertLead(lead) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('leads')
      .upsert(mapLeadToDb(lead))
      .select('*, lead_history(*)')
      .single();

    if (error) throw error;
    return mapLeadFromDb(data);
  },

  async deleteLead(leadId) {
    const client = requireSupabase();
    const { error } = await client.from('leads').delete().eq('id', leadId);
    if (error) throw error;
  },
};
