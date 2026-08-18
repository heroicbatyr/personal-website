export type Project = {
  slug: string;
  number: string;
  title: string;
  type: string;
  description: string;
  tags: string[];
  confidential?: boolean;
  status?: string;
  accent: string;
  challenge: string;
  approach: string;
  outcome: string;
};

export const projects: Project[] = [
  {
    slug: 'signature-proof-automation',
    number: '01',
    title: 'Signature Proof Automation Support',
    type: 'UniCredit · Internal workflow',
    description: 'A structured support tool for a signature-proof process, designed to reduce repetitive handling and make the team’s day-to-day workflow easier to follow.',
    tags: ['Process automation', 'Operations', 'Excel VBA'],
    confidential: true,
    accent: 'ochre',
    challenge: 'A repetitive internal workflow needed a clearer, more reliable path from incoming request to completed proof.',
    approach: 'I mapped the operational steps, isolated the handoffs that created friction, and built a focused support layer around the process. The public version stays deliberately high-level: no internal data, screenshots, or proprietary implementation details are shown.',
    outcome: 'A more consistent process with less manual overhead. The final impact figures and detail will be added once they are cleared for publication.'
  },
  {
    slug: 'task-manager-kpi-statistics',
    number: '02',
    title: 'Task Manager & KPI Statistics',
    type: 'UniCredit · Internal tool',
    description: 'An Excel VBA workflow that brings task coordination and KPI reporting into one practical, team-oriented tool.',
    tags: ['Excel VBA', 'Reporting', 'Data quality'],
    confidential: true,
    accent: 'charcoal',
    challenge: 'Task tracking and reporting were spread across manual steps, which made routine KPI visibility slower than it should be.',
    approach: 'I created a lightweight VBA-based workflow that gives the team one place to structure tasks and generate the information needed for KPI reporting.',
    outcome: 'A more repeatable reporting rhythm and a clearer picture of workload. Metrics and architecture detail will be expanded after review.'
  },
  {
    slug: 'market-atlas',
    number: '03',
    title: 'Market Atlas',
    type: 'Independent project · In progress',
    description: 'A calm, useful way to explore listed companies: price history, comparisons, and the signals behind DAX, S&P 500, and Nasdaq 100 movements.',
    tags: ['Java', 'APIs', 'Data visualization'],
    status: 'In progress',
    accent: 'sage',
    challenge: 'Market data is everywhere, but turning it into a useful personal research view takes more than a chart and a ticker symbol.',
    approach: 'Market Atlas is being shaped as a focused analysis space: real-world data, comparable companies and indices, and small explanatory layers rather than noise.',
    outcome: 'A public case study will document the architecture, data choices, and the finished experience as the project takes shape.'
  },
  {
    slug: 'batyr-ai',
    number: '04',
    title: 'Batyr AI',
    type: 'Personal AI assistant · Coming soon',
    description: 'A small personal AI assistant that can answer questions about my work, interests, and projects—grounded in information I choose to provide.',
    tags: ['LLMs', 'RAG', 'AI agents'],
    status: 'Coming soon',
    accent: 'rose',
    challenge: 'A portfolio should be easy to explore, but people do not always know what question to ask first.',
    approach: 'Batyr AI will use a compact, retrieval-based knowledge layer rather than pretend to be a model trained from scratch. Its job is to make the site easier to navigate and the work easier to understand.',
    outcome: 'The assistant is intentionally not live yet. This page will become its build log when the first version is ready.'
  }
];
