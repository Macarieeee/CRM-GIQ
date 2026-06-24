/*
  Supabase-ready adapter placeholder.

  Current version uses localStorage only. When you want login, clients, partners,
  and restricted access, keep the React UI almost the same and replace the local
  functions with Supabase calls here.

  Suggested future tables:
  - organizations: id, name, owner_id
  - profiles: id, full_name, email
  - organization_members: organization_id, user_id, role
  - pipelines: id, organization_id, name, description
  - stages: id, pipeline_id, name_ro, name_en, display_order, color
  - leads: id, pipeline_id, assigned_to, company_name, contact_name, phone,
           email, website, instagram, facebook, industry, city_country, source,
           stage_id, potential_value, next_follow_up, notes, created_at, updated_at
  - lead_notes: id, lead_id, author_id, body, created_at

  Roles to support:
  - owner: full access
  - partner: read/create/update, limited delete
  - client: read and comment on allowed pipelines
  - viewer: read-only
*/

export const futureSupabaseAdapter = {
  async listPipelines() {
    throw new Error('Supabase is not connected yet.');
  },
  async listLeads() {
    throw new Error('Supabase is not connected yet.');
  },
  async upsertLead() {
    throw new Error('Supabase is not connected yet.');
  },
  async deleteLead() {
    throw new Error('Supabase is not connected yet.');
  },
};
