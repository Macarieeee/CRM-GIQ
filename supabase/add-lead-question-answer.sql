alter table public.leads
add column if not exists lead_question text,
add column if not exists lead_answer text,
add column if not exists lead_qa jsonb not null default '[]'::jsonb;

update public.leads
set lead_qa = jsonb_build_array(jsonb_build_object(
  'question', coalesce(lead_question, ''),
  'answer', coalesce(lead_answer, '')
))
where lead_qa = '[]'::jsonb
  and (coalesce(lead_question, '') <> '' or coalesce(lead_answer, '') <> '');
