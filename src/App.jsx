import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import PipelineTabs from './components/PipelineTabs.jsx';
import StatsGrid from './components/StatsGrid.jsx';
import FiltersBar from './components/FiltersBar.jsx';
import KanbanBoard from './components/KanbanBoard.jsx';
import LeadModal from './components/LeadModal.jsx';
import PipelineManager from './components/PipelineManager.jsx';
import FollowUpsPanel from './components/FollowUpsPanel.jsx';
import { copy } from './data/i18n.js';
import { calculateStats, filterLeads, getUniqueOptions } from './utils/crm.js';
import { exportCsv, exportJson } from './services/localCrmStore.js';
import { isSupabaseConfigured } from './services/supabaseClient.js';
import { supabaseAdapter } from './services/supabaseAdapter.stub.js';

const emptyFilters = { query: '', source: '', industry: '', stageId: '' };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createSlug(input) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || crypto.randomUUID();
}

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase();
}

function getImportedLeads(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.leads)) return payload.leads;
  if (payload?.lead && typeof payload.lead === 'object') return [payload.lead];
  if (payload && typeof payload === 'object' && (payload.companyName || payload.company_name || payload.name)) return [payload];
  return [];
}

function findImportedPipeline(payload, lead) {
  const pipelines = Array.isArray(payload?.pipelines) ? payload.pipelines : [];
  return pipelines.find((pipeline) => pipeline.id === lead.pipelineId) || null;
}

function resolveStageId(lead, activePipeline, importedPipeline) {
  const importedStage = importedPipeline?.stages?.find((stage) => stage.id === lead.stageId) || null;
  const candidates = [
    lead.stageId,
    lead.stageSlug,
    lead.status,
    lead.stage,
    importedStage?.slug,
    importedStage?.ro,
    importedStage?.en,
    importedStage?.name,
  ].map(normalizeToken).filter(Boolean);

  const matchedStage = activePipeline.stages.find((stage) => {
    const stageTokens = [stage.id, stage.slug, stage.ro, stage.en, stage.name].map(normalizeToken);
    return candidates.some((candidate) => stageTokens.includes(candidate));
  });

  return matchedStage?.id || activePipeline.stages[0]?.id || null;
}

