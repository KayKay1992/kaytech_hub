// Static placeholder catalog — will be replaced with real Course documents
// once the Academy module (courses, cohorts, enrollment) is built. Every
// course bundles AI skills, hence the Circuit Teal "<AI_SKILLS/>" tag.
const SAMPLE_COURSES = [
  {
    slug: 'web-development-fundamentals',
    title: 'Web Development Fundamentals',
    level: 'Beginner',
    summary: 'HTML, CSS, JavaScript, and React — build and ship real interfaces from day one.',
    syllabus: [
      'Semantic HTML & modern CSS layout',
      'JavaScript fundamentals & the DOM',
      'React components, state, and routing',
      'Deploying a portfolio project',
    ],
  },
  {
    slug: 'data-analysis-with-python',
    title: 'Data Analysis with Python',
    level: 'Intermediate',
    summary: 'Clean, analyze, and visualize real datasets using Python, Pandas, and SQL.',
    syllabus: [
      'Python fundamentals for data work',
      'Pandas for cleaning & transforming data',
      'SQL for querying real datasets',
      'Visualization & a capstone analysis',
    ],
  },
  {
    slug: 'product-management-bootcamp',
    title: 'Product Management Bootcamp',
    level: 'Beginner',
    summary: 'Go from idea to shipped feature — discovery, prioritization, and working with engineers.',
    syllabus: [
      'Product discovery & user research',
      'Writing specs and prioritizing a roadmap',
      'Working with design & engineering',
      'Shipping and measuring a feature',
    ],
  },
];

export default SAMPLE_COURSES;
