import { type CSSProperties, useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { PROFILE, NAV, FACTS, PROJECTS, SKILLS, SKILL_ICONS, TIMELINE, SOCIALS, type Project } from './data';
import { QuickContact, HireCv } from './extras';
import { ContactForm } from './contact';
import { ArchExplorer, StudyList } from './engineering';
import { archFor, studiesFor } from './engineeringData';
import { QuickView } from './quickview';
import { Reveal, useTilt, useParallax, ScrollProgress, CursorGlow } from './fx';
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

/* ---------- recruiter quick-view (#recruiter) ---------- */
const RECRUITER_HASH = '#recruiter';
function useRecruiterMode() {
  const [on, setOn] = useState(() => location.hash === RECRUITER_HASH);
  useEffect(() => {
    const sync = () => setOn(location.hash === RECRUITER_HASH);
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const enter = useCallback(() => { location.hash = RECRUITER_HASH.slice(1); }, []);
  const exit = useCallback(() => {
    // pushState (not hash = '') so Back returns to the quick view and no stray '#' is left behind.
    if (location.hash === RECRUITER_HASH) history.pushState(null, '', location.pathname + location.search);
    setOn(false);
    window.scrollTo(0, 0);
  }, []);
  return [on, enter, exit] as const;
}

/* ---------- shareable case-study links (#case/<slug>) ---------- */
const CASE_PREFIX = '#case/';
const projectSlug = (p: Project) => p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
type CaseTab = 'overview' | 'architecture' | 'engineering';
const TABS: CaseTab[] = ['overview', 'architecture', 'engineering'];
const caseHash = (p: Project, tab: CaseTab = 'overview') => `${CASE_PREFIX}${projectSlug(p)}${tab === 'overview' ? '' : `/${tab}`}`;
const caseUrl = (p: Project, tab: CaseTab = 'overview') => `${location.origin}${location.pathname}${caseHash(p, tab)}`;
const tabFromHash = (): CaseTab => {
  const t = location.hash.startsWith(CASE_PREFIX) ? location.hash.slice(CASE_PREFIX.length).split('/')[1] : '';
  return (TABS as string[]).includes(t) ? (t as CaseTab) : 'overview';
};

function projectFromHash(): Project | null {
  if (!location.hash.startsWith(CASE_PREFIX)) return null;
  try {
    const slug = decodeURIComponent(location.hash.slice(CASE_PREFIX.length).split('/')[0]);
    return PROJECTS.find(p => projectSlug(p) === slug) ?? null;
  } catch { return null; } // malformed %-escape in a hand-edited URL
}

/** Case-study state that lives in the URL: deep links open the modal, Back/Forward close and reopen it. */
function useCaseRoute() {
  const [open, setOpenState] = useState<Project | null>(projectFromHash);

  const setOpen = useCallback((p: Project | null) => {
    setOpenState(p);
    if (p) history.pushState(null, '', `${CASE_PREFIX}${projectSlug(p)}`);
    else if (location.hash.startsWith(CASE_PREFIX)) history.replaceState(null, '', location.pathname + location.search);
  }, []);

  useEffect(() => {
    const sync = () => setOpenState(projectFromHash());
    window.addEventListener('hashchange', sync);
    // Landing on a deep link: put the Projects section behind the modal so closing it lands somewhere sensible.
    if (projectFromHash()) document.getElementById('projects')?.scrollIntoView();
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.title;
    document.title = `${open.title} · ${PROFILE.name}`;
    return () => { document.title = prev; };
  }, [open]);

  return [open, setOpen] as const;
}

/* ---------- components ---------- */
const SECTION_IDS = NAV.map(n => n.toLowerCase());

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);

function Navbar({ theme, toggleTheme, onSearch, onRecruiter }: { theme: Theme; toggleTheme: () => void; onSearch: () => void; onRecruiter: () => void }) {
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
          <button type="button" className="kbd-btn" onClick={onSearch} aria-label="Search and quick actions" aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}>
            <span aria-hidden="true">⌕</span><kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <button type="button" className="rv-btn" onClick={onRecruiter}>Quick view</button>
          <a className="resume" href={PROFILE.cv} download>Resume</a>
          <button id="theme" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'dark' ? '☀' : '☾'}</button>
          <button className="menu" onClick={() => setOpen(o => !o)} aria-label="Menu">☰</button>
        </div>
      </div>
    </nav>
  );
}