function normalizeDate(value) {
  if (!value) return '';
  const dateText = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return dateText;

  const date = new Date(dateText);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function normalizeLeadQuality(value) {
  const score = Number(value || 0);
  return score >= 1 && score <= 10 ? String(score) : '';
}

function normalizeLeadQa(value, fallbackQuestion = '', fallbackAnswer = '') {
  const source = Array.isArray(value) ? value : [];
  const normalized = source
    .map((item) => ({
      question: String(item?.question || item?.intrebare || '').trim(),
      answer: String(item?.answer || item?.raspuns || '').trim(),
    }))
    .filter((item) => item.question || item.answer);

  if (normalized.length) return normalized;

  if (fallbackQuestion || fallbackAnswer) {
    return [{
      question: fallbackQuestion || '',
      answer: fallbackAnswer || '',
    }];
  }

  return [];
}

function normalizeImportedLead(lead, activePipeline, importedPipeline) {
  const companyName = String(lead.companyName || lead.company_name || lead.company || lead.name || '').trim();
  if (!companyName) return null;

  const rawId = String(lead.id || '').trim();
  const leadQuestion = lead.leadQuestion || lead.lead_question || lead.question || lead.intrebare || '';
  const leadAnswer = lead.leadAnswer || lead.lead_answer || lead.answer || lead.raspuns || '';
  const leadQa = normalizeLeadQa(lead.leadQa || lead.lead_qa || lead.qa || lead.questions, leadQuestion, leadAnswer);
  const normalized = {
    pipelineId: activePipeline.id,
    stageId: resolveStageId(lead, activePipeline, importedPipeline),
    companyName,
    contactName: lead.contactName || lead.contact_name || lead.contact || '',
    phone: lead.phone || lead.telefon || '',
    email: lead.email || '',
    website: lead.website || lead.site || '',
    instagram: lead.instagram || '',
    facebook: lead.facebook || '',
    industry: lead.industry || lead.niche || lead.nisa || '',
    cityCountry: lead.cityCountry || lead.city_country || lead.location || lead.city || '',
    source: lead.source || lead.sursa || '',
    potentialValue: Number(lead.potentialValue ?? lead.potential_value ?? lead.value ?? lead.budget ?? 0) || 0,
    leadQuality: normalizeLeadQuality(lead.leadQuality ?? lead.lead_quality),
    leadQualityComment: lead.leadQualityComment || lead.lead_quality_comment || '',
    nextFollowUp: normalizeDate(lead.nextFollowUp || lead.next_follow_up),
    notes: lead.notes || lead.note || lead.description || '',
    leadQuestion,
    leadAnswer,
    leadQa,
  };

  if (uuidPattern.test(rawId)) normalized.id = rawId;
  return normalized;
}

function LoginPanel({ error, onSubmit, onSignUp }) {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="glass-panel grid w-full max-w-md gap-4 rounded-3xl p-6">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-blue-600">Growth IQ CRM</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Login Supabase</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Autentifica-te cu userul creat in Supabase ca sa incarci datele live.</p>
        </div>
        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div>}
        <label>
          <span className="label">Email</span>
          <input className="input" name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          <span className="label">Parola</span>
          <input className="input" name="password" type="password" autoComplete="current-password" required />
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" type="submit">Intra in CRM</button>
          <button className="btn-secondary" type="button" onClick={onSignUp}>Creeaza user</button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [crmState, setCrmState] = useState({ pipelines: [], leads: [], activePipelineId: '' });
  const [settings, setSettings] = useState({ language: 'ro' });
  const [filters, setFilters] = useState(emptyFilters);
  const [modalLead, setModalLead] = useState(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isPipelineManagerOpen, setIsPipelineManagerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const lang = settings.language || 'ro';
  const t = copy[lang];

  const activePipeline = useMemo(() => {
    return crmState.pipelines.find((pipeline) => pipeline.id === crmState.activePipelineId) || crmState.pipelines[0];
  }, [crmState.activePipelineId, crmState.pipelines]);

  const pipelineLeads = useMemo(() => {
    return crmState.leads.filter((lead) => lead.pipelineId === activePipeline?.id);
  }, [crmState.leads, activePipeline?.id]);

  const filteredLeads = useMemo(() => filterLeads(pipelineLeads, filters), [pipelineLeads, filters]);
  const stats = useMemo(() => calculateStats(pipelineLeads), [pipelineLeads]);
  const sources = useMemo(() => getUniqueOptions(pipelineLeads, 'source'), [pipelineLeads]);
  const industries = useMemo(() => getUniqueOptions(pipelineLeads, 'industry'), [pipelineLeads]);

  async function loadSupabaseData(preferredPipelineId) {
    setIsLoading(true);
    setError('');
    try {
      const [orgs, userSettings, pipelines, leads] = await Promise.all([
        supabaseAdapter.listOrganizations(),
        supabaseAdapter.getUserSettings(),
        supabaseAdapter.listPipelines(),
        supabaseAdapter.listLeads(),
      ]);

      const activePipelineId = preferredPipelineId
        || userSettings?.active_pipeline_id
        || pipelines[0]?.id
        || '';

      setOrganizations(orgs);
      setSettings({ language: userSettings?.language || 'ro' });
      setCrmState({ pipelines, leads, activePipelineId });

      if (activePipelineId) {
        await supabaseAdapter.updateUserSettings({
          activeOrganizationId: userSettings?.active_organization_id || orgs[0]?.id,
          activePipelineId,
          language: userSettings?.language || 'ro',
        });
      }
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || 'Nu am putut incarca datele din Supabase.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function boot() {
      if (!isSupabaseConfigured) {
        setError('Lipsesc VITE_SUPABASE_URL sau VITE_SUPABASE_ANON_KEY in .env.');
        setIsLoading(false);
        return;
      }

      try {
        const initialSession = await supabaseAdapter.getSession();
        setSession(initialSession);
        if (initialSession) await loadSupabaseData();
      } catch (bootError) {
        console.error(bootError);
        setError(bootError.message || 'Nu am putut porni conexiunea Supabase.');
      } finally {
        setIsLoading(false);
      }
    }

    boot();
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    try {
      const nextSession = await supabaseAdapter.signIn(formData.get('email'), formData.get('password'));
      setSession(nextSession);
      await loadSupabaseData();
    } catch (loginError) {
      setError(loginError.message || 'Login esuat.');
    }
  }

  async function handleSignUp() {
    const email = document.querySelector('input[name="email"]')?.value;
    const password = document.querySelector('input[name="password"]')?.value;
    if (!email || !password) {
      setError('Completeaza email si parola inainte sa creezi userul.');
      return;
    }

    try {
      const nextSession = await supabaseAdapter.signUp(email, password);
      setSession(nextSession);
      if (nextSession) await loadSupabaseData();
      else setError('User creat. Verifica emailul daca ai confirmarea activata in Supabase, apoi intra in CRM.');
    } catch (signUpError) {
      setError(signUpError.message || 'Nu am putut crea userul.');
    }
  }

  async function handleSignOut() {
    await supabaseAdapter.signOut();
    setSession(null);
    setOrganizations([]);
    setCrmState({ pipelines: [], leads: [], activePipelineId: '' });
  }

  async function setLanguage(nextLanguage) {
    setSettings((previous) => ({ ...previous, language: nextLanguage }));
    await supabaseAdapter.updateUserSettings({
      activeOrganizationId: organizations[0]?.id,
      activePipelineId: activePipeline?.id,
      language: nextLanguage,
    });
  }

  async function setActivePipelineId(pipelineId) {
    setFilters(emptyFilters);
    setCrmState((previous) => ({ ...previous, activePipelineId: pipelineId }));
    await supabaseAdapter.updateUserSettings({
      activeOrganizationId: organizations[0]?.id,
      activePipelineId: pipelineId,
      language: lang,
    });
  }

  function openNewLeadModal() {
    setModalLead(null);
    setIsLeadModalOpen(true);
  }

  function openEditLeadModal(lead) {
    setModalLead(lead);
    setIsLeadModalOpen(true);
  }

  function closeLeadModal() {
    setModalLead(null);
    setIsLeadModalOpen(false);
  }

  async function saveLead(payload) {
    if (!activePipeline) return;
    const isEdit = Boolean(payload.id);
    const stage = activePipeline.stages.find((item) => item.id === payload.stageId);
    const stageLabel = stage?.ro || stage?.en || payload.stageId;

    try {
      const savedLead = await supabaseAdapter.upsertLead({
        ...payload,
        pipelineId: activePipeline.id,
      });
      await supabaseAdapter.addLeadHistory(savedLead.id, isEdit ? `Actualizat. Status: ${stageLabel}` : 'Lead creat.');
      await loadSupabaseData(activePipeline.id);
      closeLeadModal();
    } catch (saveError) {
      console.error(saveError);
      alert(saveError.message || 'Nu am putut salva lead-ul in Supabase.');
    }
  }

  async function deleteLead(leadId) {
    if (!window.confirm(t.confirmDeleteLead)) return;
    try {
      await supabaseAdapter.deleteLead(leadId);
      await loadSupabaseData(activePipeline?.id);
      closeLeadModal();
    } catch (deleteError) {
      alert(deleteError.message || 'Nu am putut sterge lead-ul.');
    }
  }

  async function changeLeadStage(leadId, stageId) {
    const lead = crmState.leads.find((item) => item.id === leadId);
    if (!lead) return;
    try {
      await supabaseAdapter.upsertLead({ ...lead, stageId });
      await supabaseAdapter.addLeadHistory(leadId, 'Mutat in alt stagiu.');
      await loadSupabaseData(activePipeline?.id);
    } catch (stageError) {
      alert(stageError.message || 'Nu am putut muta lead-ul.');
    }
  }

  async function createPipeline({ name, description }) {
    const organizationId = organizations[0]?.id;
    if (!organizationId) {
      alert('Nu exista organizatie in Supabase. Ruleaza supabase/seed.sql pentru userul tau.');
      return;
    }

    try {
      const pipeline = await supabaseAdapter.createPipeline({ organizationId, name, description });
      await loadSupabaseData(pipeline.id);
    } catch (pipelineError) {
      alert(pipelineError.message || 'Nu am putut crea pipeline-ul.');
    }
  }

  async function addStage(stage) {
    if (!activePipeline) return;
    try {
      await supabaseAdapter.addStage(activePipeline.id, {
        ...stage,
        slug: `${createSlug(stage.ro || stage.en || stage.name)}-${Date.now().toString(36)}`,
      });
      await loadSupabaseData(activePipeline.id);
    } catch (stageError) {
      alert(stageError.message || 'Nu am putut adauga stagiul.');
    }
  }

  async function deleteStage(stageId) {
    const hasLeads = pipelineLeads.some((lead) => lead.stageId === stageId);
    if (hasLeads) {
      alert(lang === 'ro' ? 'Muta mai intai lead-urile din acest stagiu.' : 'Move the leads from this stage first.');
      return;
    }

    try {
      await supabaseAdapter.deleteStage(stageId);
      await loadSupabaseData(activePipeline?.id);
    } catch (stageError) {
      alert(stageError.message || 'Nu am putut sterge stagiul.');
    }
  }

  async function importJsonFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activePipeline) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const importedLeads = getImportedLeads(payload);
      const normalizedLeads = importedLeads
        .map((lead) => normalizeImportedLead(lead, activePipeline, findImportedPipeline(payload, lead)))
        .filter(Boolean);

      if (!normalizedLeads.length) {
        alert('JSON-ul nu contine lead-uri valide. Include un obiect lead sau o proprietate "leads".');
        return;
      }

      await supabaseAdapter.importLeads(normalizedLeads);
      await loadSupabaseData(activePipeline.id);
      alert(`Import finalizat in Supabase: ${normalizedLeads.length} lead-uri.`);
    } catch (importError) {
      console.error(importError);
      alert(importError.message || 'Nu am putut importa JSON-ul in Supabase.');
    }
  }

  async function handleReload() {
    await loadSupabaseData(activePipeline?.id);
  }

  if (isLoading) {
    return <div className="app-shell flex min-h-screen items-center justify-center text-sm font-black text-slate-500">Se incarca Supabase...</div>;
  }

  if (!session) {
    return <LoginPanel error={error} onSubmit={handleLogin} onSignUp={handleSignUp} />;
  }

  return (
    <div className="app-shell">
      <Header
        t={t}
        language={lang}
        setLanguage={setLanguage}
        onAddLead={openNewLeadModal}
        onOpenPipeline={() => setIsPipelineManagerOpen(true)}
        onReset={handleReload}
        onSignOut={handleSignOut}
      />

      {error && (
        <div className="mx-auto mt-4 max-w-[1600px] px-4 lg:px-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div>
        </div>
      )}

      <main className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 lg:px-6 xl:grid-cols-[1fr_340px]">
        <div className="grid min-w-0 gap-5">
          <PipelineTabs
            pipelines={crmState.pipelines}
            activePipelineId={activePipeline?.id}
            setActivePipelineId={setActivePipelineId}
            onNewPipeline={() => setIsPipelineManagerOpen(true)}
          />

          <StatsGrid t={t} stats={stats} />

          <FiltersBar
            t={t}
            filters={filters}
            setFilters={setFilters}
            sources={sources}
            industries={industries}
            stages={activePipeline?.stages || []}
            onExportJson={() => exportJson(crmState)}
            onExportCsv={() => exportCsv(pipelineLeads, activePipeline)}
            onImportJson={importJsonFile}
          />

          {activePipeline ? (
            filteredLeads.length || pipelineLeads.length === 0 ? (
              <KanbanBoard
                t={t}
                lang={lang}
                stages={activePipeline?.stages || []}
                leads={filteredLeads}
                onOpenLead={openEditLeadModal}
                onStageChange={changeLeadStage}
              />
            ) : (
              <div className="glass-panel rounded-3xl p-10 text-center text-sm font-bold text-slate-400">{t.noResults}</div>
            )
          ) : (
            <div className="glass-panel rounded-3xl p-10 text-center text-sm font-bold text-slate-500">
              Nu exista pipeline-uri in Supabase. Ruleaza `supabase/seed.sql` pentru userul tau.
            </div>
          )}
        </div>

        <FollowUpsPanel t={t} lang={lang} leads={pipelineLeads} onOpenLead={openEditLeadModal} />
      </main>

      {activePipeline && (
        <LeadModal
          isOpen={isLeadModalOpen}
          lead={modalLead}
          activePipeline={activePipeline}
          t={t}
          lang={lang}
          onClose={closeLeadModal}
          onSave={saveLead}
          onDelete={deleteLead}
        />
      )}

      <PipelineManager
        isOpen={isPipelineManagerOpen}
        t={t}
        lang={lang}
        pipelines={crmState.pipelines}
        activePipelineId={activePipeline?.id}
        onClose={() => setIsPipelineManagerOpen(false)}
        onCreatePipeline={createPipeline}
        onAddStage={addStage}
        onDeleteStage={deleteStage}
      />
    </div>
  );
}
