
export const PROFILE = {
  name: 'Kalu Abiyu',
  role: 'Fullstack .NET + Angular Developer',
  email: 'kaluabiyu@gmail.com',
  githubUser: 'kaluabiyu-wq',
  cv: '/Kalu-Abiyu-Cv.pdf', 
  photo: '/kalu.JPG', 
};

export const NAV = ['About', 'Projects', 'Skills', 'Education', 'Contact'];

export const FACTS = [
  { icon: '🎓', title: 'BSc Computer Science', a: 'Admas University', b: 'Computer Science · 2022–2026', accent: false },
  { icon: '⚡', title: 'Qiyas Fullstack Program', a: 'Mar 2026 – Sep 2026', b: 'Production-grade .NET + Angular', accent: true },
  { icon: '📍', title: 'Addis Ababa, Ethiopia', a: 'Available for remote · Hybrid · Onsite', b: 'UTC+3 · Open to relocation', accent: false },
];

export interface Project {
  short: string; badge: string; title: string; desc: string; tech: string[];
  role: string; problem: string; decisions: string[];
  challenges?: string[]; 
  results?: string[];    
  demo?: string;         
  image?: string;        
  github: string;       
}
export const PROJECTS: Project[] = [
  {
    short: 'TMS', badge: 'Fullstack', title: 'Training Management System',
    desc: 'Full-stack system for scheduling, tracking, and managing employee training programs with real-time notifications and state-driven UI.',
    tech: ['ASP.NET Core 10', 'Angular 17', 'Clean Architecture', 'CQRS / MediatR', 'SignalR'],
    role: 'Fullstack developer: backend, frontend, and testing',
    problem: 'Organizations need one place to schedule, track, and manage employee training programs, and to tell people as things change.',
    decisions: [
      'Clean Architecture keeps domain rules independent of the UI and the database.',
      'CQRS with MediatR keeps each use case small, separate, and easy to test.',
      'SignalR pushes training updates to users in real time instead of making them refresh.',
    ],
    github: 'https://github.com/kaluabiyu-wq/TmsApi',
  },
  {
    short: 'PMAFS', badge: 'Fullstack', title: 'Pharmacy Medicine Availability Finder',
    desc: 'Helps patients in Addis Ababa locate pharmacies that have a specific medicine in stock right now, with role-specific dashboards for admins, pharmacists, and the public.',
    tech: ['ASP.NET Core', 'Angular', 'Clean Architecture', 'Role-based Auth', 'Geolocation API'],
    role: 'Fullstack developer: backend, frontend, and testing',
    problem: 'Patients in Addis Ababa need to know which pharmacies have a specific medicine in stock right now.',
    decisions: [
      'Role-based authorization gives admins, pharmacists, and the public separate dashboards and permissions.',
      'Clean Architecture separates pharmacy and medicine rules from the delivery layer.',
      'The Geolocation API supports location-based searching.',
    ],
    github: 'https://github.com/kaluabiyu-wq',
  },
  {
    short: 'Mini-Market', badge: 'Mobile', title: 'Mini-Market',
    desc: 'A Flutter mini-market app with structured navigation and predictable BLoC-powered state management across mobile and desktop platforms.',
    tech: ['Flutter', 'Dart', 'BLoC', 'go_router', 'Material Design'],
    role: 'Mobile developer',
    problem: 'A shopping app needs predictable state and clear navigation that behave the same on mobile and desktop.',
    decisions: [
      'BLoC keeps app state predictable and separate from the UI.',
      'go_router gives structured, declarative navigation across platforms.',
      'Material Design components keep the look consistent everywhere.',
    ],
    github: 'https://github.com/kaluabiyu-wq',
  },
];

export const SKILLS = [
  { title: 'Backend', items: ['C# (.NET)', 'ASP.NET Core', 'Entity Framework Core', 'Clean Architecture', 'CQRS / MediatR', 'SignalR', 'JWT Auth', 'REST APIs', 'SQL Server', 'Minimal APIs'] },
  { title: 'Frontend', items: ['Angular', 'TypeScript', 'NgRx SignalStore', 'RxJS', 'HTML / CSS', 'Tailwind CSS', 'Angular Material', 'Reactive Forms'] },
  { title: 'Testing', items: ['Vitest', 'Playwright', 'xUnit', 'Integration Testing', 'E2E Testing'] },
  { title: 'Tools', items: ['Git / GitHub', 'Docker', 'VS Code', 'Visual Studio', 'Postman', 'Azure DevOps', 'Linux CLI'] },
  { title: 'Mobile', items: ['Flutter', 'Dart', 'BLoC', 'go_router'] },
];

export const TIMELINE: { icon: string; kind: string; title: string; date: string; desc: string; link?: string }[] = [
  { icon: '⚡', kind: 'Professional Training', title: 'Qiyas Fullstack Program', date: 'Mar 2026 – Sep 2026',
    desc: 'Hands-on fullstack training program covering production-grade ASP.NET Core, Angular, Clean Architecture, and real project delivery.' },
  { icon: '🎓', kind: 'BSc Degree', title: 'BSc Computer Science', date: 'Admas University · 2022–2026',
    desc: 'Core studies in algorithms, data structures, software engineering, databases, and computer networks.' },
  { icon: '📜', kind: 'Certification · freeCodeCamp', title: 'JavaScript Algorithms and Data Structures', date: 'Oct 19, 2025 · ~300 hours',
    desc: 'Developer certification covering JavaScript fundamentals, algorithms, data structures, and problem solving.',
    link: 'https://freecodecamp.org/certification/fcc04c481c8-0b7a-4447-87d3-dba5778c261b/javascript-algorithms-and-data-structures-v8' },
  { icon: '📜', kind: 'Certification · freeCodeCamp', title: 'Responsive Web Design', date: 'Mar 5, 2024 · ~300 hours',
    desc: 'Developer certification covering HTML, CSS, Flexbox, Grid, and building responsive, accessible layouts.',
    link: 'https://freecodecamp.org/certification/fcc04c481c8-0b7a-4447-87d3-dba5778c261b/responsive-web-design' },
];

export const SOCIALS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/kalu-abiyu/', d: 'M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9.75h4V21H3zM9.5 9.75h3.8v1.6h.06c.53-1 1.82-2.05 3.75-2.05 4 0 4.74 2.64 4.74 6.07V21h-4v-4.93c0-1.18-.02-2.7-1.65-2.7-1.65 0-1.9 1.29-1.9 2.62V21h-4z' },
  { label: 'GitHub', href: 'https://github.com/kaluabiyu-wq', d: 'M12 .5a11.5 11.5 0 00-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 015.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0012 .5z' },
 { label: 'Instagram', href: 'https://instagram.com/Kalu_abi77', d: 'M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3zm5 3.5A4.5 4.5 0 1112 16.5a4.5 4.5 0 010-9zm0 2A2.5 2.5 0 1012 14.5a2.5 2.5 0 000-5zM17.5 6a1 1 0 110 2 1 1 0 010-2z' },
  { label: 'Telegram', href: 'https://t.me/Kalu_abi77', d: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' },
 { label: 'Email', href: 'mailto:kaluabiyu@gmail.com', d: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' },
];

// "What I'm looking for" rows. Edit the values to match your situation.
export const HIRE = [
  { label: 'Role', value: 'Junior Fullstack Developer (.NET + Angular)' },
  { label: 'Work mode', value: 'Remote · Hybrid · Onsite' },
  { label: 'Location', value: 'Addis Ababa, Ethiopia (UTC+3)' },
  { label: 'Relocation', value: 'Open to relocation' },
  { label: 'Availability', value: 'Open to opportunities' },
];
