-- Growth IQ CRM - seed initial data
-- Ruleaza dupa `supabase/schema.sql`.
--
-- Inlocuieste valoarea de mai jos cu UUID-ul userului tau din:
-- Supabase Dashboard > Authentication > Users > coloana User UID.

do $$
declare
  owner_user_id uuid := 'e9f4bcbe-dc57-4bd9-979c-cedc71d6a960';
  org_id uuid;
  interior_pipeline_id uuid;
  agency_pipeline_id uuid;
  stage_new_id uuid;
begin
  insert into public.profiles (id, full_name, email)
  select id,
         coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', email),
         email
  from auth.users
  where id = owner_user_id
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);

  insert into public.organizations (name, owner_id)
  values ('Growth IQ', owner_user_id)
  returning id into org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, owner_user_id, 'owner')
  on conflict (organization_id, user_id) do update
    set role = 'owner';

  insert into public.user_settings (user_id, active_organization_id, language)
  values (owner_user_id, org_id, 'ro')
  on conflict (user_id) do update
    set active_organization_id = excluded.active_organization_id,
        language = excluded.language;

  insert into public.pipelines (organization_id, name, description)
  values
    (org_id, 'Design Interior - Clienta', 'Pipeline pentru lead-uri de design interior.')
  returning id into interior_pipeline_id;

  insert into public.pipelines (organization_id, name, description)
  values
    (org_id, 'Growth IQ Media', 'Pipeline pentru agentie, web development si servicii de marketing.')
  returning id into agency_pipeline_id;

  insert into public.stages (pipeline_id, slug, name_ro, name_en, display_order, color)
  select pipeline_id, slug, name_ro, name_en, display_order, color
  from (
    values
      (interior_pipeline_id, 'new', 'Nou', 'New', 10, 'bg-blue-100 text-blue-700 border-blue-200'),
      (interior_pipeline_id, 'to-contact', 'De contactat', 'To contact', 20, 'bg-sky-100 text-sky-700 border-sky-200'),
      (interior_pipeline_id, 'contacted', 'Contactat', 'Contacted', 30, 'bg-indigo-100 text-indigo-700 border-indigo-200'),
      (interior_pipeline_id, 'interested', 'Interesat', 'Interested', 40, 'bg-emerald-100 text-emerald-700 border-emerald-200'),
      (interior_pipeline_id, 'call-scheduled', 'Call programat', 'Call scheduled', 50, 'bg-purple-100 text-purple-700 border-purple-200'),
      (interior_pipeline_id, 'proposal-sent', 'Propunere trimisa', 'Proposal sent', 60, 'bg-amber-100 text-amber-700 border-amber-200'),
      (interior_pipeline_id, 'follow-up', 'Follow-up', 'Follow-up', 70, 'bg-orange-100 text-orange-700 border-orange-200'),
      (interior_pipeline_id, 'won', 'Client castigat', 'Won client', 80, 'bg-green-100 text-green-700 border-green-200'),
      (interior_pipeline_id, 'lost', 'Pierdut', 'Lost', 90, 'bg-rose-100 text-rose-700 border-rose-200'),
      (agency_pipeline_id, 'new', 'Nou', 'New', 10, 'bg-blue-100 text-blue-700 border-blue-200'),
      (agency_pipeline_id, 'to-contact', 'De contactat', 'To contact', 20, 'bg-sky-100 text-sky-700 border-sky-200'),
      (agency_pipeline_id, 'contacted', 'Contactat', 'Contacted', 30, 'bg-indigo-100 text-indigo-700 border-indigo-200'),
      (agency_pipeline_id, 'interested', 'Interesat', 'Interested', 40, 'bg-emerald-100 text-emerald-700 border-emerald-200'),
      (agency_pipeline_id, 'call-scheduled', 'Call programat', 'Call scheduled', 50, 'bg-purple-100 text-purple-700 border-purple-200'),
      (agency_pipeline_id, 'proposal-sent', 'Propunere trimisa', 'Proposal sent', 60, 'bg-amber-100 text-amber-700 border-amber-200'),
      (agency_pipeline_id, 'follow-up', 'Follow-up', 'Follow-up', 70, 'bg-orange-100 text-orange-700 border-orange-200'),
      (agency_pipeline_id, 'won', 'Client castigat', 'Won client', 80, 'bg-green-100 text-green-700 border-green-200'),
      (agency_pipeline_id, 'lost', 'Pierdut', 'Lost', 90, 'bg-rose-100 text-rose-700 border-rose-200')
  ) as stage_data(pipeline_id, slug, name_ro, name_en, display_order, color)
  on conflict (pipeline_id, slug) do update
    set name_ro = excluded.name_ro,
        name_en = excluded.name_en,
        display_order = excluded.display_order,
        color = excluded.color;

  select id into stage_new_id
  from public.stages
  where pipeline_id = interior_pipeline_id
    and slug = 'new';

  insert into public.leads (
    pipeline_id,
    stage_id,
    company_name,
    contact_name,
    phone,
    email,
    website,
    instagram,
    facebook,
    industry,
    city_country,
    source,
    potential_value,
    lead_quality,
    lead_quality_comment,
    next_follow_up,
    notes,
    lead_question,
    lead_answer,
    lead_qa,
    created_by
  )
  values (
    interior_pipeline_id,
    stage_new_id,
    'Exemplu Lead - Apartament premium',
    'Andreea Popescu',
    '+40 700 000 000',
    'andreea@example.com',
    'https://example.com',
    '@andreea.home',
    null,
    'Design interior / rezidential',
    'Bucuresti, Romania',
    'Instagram',
    3500,
    8,
    'Lead demo cu buget clar si timing bun.',
    current_date + 1,
    'Lead demo. Editeaza sau sterge acest card dupa ce testezi aplicatia.',
    'Care este obiectivul principal al amenajarii?',
    'Clienta vrea un apartament premium, luminos, cu depozitare integrata.',
    jsonb_build_array(jsonb_build_object(
      'question', 'Care este obiectivul principal al amenajarii?',
      'answer', 'Clienta vrea un apartament premium, luminos, cu depozitare integrata.'
    )),
    owner_user_id
  );

  update public.user_settings
  set active_organization_id = org_id,
      active_pipeline_id = interior_pipeline_id,
      language = 'ro'
  where user_id = owner_user_id;
end $$;
