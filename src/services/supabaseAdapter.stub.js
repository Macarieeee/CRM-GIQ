import { supabase } from './supabaseClient.js';
import { DEFAULT_STAGES } from '../data/defaultData.js';

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
    stages: (pipeline.stages || []).map(mapStageFromDb).sort((a, b) => a.displayOrder - b.displayOrder),
    createdAt: pipeline.created_at,
    updatedAt: pipeline.updated_at,
  };
}

function normalizeLeadQa(value, legacyQuestion = '', legacyAnswer = '') {
  const source = Array.isArray(value) ? value : [];
  const normalized = source
    .map((item) => ({
      question: String(item?.question || '').trim(),
      answer: String(item?.answer || '').trim(),
    }))
    .filter((item) => item.question || item.answer);

  if (normalized.length) return normalized;

  if (legacyQuestion || legacyAnswer) {
    return [{
      question: legacyQuestion || '',
      answer: legacyAnswer || '',
    }];
  }

  return [];
}

function mapLeadFromDb(lead) {
  const leadQa = normalizeLeadQa(lead.lead_qa, lead.lead_question, lead.lead_answer);

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
    leadQuestion: lead.lead_question || '',
    leadAnswer: lead.lead_answer || '',
    leadQa,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
    history: (lead.lead_history || []).map((item) => ({
      at: item.created_at,
      text: item.body,
    })),
  };
}

function mapLeadToDb(lead, userId) {
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
    lead_qa: normalizeLeadQa(lead.leadQa, lead.leadQuestion, lead.leadAnswer),
    lead_question: lead.leadQuestion || lead.leadQa?.[0]?.question || null,
    lead_answer: lead.leadAnswer || lead.leadQa?.[0]?.answer || null,
    created_by: lead.createdBy || userId || null,
  };
}

export const supabaseAdapter = {
  async getSession() {
    const client = requireSupabase();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async signIn(email, password) {
    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  },

  async signUp(email, password) {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    return data.session;
  },

  async signOut() {
    const client = requireSupabase();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const client = requireSupabase();
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  async listOrganizations() {
    const client = requireSupabase();
    const { data, error } = await client
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getUserSettings() {
    const client = requireSupabase();
    const user = await this.getCurrentUser();
    const { data, error } = await client
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateUserSettings(settings) {
    const client = requireSupabase();
    const user = await this.getCurrentUser();
    const { data, error } = await client
      .from('user_settings')
      .upsert({
        user_id: user.id,
        active_organization_id: settings.activeOrganizationId || null,
        active_pipeline_id: settings.activePipelineId || null,
        language: settings.language || 'ro',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async listPipelines() {
    const client = requireSupabase();
    const { data, error } = await client
      .from('pipelines')
      .select('*, stages(*)')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data.map(mapPipelineFromDb);
  },

  async createPipeline({ organizationId, name, description }) {
    const client = requireSupabase();
    const { data: pipeline, error } = await client
      .from('pipelines')
      .insert({
        organization_id: organizationId,
        name,
        description: description || null,
      })
      .select()
      .single();

    if (error) throw error;

    const stages = DEFAULT_STAGES.map((stage, index) => ({
      pipeline_id: pipeline.id,
      slug: stage.id,
      name_ro: stage.ro,
      name_en: stage.en,
      display_order: (index + 1) * 10,
      color: stage.color,
    }));

    const { error: stagesError } = await client.from('stages').insert(stages);
    if (stagesError) throw stagesError;
    return pipeline;
  },

  async addStage(pipelineId, stage) {
    const client = requireSupabase();
    const { data: existingStages, error: listError } = await client
      .from('stages')
      .select('display_order')
      .eq('pipeline_id', pipelineId)
      .order('display_order', { ascending: false })
      .limit(1);

    if (listError) throw listError;

    const displayOrder = Number(existingStages?.[0]?.display_order || 0) + 10;
    const { data, error } = await client
      .from('stages')
      .insert({
        pipeline_id: pipelineId,
        slug: stage.slug,
        name_ro: stage.ro,
        name_en: stage.en || stage.ro,
        display_order: displayOrder,
        color: stage.color || null,
      })
      .select()
      .single();

    if (error) throw error;
    return mapStageFromDb(data);
  },

  async deleteStage(stageId) {
    const client = requireSupabase();
    const { error } = await client.from('stages').delete().eq('id', stageId);
    if (error) throw error;
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
    const user = await this.getCurrentUser();
    const { data, error } = await client
      .from('leads')
      .upsert(mapLeadToDb(lead, user.id))
      .select('*, lead_history(*)')
      .single();

    if (error) throw error;
    return mapLeadFromDb(data);
  },

  async importLeads(leads) {
    const savedLeads = [];

    for (const lead of leads) {
      const savedLead = await this.upsertLead(lead);
      await this.addLeadHistory(savedLead.id, 'Lead importat din JSON in Supabase.');
      savedLeads.push(savedLead);
    }

    return savedLeads;
  },

  async deleteLead(leadId) {
    const client = requireSupabase();
    const { error } = await client.from('leads').delete().eq('id', leadId);
    if (error) throw error;
  },

  async addLeadHistory(leadId, body) {
    const client = requireSupabase();
    const user = await this.getCurrentUser();
    const { error } = await client.from('lead_history').insert({
      lead_id: leadId,
      author_id: user.id,
      body,
    });

    if (error) throw error;
  },
};
