export const DEFAULT_STAGES = [
  { id: 'new', ro: 'Nou', en: 'New', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'to-contact', ro: 'De contactat', en: 'To contact', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { id: 'contacted', ro: 'Contactat', en: 'Contacted', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'interested', ro: 'Interesat', en: 'Interested', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'call-scheduled', ro: 'Call programat', en: 'Call scheduled', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'proposal-sent', ro: 'Propunere trimisă', en: 'Proposal sent', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'follow-up', ro: 'Follow-up', en: 'Follow-up', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'won', ro: 'Client câștigat', en: 'Won client', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'lost', ro: 'Pierdut', en: 'Lost', color: 'bg-rose-100 text-rose-700 border-rose-200' },
];

export const DEFAULT_PIPELINES = [
  {
    id: 'interior-design',
    name: 'Design Interior - Clientă',
    description: 'Pipeline pentru lead-uri de design interior.',
    stages: DEFAULT_STAGES,
    createdAt: new Date().toISOString(),
    roleAccess: {
      owner: ['read', 'create', 'update', 'delete', 'export'],
      partner: ['read', 'create', 'update'],
      client: ['read', 'comment'],
      viewer: ['read'],
    },
  },
  {
    id: 'growth-iq-agency',
    name: 'Growth IQ Media',
    description: 'Pipeline pentru agenție, web development și servicii de marketing.',
    stages: DEFAULT_STAGES,
    createdAt: new Date().toISOString(),
    roleAccess: {
      owner: ['read', 'create', 'update', 'delete', 'export'],
      partner: ['read', 'create', 'update'],
      client: ['read', 'comment'],
      viewer: ['read'],
    },
  },
];

export const DEFAULT_LEADS = [
  {
    id: crypto.randomUUID(),
    pipelineId: 'interior-design',
    companyName: 'Exemplu Lead - Apartament premium',
    contactName: 'Andreea Popescu',
    phone: '+40 700 000 000',
    email: 'andreea@example.com',
    website: 'https://example.com',
    instagram: '@andreea.home',
    facebook: '',
    industry: 'Design interior / rezidențial',
    cityCountry: 'București, România',
    source: 'Instagram',
    stageId: 'new',
    potentialValue: 3500,
    leadQuality: '8',
    leadQualityComment: 'Lead demo cu buget clar si timing bun.',
    createdAt: new Date().toISOString(),
    nextFollowUp: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    notes: 'Lead demo. Editează sau șterge acest card după ce testezi aplicația.',
    history: [
      { at: new Date().toISOString(), text: 'Lead demo creat automat.' }
    ],
  },
];

export const EMPTY_LEAD = {
  companyName: '',
  contactName: '',
  phone: '',
  email: '',
  website: '',
  instagram: '',
  facebook: '',
  industry: '',
  cityCountry: '',
  source: '',
  stageId: 'new',
  potentialValue: '',
  leadQuality: '',
  leadQualityComment: '',
  nextFollowUp: '',
  notes: '',
};
