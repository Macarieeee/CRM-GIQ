# Growth IQ CRM

CRM local simplu pentru lead-uri, pipeline-uri, stagii, notițe și follow-up-uri.

## Ce include

- React + Vite + Tailwind CSS
- Salvare locală în `localStorage`
- Pipeline-uri custom
- Stagii custom
- Kanban cu drag & drop
- Mutare lead cu dropdown
- Notițe importante pentru fiecare lead
- Follow-up-uri: azi, întârziate, săptămâna curentă
- Dashboard cu statistici
- Căutare și filtre
- Export CSV
- Export backup JSON
- Import backup JSON
- Switch limbă RO / EN
- Structură pregătită pentru Supabase și roluri viitoare

## Instalare

```bash
npm install
npm run dev
```

Apoi deschide URL-ul afișat în terminal, de obicei `http://localhost:5173`.

## Build pentru producție

```bash
npm run build
npm run preview
```

## Observație importantă

Datele sunt salvate local în browser. Dacă ștergi cache-ul/browser data, poți pierde datele. Folosește periodic `Export JSON` pentru backup.

## Upgrade viitor cu Supabase

Fișierul `src/services/supabaseAdapter.stub.js` conține structura recomandată pentru transformarea aplicației locale într-un CRM cu:

- login
- conturi client / partener / asociat
- roluri și acces restrictiv
- pipeline-uri per organizație
- notițe cu autor
- sincronizare între device-uri
