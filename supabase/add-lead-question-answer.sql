alter table public.leads
add column if not exists lead_question text,
add column if not exists lead_answer text;
