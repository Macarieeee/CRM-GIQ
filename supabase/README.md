# Supabase setup pentru Growth IQ CRM

## 1. Creeaza tabelele

In Supabase Dashboard mergi la `SQL Editor` > `New query`, copiaza continutul din `supabase/schema.sql` si ruleaza query-ul complet.

Schema creeaza:

- `profiles`
- `organizations`
- `organization_members`
- `pipelines`
- `stages`
- `leads`
- `lead_history`
- `lead_notes`
- `user_settings`
- functii, trigger-e si RLS policies pentru rolurile `owner`, `partner`, `client`, `viewer`

## 2. Valorile pentru `.env`

In Supabase Dashboard mergi la `Project Settings` > `API` si copiaza:

- `Project URL` in `VITE_SUPABASE_URL`
- `anon public` key in `VITE_SUPABASE_ANON_KEY`

Exemplu local:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_USE_SUPABASE=false
```

`VITE_USE_SUPABASE` ramane `false` pana conectam UI-ul complet la adapterul Supabase. Clientul si adapterul sunt pregatite in `src/services/supabaseClient.js` si `src/services/supabaseAdapter.stub.js`.

## 3. Seed initial

Dupa ce creezi primul user in `Authentication` > `Users`, copiaza UUID-ul lui si ruleaza query-ul comentat de la finalul fisierului `supabase/schema.sql`. Acel query creeaza organizatia initiala, membrul `owner`, pipeline-ul si stagiile default.

## 4. Deploy

`npm run deploy` ruleaza automat `npm run build` inainte de publicare prin scriptul `predeploy`.

Pentru GitHub Pages, repo-ul trebuie sa aiba:

- `Settings` > `Pages`
- Source: `Deploy from a branch`
- Branch: `gh-pages`
- Folder: `/ (root)`