/** Splits a word into per-letter spans so the hero title can animate in. Hidden from screen readers (the h1 carries the label). */
function Letters({ text, offset = 0 }: { text: string; offset?: number }) {
  return <>{[...text].map((c, i) => <span key={i} className="ch" aria-hidden="true" style={{ '--i': i + offset } as CSSProperties}>{c}</span>)}</>;
}

function Hero() {
  const typed = useTyped(PROFILE.role);
  const [first, last] = PROFILE.name.split(' ');
  const stage = useParallax<HTMLDivElement>();
  return (
    <header className="hero" id="home">
      <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
      <div className="wrap">
        <div>
          <div className="tag">HELLO, I'M</div>
          <h1 aria-label={PROFILE.name}><Letters text={first} /> <span className="grad"><Letters text={last} offset={first.length + 1} /></span></h1>
          <div className="role"><span>{typed}</span><i /></div>
          <p className="lead">I build real, end-to-end systems — from clean domain models to reactive Angular UIs — and I'm looking for my first junior fullstack role.</p>
          <div className="btns">
            <a className="btn p" href="#projects">View Projects</a>
            <a className="btn g" href="#contact">Contact Me</a>
            <a className="btn g" href="#recruiter">Recruiter quick view</a>
          </div>
        </div>
        <div className="photo" ref={stage}>
          <div className="halo" aria-hidden="true" />
          <div className="stage">
            <div className="frame">
              {PROFILE.photo ? <img src={PROFILE.photo} alt={PROFILE.name} /> : 'KA'}
            </div>
            <div className="status">Open to opportunities</div>
          </div>
          <span className="orb o1" aria-hidden="true"><SkillBadge name=".NET" /></span>
          <span className="orb o2" aria-hidden="true"><SkillBadge name="Angular" /></span>
          <span className="orb o3" aria-hidden="true"><SkillBadge name="PostgreSQL" /></span>
          <span className="orb o4" aria-hidden="true"><SkillBadge name="TypeScript" /></span>
        </div>
      </div>
    </header>
  );
}

