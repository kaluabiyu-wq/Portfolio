import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PROFILE, HIRE, NAV, FACTS, PROJECTS, SKILLS, SKILL_ICONS, TIMELINE, SOCIALS, type Project } from './data';
type Theme = 'light' | 'dark';

/* ---------- hooks ---------- */
function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem('theme') as Theme) || 'light'; } catch { return 'light'; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch { /* storage unavailable */ }
  }, [theme]);
  return [theme, () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))] as const;
}

function useTyped(text: string) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(text.length); return; }
    if (n >= text.length) return;
    const t = setTimeout(() => setN(n + 1), 55);
    return () => clearTimeout(t);
  }, [n, text]);
  return text.slice(0, n);
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState('');
  useEffect(() => {
    const io = new IntersectionObserver(
      es => es.forEach(e => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [ids]);
  return active;
}

interface Repo {
  name: string; description: string | null; language: string | null;
  pushed_at: string; html_url: string; stargazers_count: number;
}

/** Latest non-fork repos from the public GitHub API. Cached for an hour per tab; fails silently. */
function useRecentRepos(user: string) {
  const [repos, setRepos] = useState<Repo[]>([]);
  useEffect(() => {
    const key = `gh-repos:${user}`;
    try {
      const hit = sessionStorage.getItem(key);
      if (hit) {
        const { t, d } = JSON.parse(hit) as { t: number; d: Repo[] };
        if (Date.now() - t < 60 * 60 * 1000) { setRepos(d); return; }
      }
    } catch { /* storage unavailable or corrupt: fall through to fetch */ }
    const ctl = new AbortController();
    fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=12`, {
      signal: ctl.signal, headers: { Accept: 'application/vnd.github+json' },
    })
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<(Repo & { fork: boolean })[]>; })
      .then(all => {
        const top = all.filter(r => !r.fork).slice(0, 6).map(r => ({
          name: r.name, description: r.description, language: r.language,
          pushed_at: r.pushed_at, html_url: r.html_url, stargazers_count: r.stargazers_count,
        }));
        setRepos(top);
        try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: top })); } catch { /* ignore */ }
      })
      .catch(() => { /* rate-limited or offline: the panel simply stays hidden */ });
    return () => ctl.abort();
  }, [user]);
  return repos;
}

function timeAgo(iso: string) {
  const days = (Date.parse(iso) - Date.now()) / 86_400_000;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(days) < 1) return 'today';
  if (Math.abs(days) < 30) return rtf.format(Math.round(days), 'day');
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), 'month');
  return rtf.format(Math.round(days / 365), 'year');
}

/* ---------- components ---------- */
const SECTION_IDS = NAV.map(n => n.toLowerCase());

function Navbar() {
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const active = useActiveSection(SECTION_IDS);
  return (
    <nav>
      <div className="wrap">
        <a href="#home" className="logo"><b>KA</b><span>kalu<em>.dev</em></span></a>
        <div className={`links${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
          {NAV.map(n => (
            <a key={n} href={`#${n.toLowerCase()}`} className={active === n.toLowerCase() ? 'active' : ''} aria-current={active === n.toLowerCase() ? 'true' : undefined}>{n}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a className="resume" href={PROFILE.cv} download>Resume</a>
          <button id="theme" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'dark' ? '☀' : '☾'}</button>
          <button className="menu" onClick={() => setOpen(o => !o)} aria-label="Menu">☰</button>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  const typed = useTyped(PROFILE.role);
  const [first, last] = PROFILE.name.split(' ');
  return (
    <header className="hero" id="home">
      <div className="wrap">
        <div>
          <div className="tag">HELLO, I'M</div>
          <h1>{first} <span className="grad">{last}</span></h1>
          <div className="role"><span>{typed}</span><i /></div>
          <p className="lead">I build real, end-to-end systems — from clean domain models to reactive Angular UIs — and I'm looking for my first junior fullstack role.</p>
          <div className="btns">
            <a className="btn p" href="#projects">View Projects</a>
            <a className="btn g" href="#contact">Contact Me</a>
          </div>
        </div>
        <div className="photo">
          <div className="frame">
            {PROFILE.photo ? <img src={PROFILE.photo} alt={PROFILE.name} /> : 'KA'}
          </div>
          <div className="status">Open to opportunities</div>
        </div>
      </div>
    </header>
  );
}

function About() {
  return (
    <section id="about">
      <div className="wrap about">
        <div>
          <div className="tag">ABOUT</div>
          <h2>Building systems that <span className="grad">work end-to-end.</span></h2>
          <p>I'm a Computer Science student at Admas University and a participant in the Qiyas Fullstack Program — a hands-on training program focused on production-grade .NET and Angular development.</p>
          <p>My focus is on building complete, well-structured systems: clean backend architecture, reactive frontends, proper testing, and real deployment. My major projects go deeper than tutorials — they solve actual problems with real architectural decisions, and one of them was built with a six-person team at the Qiyas Hackathon.</p>
          <p>I'm actively looking for a junior fullstack role where I can contribute to a real product from day one.</p>
        </div>
        <div className="facts">
          {FACTS.map(f => (
            <div className="fact" key={f.title}>
              <div className="ic">{f.icon}</div>
              <div>
                <h4>{f.title}</h4>
                <small className={f.accent ? 'c2' : 'c1'}>{f.a}</small>
                <small>{f.b}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseStudy({ p, onClose }: { p: Project; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  const list = (title: string, items?: string[]) =>
    items && items.length > 0 && (<><h4>{title}</h4><ul>{items.map(i => <li key={i}>{i}</li>)}</ul></>);
  return (
    <dialog ref={ref} className="case" aria-labelledby="case-title" onClose={onClose}
      onClick={e => { if (e.target === ref.current) onClose(); }}>
      <button className="x" onClick={onClose} aria-label="Close case study">✕</button>
      <div className="tag">CASE STUDY · {p.badge}</div>
      <h3 id="case-title">{p.title}</h3>
      <h4>The problem</h4><p>{p.problem}</p>
      <h4>My role</h4><p>{p.role}</p>
      {list('Key decisions', p.decisions)}
      {list('Challenges', p.challenges)}
      {list('Results', p.results)}
      <h4>Stack</h4>
      <div className="chips">{p.tech.map(t => <span key={t}>{t}</span>)}</div>
      <div className="btns">
        {p.demo && <a className="btn p" href={p.demo} target="_blank" rel="noreferrer">Live demo ↗</a>}
        <a className="btn g" href={p.github} target="_blank" rel="noreferrer">Source code ↗</a>
      </div>
    </dialog>
  );
}

function ProjectCard({ p, onOpen }: { p: Project; onOpen: () => void }) {
  return (
    <article className="proj">
      <div className="thumb">
        {p.image ? <img src={p.image} alt={`${p.title} screenshot`} loading="lazy" /> : p.short}
        <span className="badge">{p.badge}</span>
      </div>
      <div className="pbody">
        <h3>{p.title}</h3>
        <p>{p.desc}</p>
        <small className="role-line">{p.role}</small>
        <div className="chips">{p.tech.map(t => <span key={t}>{t}</span>)}</div>
        <div className="prow">
          <button className="btn" onClick={onOpen}>Case study</button>
          {p.demo && <a className="btn o" href={p.demo} target="_blank" rel="noreferrer">Live demo ↗</a>}
          <a className="btn gh" href={p.github} target="_blank" rel="noreferrer" aria-label={`${p.title} source code on GitHub`}>⌥</a>
        </div>
      </div>
    </article>
  );
}

const FILTERS = ['All', 'Fullstack', 'Mobile', 'Team'] as const;
type Filter = (typeof FILTERS)[number];
const matchesFilter = (p: Project, f: Filter) =>
  f === 'All' || (f === 'Team' ? !!p.team : p.badge.includes(f));



function Projects() {
  const [open, setOpen] = useState<Project | null>(null);
  const [filter, setFilter] = useState<Filter>('All');
  const shown = PROJECTS.filter(p => matchesFilter(p, filter));
  return (
    <section id="projects" className="alt">
      <div className="wrap">
        <div className="tag">PROJECTS</div>
        <h2>Real systems, real architecture.</h2>
        <p className="lead">Selected full-stack and cross-platform applications built with thoughtful architecture. Open a case study to see the problem, my role, and the decisions behind each one.</p>
        <div className="filters" role="group" aria-label="Filter projects">
          {FILTERS.map(f => (
            <button key={f} type="button" className={filter === f ? 'on' : ''} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>
          ))}
          <span className="count" role="status">{shown.length} of {PROJECTS.length} projects</span>
        </div>
        <div className="grid3">{shown.map(p => <ProjectCard key={p.title} p={p} onOpen={() => setOpen(p)} />)}</div>
        {open && <CaseStudy p={open} onClose={() => setOpen(null)} />}
        
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section id="skills">
      <div className="wrap">
        <div className="tag">SKILLS</div>
        <h2>The stack I work with.</h2>
        <div className="grid4">
          {SKILLS.map(s => (
            <div className="skill" key={s.title}>
              <h4>{s.title}</h4>
              <div className="badges">
                {s.items.map(name => {
                  const ic = SKILL_ICONS[name];
                  return (
                    <span
                      key={name}
                      className="skill-badge"
                      style={{ background: ic?.bg, color: ic?.text }}
                    >
                      {ic?.d && (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill={ic.icon} aria-hidden="true">
                          <path d={ic.d} />
                        </svg>
                      )}
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Hire() {
  const stats = [
    { n: PROJECTS.length, label: 'Projects built' },
    { n: TIMELINE.filter(t => t.kind.startsWith('Certification')).length, label: 'Certifications earned' },
    { n: new Set(SKILLS.flatMap(s => s.items)).size, label: 'Technologies in my stack' },
  ];
  return (
    <section id="hire" className="alt">
      <div className="wrap hire">
        <div>
          <div className="tag">HIRE ME</div>
          <h2>What I'm looking for.</h2>
          <p className="lead">The quick facts recruiters and hiring managers ask for first.</p>
          <dl className="looking">
            {HIRE.map(h => <div key={h.label}><dt>{h.label}</dt><dd>{h.value}</dd></div>)}
          </dl>
          <div className="btns">
            <a className="btn p" href="#contact">Start a conversation</a>
            <a className="btn g" href={PROFILE.cv} download>Download CV</a>
          </div>
        </div>
        <div className="stats">
          {stats.map(x => <div className="stat" key={x.label}><b>{x.n}</b><span>{x.label}</span></div>)}
        </div>
      </div>
    </section>
  );
}

function Education() {
  return (
    <section id="education">
      <div className="wrap">
        <div className="tag">EDUCATION</div>
        <h2>Background &amp; Training</h2>
        <div className="tl">
          {TIMELINE.map(t => (
            <div className="item" key={t.title}>
              <div className="dot">{t.icon}</div>
              <div>
                <span className="pill">{t.kind}</span>
                <h3>{t.title}</h3>
                <small>{t.date}</small>
                <p>{t.desc}</p>
                {t.link && <a className="vlink" href={t.link} target="_blank" rel="noreferrer">Verify certificate ↗</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', subject: '', body: '' });
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const [sending, setSending] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const valid = f.name.trim() && f.body.trim() && /^\S+@\S+\.\S+$/.test(f.email.trim());
    if (!valid) return setStatus({ ok: false, text: 'Enter your name, a valid email, and a message.' });
    const subject = f.subject.trim() || `Portfolio enquiry from ${f.name}`;
    setSending(true); setStatus(null);
    try {
      // Delivers the message straight to PROFILE.email via FormSubmit (no backend needed).
      const res = await fetch(`https://formsubmit.co/ajax/${PROFILE.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: f.name, email: f.email, _replyto: f.email, _subject: subject, message: f.body, _template: 'table' }),
      });
      if (!res.ok) throw new Error('send failed');
      setF({ name: '', email: '', subject: '', body: '' });
      setStatus({ ok: true, text: 'Message sent. Thank you, I will reply to your email soon.' });
    } catch {
      const body = encodeURIComponent(`${f.body}\n\n— ${f.name} (${f.email})`);
      window.location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent(subject)}&body=${body}`;
      setStatus({ ok: false, text: 'Could not send directly, so your email app is opening instead.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <h3>Send a message</h3>
      <p className="sub">Tell me about the role, project, or idea you have in mind.</p>
      <div className="row">
        <label>Name<input value={f.name} onChange={set('name')} placeholder="Your name" /></label>
        <label>Email<input type="email" value={f.email} onChange={set('email')} placeholder="you@example.com" /></label>
      </div>
      <label>Subject<input value={f.subject} onChange={set('subject')} placeholder="What would you like to discuss?" /></label>
      <label>Message<textarea value={f.body} onChange={set('body')} placeholder="Share a few details..." /></label>
      <button className="btn p" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send Message'}</button>
      <div id="msg" role="status" style={{ color: status?.ok ? 'var(--green)' : 'var(--accent-text)' }}>{status?.text}</div>
    </form>
  );
}

function CopyEmail() {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      window.prompt('Copy my email address:', PROFILE.email);
    }
  };
  return <button type="button" className="btn g" onClick={copy}>{done ? 'Copied ✓' : 'Copy email'}</button>;
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  if (!show) return null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return <button type="button" className="totop" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })}>↑</button>;
}

function Contact() {
  return (
    <section id="contact" className="alt">
      <div className="wrap contact">
        <div>
          <div className="tag">CONTACT</div>
          <h2>Let's build something.</h2>
          <p className="lead">I'm actively looking for junior fullstack roles. If you'd like to see a project walkthrough, discuss an opportunity, or just connect — my inbox is open.</p>
          <div className="btns">
            <a className="btn p" href={`mailto:${PROFILE.email}`}>Send Email</a>
            <CopyEmail />
            <a className="btn g" href={PROFILE.cv} download>Download CV</a>
          </div>
          <div className="socials">
            {SOCIALS.map(s => (
              <a key={s.label} href={s.href} {...(s.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})} aria-label={s.label}>
                <svg viewBox="0 0 24 24"><path d={s.d} /></svg>
              </a>
            ))}
          </div>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}

export default function App() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Navbar />
      <Hero />
      <main id="main">
        <About />
        <Projects />
        <Skills />
        <Hire />
        <Education />
        <Contact />
      </main>
      <BackToTop />
      <footer>© {new Date().getFullYear()} <em>{PROFILE.name}</em></footer>
    </>
  );
}