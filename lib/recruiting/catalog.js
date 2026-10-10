/** Initial JD opportunities. Compensation, location, schedule, and start dates are unset on purpose. */
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
    description:
      'This internship supports early commercial research and relationship development. The intern is not the corporation’s independent sales executive. A named supervisor, schedule, duration, compensation, and start date have not been set. You may apply before those terms are established.',
    responsibilities: [
      'Research prospective clients and partners.',
      'Organize market and industry intelligence.',
      'Support lead generation and qualification.',
      'Maintain partnership and outreach records.',
      'Assist with business proposals and presentations.',
      'Research potential revenue opportunities.',
      'Document outreach and relationship-development workflows.'
    ].join('\n'),
    qualifications: [
      'Interest in business, entrepreneurship, economics, or strategy.',
      'Strong communication and research skills.',
      'Organizational ability.',
      'Familiarity with spreadsheets and digital productivity tools.',
      'Willingness to learn professional relationship management.'
    ].join('\n'),
    learningOutcomes: [
      'Commercial research.',
      'Business development.',
      'Partnership strategy.',
      'CRM processes.',
      'Proposal development.'
    ].join('\n'),
    timingNote: 'A start date has not been set. You may apply before a final start date is established.'
  }),
  role({
    id: '00000000-0000-4000-8000-000000000202',
    slug: 'software-engineering-ai-systems-intern',
    title: 'Software Engineering & AI Systems Intern',
    departmentName: 'Technology & Intelligence',
    opportunityType: 'internship',
    employmentType: 'internship',
    summary:
      'Contribute to the development, testing, documentation, and improvement of JD Productions’ digital products and AI-enabled systems.',
    description:
      'This is a supervised internship. Interns do not receive unrestricted production credentials or sole responsibility for critical infrastructure. Compensation, schedule, duration, and start date have not been set.',
    responsibilities: [
      'Assist with bounded software development tasks.',
      'Support frontend or backend improvements.',
      'Write and maintain technical documentation.',
      'Help test applications and integrations.',
      'Investigate bugs and report findings.',
      'Support development tooling and automated tests.',
      'Participate in supervised engineering reviews.'
    ].join('\n'),
    qualifications: [
      'Foundational programming knowledge.',
      'Familiarity with modern web technologies or application development.',
      'Interest in AI and intelligent systems.',
      'Basic understanding of version control.',
      'Strong problem-solving ability.'
    ].join('\n'),
    learningOutcomes: [
      'Software development workflows.',
      'AI integration fundamentals.',
      'Testing.',
      'Documentation.',
      'Code review.',
      'Secure engineering practices.'
    ].join('\n'),
    timingNote: 'A start date has not been set. You may apply before a final start date is established.'
  }),
  role({
    id: '00000000-0000-4000-8000-000000000203',
    slug: 'operations-venture-development-intern',
    title: 'Operations & Venture Development Intern',
    departmentName: 'Operations & Corporate Development',
    opportunityType: 'internship',
    employmentType: 'internship',
    summary:
      'Support the establishment of JD Productions’ internal operating processes and venture-development infrastructure.',
    description:
      'The intern does not independently make corporate governance, legal, or financial decisions. Compensation, schedule, duration, and start date have not been set.',
    responsibilities: [
      'Assist with project documentation.',
      'Organize operational workflows.',
      'Research venture-development requirements.',
      'Maintain project trackers.',
      'Support internal reporting.',
      'Assist with process improvement.',
      'Prepare research summaries and operational materials.'
    ].join('\n'),
    qualifications: [
      'Interest in entrepreneurship, operations, or management.',
      'Strong organization and research skills.',
      'Ability to work with structured information.',
      'Familiarity with project-management tools.',
      'Attention to detail.'
    ].join('\n'),
    learningOutcomes: [
      'Business operations.',
      'Project coordination.',
      'Venture planning.',
      'Process development.',
      'Institutional documentation.'
    ].join('\n'),
    timingNote: 'A start date has not been set. You may apply before a final start date is established.'
  }),
  role({
    id: '00000000-0000-4000-8000-000000000204',
    slug: 'communications-digital-media-intern',
    title: 'Communications & Digital Media Intern',
    departmentName: 'Communications & Media',
    opportunityType: 'internship',
    employmentType: 'internship',
    summary:
      'Support JD Productions’ public communications, creative production, brand documentation, and digital publishing activities.',
    description:
      'Interns do not have unilateral authority to publish official corporate statements. Compensation, schedule, duration, and start date have not been set.',
    responsibilities: [
      'Assist with content planning.',
      'Support digital media production.',
      'Organize creative assets.',
      'Prepare draft copy and visual materials.',
      'Support website content updates.',
      'Research communication trends.',
      'Assist with editorial and publishing workflows.'
    ].join('\n'),
    qualifications: [
      'Interest in communications, media, design, or creative production.',
      'Strong writing or visual communication skills.',
      'Familiarity with creative software.',
      'Organizational ability.',
      'Willingness to receive editorial feedback.'
    ].join('\n'),
    learningOutcomes: [
      'Corporate communications.',
      'Creative production.',
      'Editorial processes.',
      'Brand management.',
      'Digital publishing.'
    ].join('\n'),
    timingNote: 'A start date has not been set. You may apply before a final start date is established.'
  }),
  role({
    id: '00000000-0000-4000-8000-000000000211',
    slug: 'founding-software-engineer',
    title: 'Founding Software Engineer',
    departmentName: 'Technology & Intelligence',
    opportunityType: 'upcoming',
    employmentType: 'to_be_confirmed',
    unresolvedTerms: ['compensation', 'start_date', 'work_arrangement', 'employment_classification', 'schedule'],
    summary: 'Help build, integrate, maintain, and improve JD Productions’ core software infrastructure and digital products.',
    description:
      'This is a professional engineering position, not an internship. Hiring timing, compensation, location, and employment classification have not been set. Early applications are open while those terms are developed.',
    responsibilities: [
      'Develop production software.',
      'Design maintainable application architecture.',
      'Implement secure APIs and integrations.',
      'Improve testing and reliability.',
      'Collaborate on AI-enabled products.',
      'Maintain technical documentation.',
      'Support deployment and operational stability.'
    ].join('\n'),
    qualifications: [
      'Demonstrated software engineering capability.',
      'Experience with modern application architecture.',
      'API and database experience.',
      'Security awareness.',
      'Ability to work in an early-stage environment.'
    ].join('\n'),
    learningOutcomes: '',
    timingNote:
      "We're accepting early applications as we develop this team. Hiring timelines have not yet been established."
  }),
  role({
    id: '00000000-0000-4000-8000-000000000212',
    slug: 'ai-systems-automation-engineer',
    title: 'AI Systems & Automation Engineer',
    departmentName: 'Technology & Intelligence',
    opportunityType: 'upcoming',
    employmentType: 'to_be_confirmed',
    unresolvedTerms: ['compensation', 'start_date', 'work_arrangement', 'employment_classification', 'schedule'],
    summary:
      'Develop AI integrations, agent workflows, orchestration systems, and practical automation supporting JD’s digital ecosystem.',
    description:
      'Experimental systems are not described here as fully operational products. Hiring timing, compensation, location, and employment classification have not been set.',
    responsibilities: [
      'Build AI-assisted workflows.',
      'Integrate model providers and tools.',
      'Develop agent orchestration capabilities.',
      'Evaluate system performance and reliability.',
      'Implement observability and safeguards.',
      'Support internal and product-facing automation.'
    ].join('\n'),
    qualifications: [
      'Software engineering experience.',
      'Familiarity with LLM APIs and tool integrations.',
      'Understanding of data handling and security.',
      'Experience evaluating automated workflows.',
      'Strong debugging skills.'
    ].join('\n'),
    learningOutcomes: '',
    timingNote:
      "We're accepting early applications as we develop this team. Hiring timelines have not yet been established."
  }),
  role({
    id: '00000000-0000-4000-8000-000000000213',
    slug: 'business-development-partnerships-associate',
    title: 'Business Development & Partnerships Associate',
    departmentName: 'Business Development & Partnerships',
    opportunityType: 'upcoming',
    employmentType: 'to_be_confirmed',
    unresolvedTerms: ['compensation', 'start_date', 'work_arrangement', 'employment_classification', 'schedule'],
    summary: 'Help JD Productions develop its commercial pipeline, identify customers, and establish strategic business relationships.',
    description:
      'Compensation, including any commission arrangement, has not been approved and is not stated. Hiring timing, location, and employment classification have not been set.',
    responsibilities: [
      'Research and qualify prospects.',
      'Support outreach.',
      'Manage CRM records.',
      'Coordinate business development activities.',
      'Prepare proposals.',
      'Support partnership discussions.',
      'Track pipeline activity and opportunities.'
    ].join('\n'),
    qualifications: [
      'Communication skills.',
      'Commercial research capability.',
      'Familiarity with sales or partnership workflows.',
      'Professional organization.',
      'Interest in emerging technology and business development.'
    ].join('\n'),
    learningOutcomes: '',
    timingNote:
      "We're accepting early applications as we develop this team. Hiring timelines have not yet been established."
  }),
  role({
    id: '00000000-0000-4000-8000-000000000214',
    slug: 'operations-project-coordinator',
    title: 'Operations & Project Coordinator',
    departmentName: 'Operations & Corporate Development',
    opportunityType: 'upcoming',
    employmentType: 'to_be_confirmed',
    unresolvedTerms: ['compensation', 'start_date', 'work_arrangement', 'employment_classification', 'schedule'],
    summary: 'Help establish reliable operating processes and coordinate projects across the corporation.',
    description: 'Hiring timing, compensation, location, and employment classification have not been set.',
    responsibilities: [
      'Maintain project plans and timelines.',
      'Organize documentation.',
      'Coordinate deliverables.',
      'Track operational requirements.',
      'Support vendor and contractor coordination.',
      'Improve administrative processes.',
      'Prepare operational reports.'
    ].join('\n'),
    qualifications: [
      'Project coordination experience.',
      'Strong organizational skills.',
      'Familiarity with productivity and project-management tools.',
      'Ability to manage multiple workstreams.',
      'Attention to detail.'
    ].join('\n'),
    learningOutcomes: '',
    timingNote:
      "We're accepting early applications as we develop this team. Hiring timelines have not yet been established."
  }),
  role({
    id: '00000000-0000-4000-8000-000000000215',
    slug: 'finance-business-operations-associate',
    title: 'Finance & Business Operations Associate',
    departmentName: 'Finance & Economic Systems',
    opportunityType: 'upcoming',
    employmentType: 'to_be_confirmed',
    unresolvedTerms: ['compensation', 'start_date', 'work_arrangement', 'employment_classification', 'schedule'],
    summary: 'Support financial administration, budgeting, reporting, and operational controls as JD Productions expands.',
    description:
      'This role does not replace qualified accounting, legal, compliance, or financial oversight. Hiring timing, compensation, location, and employment classification have not been set.',
    responsibilities: [
      'Organize financial records.',
      'Support budgeting and cash-flow tracking.',
      'Assist with financial reporting.',
      'Coordinate approved administrative processes.',
      'Maintain expense and vendor records.',
      'Support financial process documentation.',
      'Work with authorized accounting and financial professionals.'
    ].join('\n'),
    qualifications: [
      'Accounting, finance, or business operations knowledge.',
      'Strong spreadsheet skills.',
      'Accuracy and confidentiality.',
      'Familiarity with financial reporting concepts.',
      'Understanding of basic internal controls.'
    ].join('\n'),
    learningOutcomes: '',
    timingNote:
      "We're accepting early applications as we develop this team. Hiring timelines have not yet been established."
  }),
  role({
    id: '00000000-0000-4000-8000-000000000216',
    slug: 'communications-brand-production-specialist',
    title: 'Communications & Brand Production Specialist',
    departmentName: 'Communications & Media',
    opportunityType: 'upcoming',
    employmentType: 'to_be_confirmed',
    unresolvedTerms: ['compensation', 'start_date', 'work_arrangement', 'employment_classification', 'schedule'],
    summary: 'Help develop and execute JD Productions’ communications, content, and brand-production workflows.',
    description: 'Hiring timing, compensation, location, and employment classification have not been set.',
    responsibilities: [
      'Coordinate content production.',
      'Prepare communications materials.',
      'Maintain brand consistency.',
      'Support digital publishing.',
      'Manage creative assets.',
      'Develop editorial schedules.',
      'Assist with corporate announcements and campaigns.'
    ].join('\n'),
    qualifications: [
      'Communications or production experience.',
      'Writing and editing ability.',
      'Familiarity with digital media tools.',
      'Project organization.',
      'Understanding of brand communication.'
    ].join('\n'),
    learningOutcomes: '',
    timingNote:
      "We're accepting early applications as we develop this team. Hiring timelines have not yet been established."
  }),
  role({
    id: '00000000-0000-4000-8000-000000000221',
    slug: 'general-application',
    title: 'General Application',
    opportunityType: 'talent_community',
    employmentType: 'to_be_confirmed',
    unresolvedTerms: [],
    summary:
      'Share your experience and the kind of work you would like to contribute. This is a general application, not a claim that a specific role is open.',
    description:
      'JD Productions is founder-led and is developing its workforce across technology, production, infrastructure, and later industrial ambitions. Advanced industries — mechanical and electrical engineering, robotics, embedded systems, manufacturing, autonomous systems, mobility, aerospace, and research — are areas of interest, not operational departments with open technical seats. Select the areas you want to be considered for. This does not subscribe you to marketing.',
    responsibilities: '',
    qualifications: '',
    learningOutcomes: '',
    timingNote: 'There is no hiring date attached to this general application.',
    instructions:
      'Tell us what you do and where you want to contribute. Submitting this form is not an offer of employment.',
    questions: [
      {
        prompt: 'Areas of interest',
        fieldType: 'multi_select',
        required: true,
        options: INTERESTS
      },
      {
        prompt: 'You may contact me about future roles at JD Productions.',
        fieldType: 'boolean',
        required: false,
        consentPurpose: 'future_recruitment'
      },
      {
        prompt: 'Relevant experience',
        fieldType: 'longtext',
        required: false
      }
    ]
  })
];

export const INTEREST_CATEGORIES = INTERESTS;