function About() {
  return (
    <section id="about">
      <div className="wrap about">
        <Reveal from="left">
          <div className="tag">ABOUT</div>
          <h2>Building systems that <span className="grad">work end-to-end.</span></h2>
          <p>I'm a Computer Science student at Admas University and a participant in the Qiyas Fullstack Program — a hands-on training program focused on production-grade .NET and Angular development.</p>
          <p>My focus is on building complete, well-structured systems: clean backend architecture, reactive frontends, proper testing, and real deployment. My major projects go deeper than tutorials — they solve actual problems with real architectural decisions, and one of them was built with a six-person team at the Qiyas Hackathon.</p>
          <p>I'm actively looking for a junior fullstack role where I can contribute to a real product from day one.</p>
        </Reveal>
        <div className="facts">
          <Reveal from="right"><QuickContact /></Reveal>
          {FACTS.map((f, i) => (
            <Reveal key={f.title} delay={i * 120} from="right">
              <div className="fact">
                <div className="ic">{f.icon}</div>
                <div>
                  <h4>{f.title}</h4>
                  <small className={f.accent ? 'c2' : 'c1'}>{f.a}</small>
                  <small>{f.b}</small>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseStudy({ p, onClose }: { p: Project; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const arch = archFor(p.short);
  const studies = studiesFor(p.short);
  const available = TABS.filter(t => t === 'overview' || (t === 'architecture' ? !!arch : studies.length > 0));
  const [tab, setTabState] = useState<CaseTab>(() => { const t = tabFromHash(); return available.includes(t) ? t : 'overview'; });
  const [openNote, setOpenNote] = useState<string | null>(null);
  const uid = useId();
  useEffect(() => { ref.current?.showModal(); }, []);

  const setTab = (t: CaseTab) => {
    setTabState(t);
    history.replaceState(null, '', caseHash(p, t));
  };
  const openStudy = (id: string) => {
    setTab('engineering'); setOpenNote(id);
    requestAnimationFrame(() => document.getElementById(`eng-${id}`)?.scrollIntoView({ block: 'nearest' }));
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(caseUrl(p, tab));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', caseUrl(p, tab));
    }
  };
  const label: Record<CaseTab, string> = { overview: 'Overview', architecture: 'Architecture', engineering: `Engineering notes (${studies.length})` };
  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = available.indexOf(tab);
    setTab(available[(i + (e.key === 'ArrowRight' ? 1 : available.length - 1)) % available.length]);
  };
  return (
    <dialog ref={ref} className="case wide" aria-labelledby="case-title" onClose={onClose}
      onClick={e => { if (e.target === ref.current) onClose(); }}>
      <button className="x" onClick={onClose} aria-label="Close case study">✕</button>
      <div className="tag">CASE STUDY · {p.badge}</div>
      <h3 id="case-title">{p.title}</h3>

      {available.length > 1 && (
        <div className="case-tabs" role="tablist" aria-label="Case study sections" onKeyDown={onTabKey}>
          {available.map(t => (
            <button key={t} type="button" role="tab" id={`${uid}-${t}`} aria-selected={tab === t} aria-controls={`${uid}-panel`}
              tabIndex={tab === t ? 0 : -1} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{label[t]}</button>
          ))}
        </div>
      )}

      <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-${tab}`}>
        {tab === 'overview' && (
          <>
            <h4>The problem</h4><p>{p.problem}</p>
            <h4>My role</h4><p>{p.role}</p>
            {p.results && p.results.length > 0 && (<><h4>Results</h4><ul>{p.results.map(i => <li key={i}>{i}</li>)}</ul></>)}
            {p.challenges && p.challenges.length > 0 && (<><h4>Challenges</h4><ul>{p.challenges.map(i => <li key={i}>{i}</li>)}</ul></>)}
            <details className="more"><summary>Key decisions ({p.decisions.length})</summary><ul>{p.decisions.map(i => <li key={i}>{i}</li>)}</ul></details>
            <h4>Stack</h4>
            <div className="chips">{p.tech.map(t => <span key={t}>{t}</span>)}</div>
          </>
        )}
        {tab === 'architecture' && arch && (
          <>
            <p className="case-sum">{arch.summary} Click a component, or trace a request step by step.</p>
            <ArchExplorer key={arch.key} arch={arch} onStudy={openStudy} />
          </>
        )}
        {tab === 'engineering' && (
          <>
            <p className="case-sum">The decisions above, explained one level down: what the mechanism is, and where it stops being the right answer.</p>
            <StudyList studies={studies} openId={openNote} setOpenId={setOpenNote} />
          </>
        )}
      </div>

      <div className="btns">
        {p.demo && <a className="btn p" href={p.demo} target="_blank" rel="noreferrer">Live demo ↗</a>}
        <a className="btn g" href={p.github} target="_blank" rel="noreferrer">Source code ↗</a>
        <button type="button" className="btn g" onClick={copyLink}>{copied ? 'Link copied ✓' : 'Copy link'}</button>
      </div>
    </dialog>
  );
}

function ProjectCard({ p, onOpen }: { p: Project; onOpen: () => void }) {
  const tilt = useTilt<HTMLElement>();
  return (
    <article className="proj tilt" ref={tilt}>
      <div className="thumb">
        {p.image ? <img src={p.image} alt={`${p.title} screenshot`} loading="lazy" /> : (
          <div className="mock" aria-hidden="true">
            <div className="bar"><i /><i /><i /><span>{p.short.toLowerCase()}.app</span></div>
            <div className="body"><b>{p.short}</b><s /><s /><s /></div>
          </div>
        )}
        <span className="badge">{p.badge}</span>
      </div>
      <div className="pbody">
        <h3>{p.title}</h3>
        <p>{p.desc}</p>
        <small className="role-line">{p.role}</small>
        {(archFor(p.short) || studiesFor(p.short).length > 0) && (
          <small className="deep">{[archFor(p.short) && 'Architecture diagram', studiesFor(p.short).length > 0 && `${studiesFor(p.short).length} engineering note${studiesFor(p.short).length > 1 ? 's' : ''}`].filter(Boolean).join(' · ')}</small>
        )}
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



function Projects({ open, setOpen }: { open: Project | null; setOpen: (p: Project | null) => void }) {
  const [filter, setFilter] = useState<Filter>('All');
  const shown = PROJECTS.filter(p => matchesFilter(p, filter));
  return (
    <section id="projects" className="alt">
      <div className="wrap">
        <Reveal>
          <div className="tag">PROJECTS</div>
          <h2>Real systems, real architecture.</h2>
          <p className="lead">Selected full-stack and cross-platform applications built with thoughtful architecture. Open a project for its problem and results, an interactive architecture diagram, and short engineering notes on the decisions behind it.</p>
        </Reveal>
        <div className="filters" role="group" aria-label="Filter projects">
          {FILTERS.map(f => (
            <button key={f} type="button" className={filter === f ? 'on' : ''} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>
          ))}
          <span className="count" role="status">{shown.length} of {PROJECTS.length} projects</span>
        </div>
        <div className="grid3">{shown.map((p, i) => <Reveal key={p.title} delay={i * 90} className="cell"><ProjectCard p={p} onOpen={() => setOpen(p)} /></Reveal>)}</div>
        {open && <CaseStudy p={open} onClose={() => setOpen(null)} />}
      </div>
    </section>
  );
}

function SkillBadge({ name }: { name: string }) {
  const ic = SKILL_ICONS[name];
  return (
    <span className="skill-badge" style={{ background: ic?.bg, color: ic?.text }}>
      {ic?.d && (
        <svg viewBox="0 0 24 24" width="14" height="14" fill={ic.icon} aria-hidden="true">
          <path d={ic.d} />
        </svg>
      )}
      {name}
    </span>
  );
}

/** Decorative scrolling strip of the stack (the Skills section below is the accessible version). */
function Marquee() {
  const names = useMemo(() => [...new Set(SKILLS.flatMap(s => s.items))], []);
  return (
    <div className="marquee" aria-hidden="true">
      <div className="track">
        {[0, 1].map(k => <div className="set" key={k}>{names.map(n => <SkillBadge key={`${k}-${n}`} name={n} />)}</div>)}
      </div>
    </div>
  );
}

function Skills() {
  return (
    <section id="skills">
      <div className="wrap">
        <Reveal><div className="tag">SKILLS</div>
        <h2>The stack I work with.</h2></Reveal>
        <div className="grid4">
          {SKILLS.map((s, i) => (
            <Reveal key={s.title} delay={i * 90} from="zoom">
              <div className="skill">
                <h4>{s.title}</h4>
                <div className="badges">
                  {s.items.map(name => <SkillBadge key={name} name={name} />)}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Education() {
  return (
    <section id="education">
      <div className="wrap">
        <Reveal><div className="tag">EDUCATION</div>
        <h2>Background &amp; Training</h2></Reveal>
        <div className="tl">
          {TIMELINE.map((t, i) => (
            <Reveal key={t.title} delay={i * 110} from="left" className="tl-row"><div className="item">
              <div className="dot">{t.icon}</div>
              <div>
                <span className="pill">{t.kind}</span>
                <h3>{t.title}</h3>
                <small>{t.date}</small>
                <p>{t.desc}</p>
                {t.link && <a className="vlink" href={t.link} target="_blank" rel="noreferrer">Verify certificate ↗</a>}
              </div>
            </div></Reveal>
          ))}
        </div>
      </div>
    </section>
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


/* ---------- command palette ---------- */
interface Command { id: string; group: string; label: string; hint?: string; keywords?: string; run: () => void; }

function CommandPalette({ commands, onClose }: { commands: Command[]; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const listId = useId();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  useEffect(() => { ref.current?.showModal(); }, []);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return commands;
    return commands.filter(c => {
      const hay = `${c.label} ${c.group} ${c.keywords ?? ''}`.toLowerCase();
      return terms.every(t => hay.includes(t));
    });
  }, [q, commands]);

  useEffect(() => { setIdx(0); }, [q]);
  useEffect(() => { document.getElementById(`${listId}-${idx}`)?.scrollIntoView({ block: 'nearest' }); }, [idx, listId]);

  const run = (c?: Command) => { if (!c) return; onClose(); c.run(); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[idx]); }
  };

  let lastGroup = '';
  return (
    <dialog ref={ref} className="palette" aria-label="Quick actions" onClose={onClose}
      onClick={e => { if (e.target === ref.current) onClose(); }}>
      <input
        autoFocus type="text" value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
        placeholder="Jump to a section, open a case study, grab my CV…"
        role="combobox" aria-expanded="true" aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={results[idx] ? `${listId}-${idx}` : undefined} aria-label="Search commands"
      />
      <ul id={listId} role="listbox" aria-label="Results">
        {results.map((c, i) => {
          const header = c.group !== lastGroup ? (lastGroup = c.group) : null;
          return (
            <li key={c.id} role="presentation">
              {header && <div className="pgroup" aria-hidden="true">{header}</div>}
              <div id={`${listId}-${i}`} role="option" aria-selected={i === idx}
                className={i === idx ? 'on' : ''} onMouseMove={() => setIdx(i)} onClick={() => run(c)}>
                <span>{c.label}</span>{c.hint && <small>{c.hint}</small>}
              </div>
            </li>
          );
        })}
        {results.length === 0 && <li role="presentation" className="pempty">No matches for “{q}”.</li>}
      </ul>
      <div className="pfoot" aria-hidden="true"><span>↑↓ navigate</span><span>↵ select</span><span>esc close</span></div>
    </dialog>
  );
}

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [caseOpen, setCaseOpen] = useCaseRoute();
  const [recruiter, enterRecruiter, exitRecruiter] = useRecruiterMode();

  // Ctrl/Cmd+K toggles the palette from anywhere on the page.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(o => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const commands = useMemo<Command[]>(() => {
    const social = (label: string) => SOCIALS.find(s => s.label === label)?.href;
    const open = (href?: string) => () => { if (href) window.open(href, '_blank', 'noopener'); };
    const copyEmail = async () => {
      try { await navigator.clipboard.writeText(PROFILE.email); }
      catch { window.prompt('Copy my email address:', PROFILE.email); }
    };
    const downloadCv = () => {
      const a = document.createElement('a');
      a.href = PROFILE.cv; a.download = ''; document.body.appendChild(a); a.click(); a.remove();
    };
    return [
      ...NAV.map(n => ({ id: `go-${n}`, group: 'Go to', label: n, hint: `#${n.toLowerCase()}`, run: () => { location.hash = n.toLowerCase(); } })),
      ...PROJECTS.map(p => ({ id: `proj-${p.title}`, group: 'Case studies', label: p.title, hint: p.badge, keywords: `${p.short} ${p.tech.join(' ')}`, run: () => setCaseOpen(p) })),
      { id: 'recruiter', group: 'Actions', label: 'Recruiter quick view', hint: '#recruiter', keywords: 'recruiter summary hiring overview accessible', run: enterRecruiter },
      { id: 'cv', group: 'Actions', label: 'Download CV', hint: 'PDF', keywords: 'resume', run: downloadCv },
      { id: 'mail', group: 'Actions', label: 'Send an email', hint: PROFILE.email, keywords: 'contact hire', run: () => { location.href = `mailto:${PROFILE.email}`; } },
      { id: 'copy', group: 'Actions', label: 'Copy email address', run: copyEmail },
      { id: 'theme', group: 'Actions', label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`, keywords: 'dark light mode', run: toggleTheme },
      { id: 'gh', group: 'Links', label: 'GitHub', hint: '↗', run: open(social('GitHub')) },
      { id: 'li', group: 'Links', label: 'LinkedIn', hint: '↗', run: open(social('LinkedIn')) },
    ];
  }, [theme, toggleTheme, setCaseOpen, enterRecruiter]);

  useEffect(() => {
    document.documentElement.dataset.mode = recruiter ? 'recruiter' : 'full';
    return () => { delete document.documentElement.dataset.mode; };
  }, [recruiter]);

  if (recruiter) {
    return (
      <>
        <a className="skip" href="#main">Skip to content</a>
        <QuickView theme={theme} toggleTheme={toggleTheme} onExit={exitRecruiter}
          onOpenCase={p => { exitRecruiter(); setCaseOpen(p); }} />
      </>
    );
  }

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <ScrollProgress />
      <CursorGlow />
      <Navbar theme={theme} toggleTheme={toggleTheme} onSearch={() => setPaletteOpen(true)} onRecruiter={enterRecruiter} />
      <Hero />
      <Marquee />
      <main id="main">
        <About />
        <Projects open={caseOpen} setOpen={setCaseOpen} />
        <Skills />
        <HireCv />
        <Education />
        <Contact />
      </main>
      <BackToTop />
      {paletteOpen && <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />}
      <footer>© {new Date().getFullYear()} <em>{PROFILE.name}</em></footer>
    </>
  );
}