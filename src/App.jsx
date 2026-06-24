import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import PipelineTabs from './components/PipelineTabs.jsx';
import StatsGrid from './components/StatsGrid.jsx';
import FiltersBar from './components/FiltersBar.jsx';
import KanbanBoard from './components/KanbanBoard.jsx';
import LeadModal from './components/LeadModal.jsx';
import PipelineManager from './components/PipelineManager.jsx';
import FollowUpsPanel from './components/FollowUpsPanel.jsx';
import { DEFAULT_STAGES } from './data/defaultData.js';
import { copy } from './data/i18n.js';
import { calculateStats, buildHistoryEntry, filterLeads, getUniqueOptions } from './utils/crm.js';
import { exportCsv, exportJson, loadCrmState, loadSettings, readJsonFile, resetCrmState, saveCrmState, saveSettings } from './services/localCrmStore.js';

const emptyFilters = { query: '', source: '', industry: '', stageId: '' };

function createSlug(input) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || crypto.randomUUID();
}

export default function App() {
  const [crmState, setCrmState] = useState(loadCrmState);
  const [settings, setSettings] = useState(loadSettings);
  const [filters, setFilters] = useState(emptyFilters);
  const [modalLead, setModalLead] = useState(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isPipelineManagerOpen, setIsPipelineManagerOpen] = useState(false);

  const lang = settings.language || 'ro';
  const t = copy[lang];

  useEffect(() => {
    saveCrmState(crmState);
  }, [crmState]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

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

  function updateState(mutator) {
    setCrmState((previous) => {
      const next = mutator(previous);
      return { ...next, updatedAt: new Date().toISOString() };
    });
  }

  function setLanguage(nextLanguage) {
    setSettings((previous) => ({ ...previous, language: nextLanguage }));
  }

  function setActivePipelineId(pipelineId) {
    setFilters(emptyFilters);
    setCrmState((previous) => ({ ...previous, activePipelineId: pipelineId }));
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

  function saveLead(payload) {
    updateState((previous) => {
      const isEdit = Boolean(payload.id);
      const stage = activePipeline.stages.find((item) => item.id === payload.stageId);
      const stageLabel = stage?.ro || stage?.en || payload.stageId;

      if (isEdit) {
        return {
          ...previous,
          leads: previous.leads.map((lead) => lead.id === payload.id
            ? {
                ...lead,
                ...payload,
                updatedAt: new Date().toISOString(),
                history: [
                  ...(lead.history || []),
                  buildHistoryEntry(`Actualizat. Status: ${stageLabel}`),
                ],
              }
            : lead),
        };
      }

      const newLead = {
        ...payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [buildHistoryEntry('Lead creat.')],
      };
      return { ...previous, leads: [newLead, ...previous.leads] };
    });
    closeLeadModal();
  }

  function deleteLead(leadId) {
    if (!window.confirm(t.confirmDeleteLead)) return;
    updateState((previous) => ({
      ...previous,
      leads: previous.leads.filter((lead) => lead.id !== leadId),
    }));
    closeLeadModal();
  }

  function changeLeadStage(leadId, stageId) {
    updateState((previous) => ({
      ...previous,
      leads: previous.leads.map((lead) => {
        if (lead.id !== leadId) return lead;
        const stage = activePipeline.stages.find((item) => item.id === stageId);
        const label = stage?.ro || stage?.en || stageId;
        return {
          ...lead,
          stageId,
          updatedAt: new Date().toISOString(),
          history: [...(lead.history || []), buildHistoryEntry(`Mutat în ${label}.`)],
        };
      }),
    }));
  }

  function createPipeline({ name, description }) {
    const id = `${createSlug(name)}-${Date.now().toString(36)}`;
    const pipeline = {
      id,
      name,
      description,
      stages: DEFAULT_STAGES.map((stage) => ({ ...stage })),
      createdAt: new Date().toISOString(),
      roleAccess: {
        owner: ['read', 'create', 'update', 'delete', 'export'],
        partner: ['read', 'create', 'update'],
        client: ['read', 'comment'],
        viewer: ['read'],
      },
    };
    updateState((previous) => ({
      ...previous,
      pipelines: [...previous.pipelines, pipeline],
      activePipelineId: id,
    }));
  }

  function addStage(stage) {
    const id = `${createSlug(stage.ro || stage.en || stage.name)}-${Date.now().toString(36)}`;
    updateState((previous) => ({
      ...previous,
      pipelines: previous.pipelines.map((pipeline) => pipeline.id === activePipeline.id
        ? { ...pipeline, stages: [...pipeline.stages, { id, ...stage }] }
        : pipeline),
    }));
  }

  function deleteStage(stageId) {
    const hasLeads = pipelineLeads.some((lead) => lead.stageId === stageId);
    if (hasLeads) {
      alert(lang === 'ro' ? 'Mută mai întâi lead-urile din acest stagiu.' : 'Move the leads from this stage first.');
      return;
    }
    updateState((previous) => ({
      ...previous,
      pipelines: previous.pipelines.map((pipeline) => pipeline.id === activePipeline.id
        ? { ...pipeline, stages: pipeline.stages.filter((stage) => stage.id !== stageId) }
        : pipeline),
    }));
  }

  async function importJsonFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = await readJsonFile(file);
      if (!imported?.pipelines || !imported?.leads) throw new Error('Invalid CRM backup');
      setCrmState(imported);
      setFilters(emptyFilters);
    } catch (error) {
      alert(lang === 'ro' ? 'Fișierul JSON nu pare să fie un backup valid.' : 'The JSON file does not look like a valid backup.');
      console.error(error);
    } finally {
      event.target.value = '';
    }
  }

  function handleReset() {
    if (!window.confirm(t.confirmReset)) return;
    setCrmState(resetCrmState());
    setFilters(emptyFilters);
  }

  return (
    <div className="app-shell">
      <Header
        t={t}
        language={lang}
        setLanguage={setLanguage}
        onAddLead={openNewLeadModal}
        onOpenPipeline={() => setIsPipelineManagerOpen(true)}
        onReset={handleReset}
      />

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

          {filteredLeads.length || pipelineLeads.length === 0 ? (
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
          )}
        </div>

        <FollowUpsPanel t={t} lang={lang} leads={pipelineLeads} onOpenLead={openEditLeadModal} />
      </main>

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
