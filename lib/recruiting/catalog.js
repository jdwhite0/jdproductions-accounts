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
    description: `JD Productions is opening a Business Development & Partnerships internship for someone who wants to learn how a founder-led company studies markets, finds possible customers, and builds the first usable version of a commercial practice.\n\nYou will research companies and institutions that could use JD’s technology and production work, keep the outreach record in order, and help turn raw notes into proposals and briefings a founder can use. The day-to-day work is commercial research, lead qualification, partnership tracking, and the documents that support an early business conversation. You will be expected to write clearly, follow a thread through more than one conversation, and leave a record the next person can trust.\n\nThis is a supervised internship. The intern is not the corporation’s independent sales executive. You do not close agreements, set commercial terms, or speak for the company without review. The value of the role is the quality of the research and the discipline of the pipeline, not a title that implies you are the sales organization.`,
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
    description: `JD Productions is opening a Software Engineering & AI Systems internship for someone who can contribute to software that is already in use and to AI-enabled work that is still being built with care.\n\nYou will take bounded engineering tasks on JD’s digital products. JYSON, ACCESS, and JD AI OS are operating. Kimah is in private beta. Where a task is appropriate for an intern, you will write code, tests, and documentation, and you will report bugs with enough detail that someone else can reproduce them. Experimental systems are not treated in this posting as finished products, and you will not be asked to describe them that way.\n\nThis is a supervised internship. Interns do not receive unrestricted production credentials or sole responsibility for critical infrastructure. You will not be the only person who can deploy, grant access, or change a system the company depends on. Review, limited access, and a defined task are part of the role.`,
    responsibilities: lines([
      'Assist with bounded software development tasks that have a defined scope, a reviewer, and a way to tell when the work is done.',
      'Support frontend or backend improvements on existing applications, following the patterns already in the codebase.',
      'Write and maintain technical documentation that another engineer can use without a meeting.',
      'Help test applications and integrations, including the cases that fail, not only the path that works.',
      'Investigate bugs, record what you observed, and separate a confirmed defect from a guess.',
      'Support development tooling and automated tests so the next change is easier to check.',
      'Participate in supervised engineering reviews and revise your work from the notes you receive.'
    ]),
    qualifications: lines([
      'You have foundational programming knowledge you can demonstrate with a project, coursework, or a repository.',
      'You are familiar with modern web technologies or application development.',
      'You are interested in AI and intelligent systems, and you can say when a system is unfinished.',
      'You understand version control well enough to submit a change for review.',
      'You can narrow a failure, write down what you tried, and ask for help with the evidence in front of you.'
    ]),
    learningOutcomes: lines([
      'You will work inside a real software development workflow, from a scoped task through review.',
      'You will learn how an AI capability is integrated into a product without treating an experiment as a finished system.',
      'You will practice testing and documentation as part of the work, not as an afterthought.',
      'You will take part in code review and learn how to respond to it.',
      'You will learn secure engineering habits for an intern: least privilege, no shared secrets, and no sole control of production systems.'
    ]),
    timingNote: null
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
    description: `JD Productions is opening an Operations & Venture Development internship for someone who wants to learn how a founder-led company turns scattered work into a process another person can follow.\n\nYou will help document projects, organize the workflows the company actually uses, and research what a new venture effort needs before anyone treats it as a plan. The work is institutional: trackers, research summaries, internal reporting, and the written steps that keep a project from living only in someone’s memory. Cinema production has been part of JD since 2014, and the operating record has to be able to hold both production work and newer technology ventures without mixing them up.\n\nThe intern does not independently make corporate governance, legal, or financial decisions. You prepare the material, keep it accurate, and hand it to the person who is authorized to decide. You do not sign, approve, or represent a decision as your own.`,
    responsibilities: lines([
      'Assist with project documentation so a scope, a decision, and an open question can be found later.',
      'Organize operational workflows and write them down in the order the work actually happens.',
      'Research venture-development requirements and summarize what is known, what is missing, and what would have to be true next.',
      'Maintain project trackers so status is current and a stale item is visible as stale.',
      'Support internal reporting by assembling the facts, not by inventing a conclusion.',
      'Assist with process improvement by noticing where a step is repeated, skipped, or unclear.',
      'Prepare research summaries and operational materials that a founder can read without a briefing.'
    ]),
    qualifications: lines([
      'You are interested in entrepreneurship, operations, or management, and you can point to a project where you kept the work organized.',
      'You research carefully and you write in complete statements rather than fragments.',
      'You can work with structured information: lists, dates of record, owners, and status.',
      'You are familiar with project-management tools, or you can learn one without turning the tool into the work.',
      'You notice inconsistencies and you correct the record instead of working around it.'
    ]),
    learningOutcomes: lines([
      'You will learn how business operations are written down so they survive a handoff.',
      'You will practice project coordination: scope, status, dependencies, and a record of what changed.',
      'You will see how venture planning is researched before it is treated as a commitment.',
      'You will help develop a process and learn the difference between a note and a procedure.',
      'You will produce institutional documentation that another person can use without you in the room.'
    ]),
    timingNote: null
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
    description: `JD Productions is opening a Communications & Digital Media internship for someone who can support public communications while the company’s communications practice is still being built.\n\nJD has produced cinema since 2014. The communications work now includes the corporate site, product narrative, and the materials that explain what the company is actually making. You will help plan content, organize creative assets, prepare draft copy and visual material, and support publishing workflows. The work is editorial. A draft is not a publication, and a social post is not an official statement until it has been reviewed.\n\nInterns do not have unilateral authority to publish official corporate statements. You prepare, organize, and revise. You do not speak for JD Productions, post in the company’s name, or release a statement on your own.`,
    responsibilities: lines([
      'Assist with content planning by turning a subject into a draft outline, a source list, and a proposed sequence.',
      'Support digital media production on materials that have a defined use, such as a page, a post, or a product explanation.',
      'Organize creative assets so a file can be found, named, and reused without asking who last touched it.',
      'Prepare draft copy and visual materials and mark them as drafts until they have been reviewed.',
      'Support website content updates by preparing the change, not by publishing it yourself.',
      'Research communication practices that are relevant to a founder-led technology and production company, and write down what applies.',
      'Assist with editorial and publishing workflows, including versions, review notes, and a clear record of what went out.'
    ]),
    qualifications: lines([
      'You are interested in communications, media, design, or creative production, and you can show work you made.',
      'You write clearly, or you have a visual practice you can explain in words.',
      'You are familiar with creative software well enough to prepare a draft asset.',
      'You can keep files, versions, and feedback in order.',
      'You are willing to receive editorial feedback and revise the work rather than defend the first draft.'
    ]),
    learningOutcomes: lines([
      'You will learn how corporate communications are prepared, reviewed, and kept distinct from a personal post.',
      'You will practice creative production inside a real publishing workflow.',
      'You will learn an editorial process: draft, notes, revision, and a decision that is not yours to make alone.',
      'You will see how brand material stays consistent when more than one person touches it.',
      'You will learn digital publishing as a controlled handoff, not as a button you press because the file looks finished.'
    ]),
    timingNote: null
  }),
  role({
    id: '00000000-0000-4000-8000-000000000211',
    slug: 'founding-software-engineer',
    title: 'Founding Software Engineer',
    departmentName: 'Technology & Intelligence',
    opportunityType: 'active',
    employmentType: 'to_be_confirmed',
    unresolvedTerms: ['compensation', 'start_date', 'work_arrangement', 'employment_classification', 'schedule'],
    summary: 'Help build, integrate, maintain, and improve JD Productions’ core software infrastructure and digital products.',
    description: `JD Productions is hiring a Founding Software Engineer to help build, integrate, maintain, and improve the company’s core software and digital products. This is a professional engineering position, not an internship. The company is founder-led, and the person in this role is expected to own substantial pieces of the software rather than wait for a large engineering organization that does not exist.\n\nThe current software includes JYSON, ACCESS, and JD AI OS, which are operating, and Kimah, which is in private beta. You will design application structure that another engineer can maintain, implement APIs and integrations with care about what they are allowed to touch, and keep deployment, tests, and documentation in a state the company can continue. Where an AI-enabled feature is part of a product, you will build it as software: defined inputs, failure cases, and a way to tell whether it is working. You will not describe an experiment as a finished system.\n\nThe work is production engineering. You will be asked to make the codebase clearer than you found it, to write down decisions that would otherwise stay in one person’s head, and to treat reliability as part of the feature. People can apply now. Hiring happens when JD decides a person is the right fit for the work.`,
    responsibilities: lines([
      'Develop production software for JD’s digital products, from a defined change through review and release.',
      'Design application architecture that stays maintainable as more than one product has to live in the same company.',
      'Implement APIs and integrations with explicit boundaries, authentication, and a record of what each integration is allowed to do.',
      'Improve testing and reliability so a failure is reproducible and a release is not a guess.',
      'Collaborate on AI-enabled product work where it belongs in the software, and keep experimental behavior labeled as experimental.',
      'Maintain technical documentation that covers how a system is run, how it fails, and how a change is supposed to be made.',
      'Support deployment and operational stability, including the steps required to roll a change forward or back.'
    ]),
    qualifications: lines([
      'You have demonstrated software engineering capability: software you built, shipped, or maintained, and that you can walk through in detail.',
      'You have worked with modern application architecture and can explain why a boundary exists.',
      'You have built or maintained APIs and databases, including the uninteresting parts: migrations, errors, and access control.',
      'You treat security as part of the design, not as a checklist added after the feature works.',
      'You can work in an early-stage, founder-led environment, where the next system is not already staffed and the written record matters.'
    ]),
    learningOutcomes: '',
    timingNote: null
  }),
  role({
    id: '00000000-0000-4000-8000-000000000212',
    slug: 'ai-systems-automation-engineer',
    title: 'AI Systems & Automation Engineer',
    departmentName: 'Technology & Intelligence',
    opportunityType: 'active',
    employmentType: 'to_be_confirmed',
    unresolvedTerms: ['compensation', 'start_date', 'work_arrangement', 'employment_classification', 'schedule'],
    summary:
      'Develop AI integrations, agent workflows, orchestration systems, and practical automation supporting JD’s digital ecosystem.',
    description: `JD Productions is hiring an AI Systems & Automation Engineer to develop AI integrations, agent workflows, orchestration, and practical automation for the company’s digital products.\n\nJYSON, ACCESS, and JD AI OS are operating products. Kimah is in private beta. Some of the AI work is still experimental. Experimental systems are not described here as fully operational products, and this role does not exist to pretend otherwise. The job is to connect models and tools to real workflows, to see whether those workflows hold up, and to put safeguards and observability around them before anyone depends on them.\n\nYou will build automations that a person can inspect: what went in, what the system did, what it was allowed to do, and what happened when it failed. You will evaluate reliability instead of collecting demos. You will work with the software already in the company, and you will keep a clear line between a capability that is in use and a capability that is still a trial.\n\nThis is a professional engineering role at a founder-led company. The person in it is expected to implement the systems, document their limits, and leave an operator able to tell when an automation should be stopped.`,
    responsibilities: lines([
      'Build AI-assisted workflows that have a defined task, a visible result, and a way to stop or correct the run.',
      'Integrate model providers and tools with explicit credentials, limits, and a record of which system is allowed to call which service.',
      'Develop agent orchestration for work the company actually does, and keep each agent’s authority narrower than the person who reviews it.',
      'Evaluate performance and reliability with cases that include bad input, partial failure, and a result a person would reject.',
      'Implement observability and safeguards so a run can be traced and a dangerous or useless action can be blocked.',
      'Support internal and product-facing automation without describing an experiment as a product that is already in operation.'
    ]),
    qualifications: lines([
      'You have software engineering experience and you can show systems you built, not only prompts you tried.',
      'You are familiar with language-model APIs and with tool integrations, including timeouts, retries, and bad responses.',
      'You understand data handling and security well enough to say what an automation should never see.',
      'You have evaluated an automated workflow against a standard, rather than judging it by a single successful example.',
      'You debug methodically, and you can explain a failure from the trace instead of from the last thing the model said.'
    ]),
    learningOutcomes: '',
    timingNote: null
  }),
  role({
    id: '00000000-0000-4000-8000-000000000213',
    slug: 'business-development-partnerships-associate',
    title: 'Business Development & Partnerships Associate',
    departmentName: 'Business Development & Partnerships',
    opportunityType: 'active',
    employmentType: 'to_be_confirmed',
    unresolvedTerms: ['compensation', 'start_date', 'work_arrangement', 'employment_classification', 'schedule'],
    summary: 'Help JD Productions develop its commercial pipeline, identify customers, and establish strategic business relationships.',
    description: `JD Productions is hiring a Business Development & Partnerships Associate to help develop the commercial pipeline, identify customers, and establish business relationships the company can actually pursue.\n\nThe company builds and operates software, including JYSON, ACCESS, and JD AI OS, and it has produced cinema since 2014. Communications and mobility are in build. The associate’s job is to learn those lines of work well enough to research the right prospects, keep a disciplined pipeline, and prepare the material a founder needs before a conversation becomes a proposal. This is not a role that invents a market the company is not in, and it is not a role that speaks for JD without review.\n\nYou will qualify prospects, keep the customer record current, coordinate the steps of an outreach effort, and draft proposals that say what JD can do now. You will track what was promised in a conversation against what the company can deliver. Partnership discussions are prepared and documented. They are not closed by this role alone.\n\nThis is a professional position at a founder-led company. People can apply now. The associate is expected to build the commercial practice, not to act as an unsupervised sales executive.`,
    responsibilities: lines([
      'Research and qualify prospects against the work JD actually does, and write down why a name belongs in the pipeline or does not.',
      'Support outreach with accurate material, a clear next step, and a record of what was said.',
      'Manage customer and partnership records so a relationship is not trapped in one inbox.',
      'Coordinate business-development activity across research, outreach, proposals, and follow-up.',
      'Prepare proposals that describe the work, the boundary of the work, and the open questions, and submit them for review before they go out.',
      'Support partnership discussions by assembling the brief, the history, and the decision that is being asked for.',
      'Track pipeline activity so the company can see what is active, what is stalled, and what was declined.'
    ]),
    qualifications: lines([
      'You communicate in writing with enough precision that a founder can send the paragraph you drafted.',
      'You can research a company, a market, or a partnership and separate a useful fact from a slogan.',
      'You are familiar with sales or partnership workflows, including qualification and a pipeline that is allowed to say no.',
      'You keep commitments, files, and follow-ups organized without being asked twice.',
      'You are interested in technology and business development, and you are willing to learn JD’s products before you describe them to anyone else.'
    ]),
    learningOutcomes: '',
    timingNote: null
  }),
  role({
    id: '00000000-0000-4000-8000-000000000214',
    slug: 'operations-project-coordinator',
    title: 'Operations & Project Coordinator',
    departmentName: 'Operations & Corporate Development',
    opportunityType: 'active',
    employmentType: 'to_be_confirmed',
    unresolvedTerms: ['compensation', 'start_date', 'work_arrangement', 'employment_classification', 'schedule'],
    summary: 'Help establish reliable operating processes and coordinate projects across the corporation.',
    description: `JD Productions is hiring an Operations & Project Coordinator to help establish operating processes and keep projects coordinated as the company takes on more than one line of work.\n\nThe company is founder-led. Cinema production has been part of JD since 2014. Software products are operating, and other lines of work are still being built. The coordinator’s job is to make that work legible: plans, owners, documents, deliverables, and a status that matches reality. You will not be hired to invent process for its own sake. You will be hired to keep a project from depending on memory.\n\nYou will maintain plans, organize the record, coordinate deliverables across the people involved, and prepare operational reports a founder can use. Vendor and contractor coordination is part of the work when a project uses outside help. You track what was asked, what was delivered, and what is still open. You improve an administrative process when the current one drops information.\n\nThis is a professional operations role. The coordinator prepares and tracks. Decisions that belong to the company stay with the person authorized to make them.`,
    responsibilities: lines([
      'Maintain project plans and keep the sequence of work current when a date, an owner, or a dependency changes.',
      'Organize documentation so a scope, a decision, and a deliverable can be found by someone who was not in the meeting.',
      'Coordinate deliverables across the people responsible for them, and surface a miss before it becomes a surprise.',
      'Track operational requirements and distinguish a requirement that is known from one that has only been mentioned.',
      'Support vendor and contractor coordination, including the scope that was agreed and the material that came back.',
      'Improve administrative processes where a step is repeated, skipped, or stored in a place no one else can use.',
      'Prepare operational reports that state status, blockers, and what needs a decision.'
    ]),
    qualifications: lines([
      'You have coordinated projects and you can describe how you kept scope, status, and follow-ups visible.',
      'You are organized in a way other people can use, not only in a system that makes sense to you.',
      'You are familiar with productivity and project-management tools and you do not confuse the tool with the plan.',
      'You can keep more than one workstream current without letting the quiet one go stale.',
      'You notice detail that changes the status of a project, and you correct the record.'
    ]),
    learningOutcomes: '',
    timingNote: null
  }),
  role({
    id: '00000000-0000-4000-8000-000000000215',
    slug: 'finance-business-operations-associate',
    title: 'Finance & Business Operations Associate',
    departmentName: 'Finance & Economic Systems',
    opportunityType: 'active',
    employmentType: 'to_be_confirmed',
    unresolvedTerms: ['compensation', 'start_date', 'work_arrangement', 'employment_classification', 'schedule'],
    summary: 'Support financial administration, budgeting, reporting, and operational controls as JD Productions expands.',
    description: `JD Productions is hiring a Finance & Business Operations Associate to support financial administration, budgeting, reporting, and the operational controls the company needs as its work expands.\n\nThis role does not replace qualified accounting, legal, compliance, or financial oversight. You organize records, support the people who are authorized to account for the company, and keep the administrative process accurate enough that a professional can rely on it. You do not sign off on financial statements, give legal advice, or present an internal spreadsheet as an audit.\n\nThe work includes the ordinary record of a company that is still founder-led and is taking on more activity: expenses, vendors, budgets, cash-flow tracking, and the documents that explain a number. You will help prepare reports, keep vendor and expense files complete, and write down the steps of a financial process so it can be repeated. When a question belongs to an accountant, counsel, or another authorized professional, you route it there with the file in order.\n\nPeople can apply now. The associate is expected to be careful, confidential, and precise about the difference between a record and a conclusion.`,
    responsibilities: lines([
      'Organize financial records so a transaction, a vendor, and a supporting document can be found together.',
      'Support budgeting and cash-flow tracking with figures that trace back to a source.',
      'Assist with financial reporting by preparing schedules and reconciliations for review by an authorized person.',
      'Coordinate administrative processes that have already been approved, and stop when a step requires an approval you do not have.',
      'Maintain expense and vendor records, including what was purchased, from whom, and which document supports it.',
      'Support documentation of financial processes so the steps, the owner, and the review are written down.',
      'Work with authorized accounting and financial professionals, and hand them a file that is complete rather than a question that is missing its attachments.'
    ]),
    qualifications: lines([
      'You have knowledge of accounting, finance, or business operations that you can apply to a real set of records.',
      'You are strong in spreadsheets and you can show how a figure was calculated.',
      'You handle confidential information accurately and you do not treat a draft number as a public statement.',
      'You are familiar with the basic ideas of financial reporting and you know which conclusions you are not qualified to make.',
      'You understand basic internal controls: separation between a record and an approval, and a document for the transaction.'
    ]),
    learningOutcomes: '',
    timingNote: null
  }),
  role({
    id: '00000000-0000-4000-8000-000000000216',
    slug: 'communications-brand-production-specialist',
    title: 'Communications & Brand Production Specialist',
    departmentName: 'Communications & Media',
    opportunityType: 'active',
    employmentType: 'to_be_confirmed',
    unresolvedTerms: ['compensation', 'start_date', 'work_arrangement', 'employment_classification', 'schedule'],
    summary: 'Help develop and execute JD Productions’ communications, content, and brand-production workflows.',
    description: `JD Productions is hiring a Communications & Brand Production Specialist to help develop and carry out the company’s communications, content, and brand-production workflows.\n\nJD has produced cinema since 2014. The communications practice itself is in build. The specialist’s job is to make that practice real: a way to plan a piece of communication, produce it, keep the brand consistent, and publish it through a review rather than through impulse. The corporate site, product explanations, and the materials that describe JYSON, ACCESS, JD AI OS, and the rest of the work all have to say what is true. Kimah is in private beta. Mobility is in build. Space is research. The copy has to respect those distinctions.\n\nYou will coordinate production, prepare communications materials, manage creative assets, and keep an editorial schedule that shows what is in draft, what is in review, and what has actually been published. You will assist with announcements and campaigns by preparing them completely. An official statement is not yours to release on your own.\n\nThis is a professional communications role at a founder-led company. The specialist is expected to raise the standard of the work and to leave a workflow the company can repeat.`,
    responsibilities: lines([
      'Coordinate content production from a brief through drafts, review, and a finished file that matches what was approved.',
      'Prepare communications materials that describe JD’s work accurately, including the difference between what is operating, what is in build, and what is research.',
      'Maintain brand consistency across pages, posts, and production materials so the company does not sound like several unrelated projects.',
      'Support digital publishing by preparing the asset, the caption or page, and the review, and by recording what was published.',
      'Manage creative assets so versions are named, sources are kept, and a superseded file is not reused by accident.',
      'Develop editorial schedules that show owners, status, and the sequence of publication.',
      'Assist with corporate announcements and campaigns by assembling the material and routing it for approval before it goes out.'
    ]),
    qualifications: lines([
      'You have communications or production experience and you can show work that shipped, not only concepts.',
      'You write and edit with enough care that a factual error does not survive the draft.',
      'You are familiar with digital media tools and with the handoff between a design file and a published page.',
      'You can organize a production: versions, feedback, assets, and a date the work is actually ready.',
      'You understand brand communication as a record of what the company is, and you will not smooth over a distinction to make a line sound larger.'
    ]),
    learningOutcomes: '',
    timingNote: null
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
    description: `If none of the posted positions matches the work you do, you can still send a general application. JD Productions is founder-led and is building across technology, production, infrastructure, and later industrial ambitions. This form is how we keep a serious record of people who want to contribute. It is not a claim that a specific job is open, and it is not a mailing list.\n\nTell us what you have done and the kind of work you want to do here. Use the interest areas to say where you should be considered. The choices are Technology & AI, Engineering, Business Development, Operations, Finance, Communications & Media, Design & Product, Advanced Industries, Research, and Other. Select every area that is honest. A résumé, a portfolio, and a short account of relevant work are more useful than a general expression of interest with nothing attached.\n\nAdvanced Industries & Research is an interest area on this form. It covers people whose background includes mechanical or electrical engineering, robotics, embedded systems, manufacturing, autonomous systems, mobility, aerospace, or research. It is not a posted technical seat, and it is not a statement that JD is operating an aerospace or manufacturing line. Mobility is in build. Space is research. Communications is in build. Say which of those you mean if you select the area.\n\nYou may allow JD Productions to contact you about a future role. That choice is optional. It does not subscribe you to marketing, and it does not create an account. Submitting this form stores an application for recruitment review. It is not an interview, an offer, or a promise that a role will be created for the background you describe.`,
    responsibilities: '',
    qualifications: '',
    learningOutcomes: '',
    timingNote: null,
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
