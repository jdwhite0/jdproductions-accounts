/** Initial JD opportunities. Compensation, location, schedule, and start dates stay unset and off the public posting. */
export const DEPARTMENTS = [
  { id: '00000000-0000-4000-8000-000000000101', name: 'Technology & Intelligence' },
  { id: '00000000-0000-4000-8000-000000000102', name: 'Business Development & Partnerships' },
  { id: '00000000-0000-4000-8000-000000000103', name: 'Operations & Corporate Development' },
  { id: '00000000-0000-4000-8000-000000000104', name: 'Finance & Economic Systems' },
  { id: '00000000-0000-4000-8000-000000000105', name: 'Communications & Media' },
  { id: '00000000-0000-4000-8000-000000000106', name: 'Advanced Industries & Research' },
  { id: '00000000-0000-4000-8000-000000000107', name: 'Product & Engineering' }
];

const UNRESOLVED = [
  'compensation',
  'start_date',
  'work_arrangement',
  'schedule',
  'duration',
  'named_supervisor'
];

const INTERESTS = [
  'Technology & AI',
  'Engineering',
  'Business Development',
  'Operations',
  'Finance',
  'Communications & Media',
  'Design & Product',
  'Advanced Industries',
  'Research',
  'Other'
];

function role(partial) {
  return {
    status: 'published',
    workplace: 'to_be_confirmed',
    location: null,
    headcount: 1,
    compensationMinCents: null,
    compensationMaxCents: null,
    compensationCurrency: 'usd',
    compensationPublic: false,
    resumeRequired: false,
    timingStatus: 'to_be_determined',
    supervisorLabel: null,
    durationText: null,
    scheduleText: null,
    unresolvedTerms: UNRESOLVED,
    instructions:
      'Submit this form to apply. An application is not an offer of employment, an interview, or a promise of a response by a particular date.',
    questions: [
      {
        prompt: 'Relevant experience',
        fieldType: 'longtext',
        required: false
      }
    ],
    ...partial
  };
}

function lines(items) {
  return items.join('\n');
}

export const OPPORTUNITIES = [
  role({
    id: '00000000-0000-4000-8000-000000000201',
    slug: 'business-development-partnerships-intern',
    title: 'Business Development & Partnerships Intern',
    departmentName: 'Business Development & Partnerships',
    opportunityType: 'internship',
    employmentType: 'internship',
    summary:
      'Support JD Productions in identifying commercial opportunities, researching markets, developing relationships, and building its early business-development infrastructure.',
    description: `JD Productions is opening a Business Development & Partnerships internship for someone who wants to learn how a founder-led company studies markets, finds possible customers, and builds the first usable version of a commercial practice.

You will research companies and institutions that could use JD’s technology and production work, keep the outreach record in order, and help turn raw notes into proposals and briefings a founder can use. The day-to-day work is commercial research, lead qualification, partnership tracking, and the documents that support an early business conversation. You will be expected to write clearly, follow a thread through more than one conversation, and leave a record the next person can trust.

This is a supervised internship. The intern is not the corporation’s independent sales executive. You do not close agreements, set commercial terms, or speak for the company without review. The value of the role is the quality of the research and the discipline of the pipeline, not a title that implies you are the sales organization.`,
    responsibilities: lines([
      'Research prospective clients, partners, and adjacent markets, and write up what you find so it can be used in a real conversation.',
      'Organize market and industry intelligence into a record the company can return to, rather than a pile of loose notes.',
      'Support lead generation and qualification by separating serious prospects from names that only look relevant.',
      'Maintain partnership and outreach records so follow-ups, introductions, and open questions stay visible.',
      'Assist with business proposals and presentations by drafting sections, gathering supporting material, and preparing the file for review.',
      'Research potential revenue opportunities and explain, in writing, why each one does or does not deserve a next step.',
      'Document the outreach and relationship-development workflow so the next person can continue it without starting over.'
    ]),
    qualifications: lines([
      'You have an interest in business, entrepreneurship, economics, or strategy that you can show through coursework, a project, or work you can describe.',
      'You write clearly and you are willing to research a company before you talk about it.',
      'You can keep a list, a spreadsheet, and a set of follow-ups in order.',
      'You are familiar with spreadsheets and ordinary digital productivity tools.',
      'You want to learn professional relationship management, including how to be precise, follow up, and accept edits.'
    ]),
    learningOutcomes: lines([
      'You will practice commercial research: how to study a market and a prospect and write a conclusion someone else can act on.',
      'You will see how business development works at an early company, including qualification, outreach, and the difference between interest and a commitment.',
      'You will learn how partnership conversations are prepared, tracked, and handed back for a decision.',
      'You will use a simple customer-relationship record and leave it in a state another person can trust.',
      'You will help assemble a proposal or briefing and learn what has to be true in the document before it goes out.'
    ]),
    timingNote: null
  })
];
