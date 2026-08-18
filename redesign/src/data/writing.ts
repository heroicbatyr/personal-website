export type Post = { slug: string; category: string; title: string; excerpt: string; date: string; readTime: string; body: string[]; };

export const posts: Post[] = [
  {
    slug: 'market-research-space', category: 'Project notes', date: 'Coming soon', readTime: '4 min read',
    title: 'Building a personal space for better market research',
    excerpt: 'Notes on making public market data useful without turning it into another noisy dashboard.',
    body: ['This is a placeholder for a project note about Market Atlas. The finished post will document what I want to learn from the project, the choices behind its data model, and how I want the interface to stay useful rather than busy.', 'The important part is not a chart for every possible metric. It is making it easy to ask a clear question, compare a few things, and understand what changed.']
  },
  {
    slug: 'useful-software', category: 'Thoughts', date: 'Coming soon', readTime: '3 min read',
    title: 'What operational work has taught me about useful software',
    excerpt: 'The best internal tools often make a workflow calmer before they make it more impressive.',
    body: ['This is a placeholder for a reflection on practical automation and work that supports people. It will become a home for the lessons I take from real operating environments.', 'Good software earns trust through small details: the task is clear, the next step is obvious, and the system does not create extra work for the person using it.']
  },
  {
    slug: 'owning-infrastructure', category: 'Home lab', date: 'Coming soon', readTime: '5 min read',
    title: 'The quiet satisfaction of owning your own infrastructure',
    excerpt: 'A future note on self-hosting, Docker services, privacy, and learning by running things yourself.',
    body: ['This placeholder will become a home-lab project note, including photos of the actual setup and a useful overview of the services that run on it.', 'I am interested in self-hosting less as a performance and more as a way to understand the systems I rely on every day.']
  }
];
