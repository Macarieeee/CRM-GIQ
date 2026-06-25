-- Growth IQ CRM - Supabase schema
-- Ruleaza tot fisierul in Supabase Dashboard > SQL Editor > New query.

create extension if not exists pgcrypto;

create type public.organization_role as enum ('owner', 'partner', 'client', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.organization_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  slug text not null,
  name_ro text not null,
  name_en text,
  display_order integer not null default 0,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pipeline_id, slug)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  stage_id uuid references public.stages(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  company_name text not null,
  contact_name text,
  phone text,
  email text,
  website text,
  instagram text,
  facebook text,
  industry text,
  city_country text,
  source text,
  potential_value numeric(12, 2) not null default 0,
  lead_quality smallint check (lead_quality between 1 and 10),
  lead_quality_comment text,
  next_follow_up date,
  notes text,
  lead_question text,
  lead_answer text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lead_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  active_organization_id uuid references public.organizations(id) on delete set null,
  active_pipeline_id uuid references public.pipelines(id) on delete set null,
  language text not null default 'ro' check (language in ('ro', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_pipeline_id_idx on public.leads(pipeline_id);
create index leads_stage_id_idx on public.leads(stage_id);
create index leads_next_follow_up_idx on public.leads(next_follow_up);
create index stages_pipeline_id_idx on public.stages(pipeline_id);
create index lead_notes_lead_id_idx on public.lead_notes(lead_id);
create index lead_history_lead_id_idx on public.lead_history(lead_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger pipelines_set_updated_at before update on public.pipelines
  for each row execute function public.set_updated_at();
create trigger stages_set_updated_at before update on public.stages
  for each row execute function public.set_updated_at();
create trigger leads_set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();
create trigger lead_notes_set_updated_at before update on public.lead_notes
  for each row execute function public.set_updated_at();
create trigger user_settings_set_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (organization_id, user_id) do update
    set role = 'owner';

  return new;
end;
$$;

create trigger on_organization_created
  after insert on public.organizations
  for each row execute function public.handle_new_organization();

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org_id
      and om.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(target_org_id uuid, allowed_roles public.organization_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org_id
      and om.user_id = auth.uid()
      and om.role = any(allowed_roles)
  );
$$;

create or replace function public.pipeline_org_id(target_pipeline_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select organization_id from public.pipelines where id = target_pipeline_id;
$$;

create or replace function public.lead_org_id(target_lead_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select p.organization_id
  from public.leads l
  join public.pipelines p on p.id = l.pipeline_id
  where l.id = target_lead_id;
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.pipelines enable row level security;
alter table public.stages enable row level security;
alter table public.leads enable row level security;
alter table public.lead_history enable row level security;
alter table public.lead_notes enable row level security;
alter table public.user_settings enable row level security;

create policy "profiles select own or same organization"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs on theirs.organization_id = mine.organization_id
    where mine.user_id = auth.uid()
      and theirs.user_id = profiles.id
  )
);

create policy "profiles update own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "organizations select members"
on public.organizations for select
to authenticated
using (public.is_org_member(id));

create policy "organizations insert owner"
on public.organizations for insert
to authenticated
with check (owner_id = auth.uid());

create policy "organizations update owners"
on public.organizations for update
to authenticated
using (public.has_org_role(id, array['owner']::public.organization_role[]))
with check (public.has_org_role(id, array['owner']::public.organization_role[]));

create policy "organizations delete owners"
on public.organizations for delete
to authenticated
using (public.has_org_role(id, array['owner']::public.organization_role[]));

create policy "members select organization members"
on public.organization_members for select
to authenticated
using (public.is_org_member(organization_id));

create policy "members insert owners"
on public.organization_members for insert
to authenticated
with check (public.has_org_role(organization_id, array['owner']::public.organization_role[]));

create policy "members update owners"
on public.organization_members for update
to authenticated
using (public.has_org_role(organization_id, array['owner']::public.organization_role[]))
with check (public.has_org_role(organization_id, array['owner']::public.organization_role[]));

create policy "members delete owners"
on public.organization_members for delete
to authenticated
using (public.has_org_role(organization_id, array['owner']::public.organization_role[]));

create policy "pipelines select members"
on public.pipelines for select
to authenticated
using (public.is_org_member(organization_id));

create policy "pipelines insert owner partner"
on public.pipelines for insert
to authenticated
with check (public.has_org_role(organization_id, array['owner','partner']::public.organization_role[]));

create policy "pipelines update owner partner"
on public.pipelines for update
to authenticated
using (public.has_org_role(organization_id, array['owner','partner']::public.organization_role[]))
with check (public.has_org_role(organization_id, array['owner','partner']::public.organization_role[]));

create policy "pipelines delete owners"
on public.pipelines for delete
to authenticated
using (public.has_org_role(organization_id, array['owner']::public.organization_role[]));

create policy "stages select members"
on public.stages for select
to authenticated
using (public.is_org_member(public.pipeline_org_id(pipeline_id)));

create policy "stages insert owner partner"
on public.stages for insert
to authenticated
with check (public.has_org_role(public.pipeline_org_id(pipeline_id), array['owner','partner']::public.organization_role[]));

create policy "stages update owner partner"
on public.stages for update
to authenticated
using (public.has_org_role(public.pipeline_org_id(pipeline_id), array['owner','partner']::public.organization_role[]))
with check (public.has_org_role(public.pipeline_org_id(pipeline_id), array['owner','partner']::public.organization_role[]));

create policy "stages delete owners"
on public.stages for delete
to authenticated
using (public.has_org_role(public.pipeline_org_id(pipeline_id), array['owner']::public.organization_role[]));

create policy "leads select members"
on public.leads for select
to authenticated
using (public.is_org_member(public.pipeline_org_id(pipeline_id)));

create policy "leads insert owner partner"
on public.leads for insert
to authenticated
with check (public.has_org_role(public.pipeline_org_id(pipeline_id), array['owner','partner']::public.organization_role[]));

create policy "leads update owner partner"
on public.leads for update
to authenticated
using (public.has_org_role(public.pipeline_org_id(pipeline_id), array['owner','partner']::public.organization_role[]))
with check (public.has_org_role(public.pipeline_org_id(pipeline_id), array['owner','partner']::public.organization_role[]));

create policy "leads delete owners"
on public.leads for delete
to authenticated
using (public.has_org_role(public.pipeline_org_id(pipeline_id), array['owner']::public.organization_role[]));

create policy "lead history select members"
on public.lead_history for select
to authenticated
using (public.is_org_member(public.lead_org_id(lead_id)));

create policy "lead history insert owner partner"
on public.lead_history for insert
to authenticated
with check (public.has_org_role(public.lead_org_id(lead_id), array['owner','partner']::public.organization_role[]));

create policy "lead notes select members"
on public.lead_notes for select
to authenticated
using (public.is_org_member(public.lead_org_id(lead_id)));

create policy "lead notes insert owner partner client"
on public.lead_notes for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.has_org_role(public.lead_org_id(lead_id), array['owner','partner','client']::public.organization_role[])
);

create policy "lead notes update author or owner partner"
on public.lead_notes for update
to authenticated
using (
  author_id = auth.uid()
  or public.has_org_role(public.lead_org_id(lead_id), array['owner','partner']::public.organization_role[])
)
with check (
  author_id = auth.uid()
  or public.has_org_role(public.lead_org_id(lead_id), array['owner','partner']::public.organization_role[])
);

create policy "lead notes delete author or owners"
on public.lead_notes for delete
to authenticated
using (
  author_id = auth.uid()
  or public.has_org_role(public.lead_org_id(lead_id), array['owner']::public.organization_role[])
);

create policy "settings select own"
on public.user_settings for select
to authenticated
using (user_id = auth.uid());

create policy "settings insert own"
on public.user_settings for insert
to authenticated
with check (user_id = auth.uid());

create policy "settings update own"
on public.user_settings for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Query optional dupa ce ai primul user autentificat:
-- 1. In Supabase > Authentication > Users copiaza UUID-ul userului tau.
-- 2. Inlocuieste valorile marcate cu UUID-ul tau si ruleaza pentru organizatia initiala.
/*
with org as (
  insert into public.organizations (name, owner_id)
  values ('Growth IQ', 'PASTE_AUTH_USER_UUID_HERE')
  returning id
),
member as (
  insert into public.organization_members (organization_id, user_id, role)
  select id, 'PASTE_AUTH_USER_UUID_HERE', 'owner'::public.organization_role
  from org
  on conflict (organization_id, user_id) do nothing
),
pipeline as (
  insert into public.pipelines (organization_id, name, description)
  select id, 'Growth IQ Media', 'Pipeline pentru agentie, web development si servicii de marketing.'
  from org
  returning id
)
insert into public.stages (pipeline_id, slug, name_ro, name_en, display_order, color)
select pipeline.id, stage.slug, stage.name_ro, stage.name_en, stage.display_order, stage.color
from pipeline
cross join (
  values
    ('new', 'Nou', 'New', 10, 'bg-blue-100 text-blue-700 border-blue-200'),
    ('to-contact', 'De contactat', 'To contact', 20, 'bg-sky-100 text-sky-700 border-sky-200'),
    ('contacted', 'Contactat', 'Contacted', 30, 'bg-indigo-100 text-indigo-700 border-indigo-200'),
    ('interested', 'Interesat', 'Interested', 40, 'bg-emerald-100 text-emerald-700 border-emerald-200'),
    ('call-scheduled', 'Call programat', 'Call scheduled', 50, 'bg-purple-100 text-purple-700 border-purple-200'),
    ('proposal-sent', 'Propunere trimisa', 'Proposal sent', 60, 'bg-amber-100 text-amber-700 border-amber-200'),
    ('follow-up', 'Follow-up', 'Follow-up', 70, 'bg-orange-100 text-orange-700 border-orange-200'),
    ('won', 'Client castigat', 'Won client', 80, 'bg-green-100 text-green-700 border-green-200'),
    ('lost', 'Pierdut', 'Lost', 90, 'bg-rose-100 text-rose-700 border-rose-200')
) as stage(slug, name_ro, name_en, display_order, color);
*/
