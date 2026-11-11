import { useEffect, useRef } from 'react';
import { PROFILE, HIRE_FACTS, SKILLS, PROJECTS, TIMELINE, SOCIALS, ONE_LINERS, type Project } from './data';

/**
 * Recruiter Quick-View: a plain, fast, high-contrast one-page summary with no animation.
 * Shown at #recruiter, so the link can be shared directly.
 */
export function QuickView({ theme, toggleTheme, onExit, onOpenCase }: {
  theme: 'light' | 'dark'; toggleTheme: () => void; onExit: () => void; onOpenCase: (p: Project) => void;
}) {
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const prev = document.title;
    document.title = `${PROFILE.name} · Recruiter summary`;
    h1.current?.focus();
    window.scrollTo(0, 0);
    return () => { document.title = prev; };
  }, []);
  const link = (label: string) => SOCIALS.find(s => s.label === label)?.href;
  const certs = TIMELINE.filter(t => t.kind.startsWith('Certification'));
  const training = TIMELINE.filter(t => !t.kind.startsWith('Certification'));

  return (
    <div className="qv">
      <div className="qv-bar">
        <span>Recruiter quick view</span>
        <div>
          <button type="button" onClick={() => window.print()}>Print or save as PDF</button>
          <button type="button" onClick={toggleTheme} aria-label="Toggle light and dark theme">{theme === 'dark' ? 'Light theme' : 'Dark theme'}</button>
          <button type="button" className="exit" onClick={onExit}>View full portfolio</button>
        </div>
      </div>
      <main id="main" className="qv-main">
        <header className="qv-head">
          <h1 ref={h1} tabIndex={-1}>{PROFILE.name}</h1>
          <p className="qv-role">Fullstack developer · Addis Ababa, Ethiopia (UTC+3)</p>
          <p className="qv-status">Open to junior fullstack roles. Available immediately for remote, hybrid or onsite work.</p>
          <div className="qv-actions">
            <a className="btn p" href={PROFILE.cv} download>Download CV (PDF)</a>
            <a className="btn g" href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
            <a className="btn g" href={link('LinkedIn')} target="_blank" rel="noreferrer">LinkedIn</a>
            <a className="btn g" href={link('GitHub')} target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </header>

        <section aria-labelledby="qv-sum">
          <h2 id="qv-sum">Summary</h2>
          <p>I build complete systems end to end: clean domain models, secure APIs on ASP.NET Core and PostgreSQL, and reactive Angular front ends, covered by automated tests. I have delivered five projects, including a hackathon job marketplace built with a team of six.</p>
        </section>

        <section aria-labelledby="qv-facts">
          <h2 id="qv-facts">What I am looking for</h2>
          <dl>{HIRE_FACTS.filter(h => h.group === 'looking').map(h => <div key={h.label}><dt>{h.label}</dt><dd>{h.value}</dd></div>)}</dl>
        </section>

        <section aria-labelledby="qv-proj">
          <h2 id="qv-proj">Projects</h2>
          <ul className="qv-projects">
            {PROJECTS.map(p => (
              <li key={p.title}>
                <h3>{p.title}</h3>
                <p>{ONE_LINERS[p.short] ?? p.desc}</p>
                <p className="qv-stack">{p.tech.slice(0, 6).join(', ')}</p>
                <p className="qv-links">
                  <a href={p.github} target="_blank" rel="noreferrer">Source code<span className="sr-only"> for {p.title}</span></a>
                  {p.demo && <a href={p.demo} target="_blank" rel="noreferrer">Live demo<span className="sr-only"> of {p.title}</span></a>}
                  <button type="button" onClick={() => onOpenCase(p)}>Full case study<span className="sr-only"> for {p.title}</span></button>
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="qv-skills">
          <h2 id="qv-skills">Skills</h2>
          <dl>{SKILLS.map(s => <div key={s.title}><dt>{s.title}</dt><dd>{s.items.join(', ')}</dd></div>)}</dl>
        </section>

        <section aria-labelledby="qv-edu">
          <h2 id="qv-edu">Education and training</h2>
          <ul className="qv-list">
            {training.map(t => <li key={t.title}><strong>{t.title}</strong>, {t.date}</li>)}
          </ul>
          <h3>Certifications</h3>
          <ul className="qv-list">
            {certs.map(t => <li key={t.title}><strong>{t.title}</strong>, {t.date}{t.link && <> · <a href={t.link} target="_blank" rel="noreferrer">Verify<span className="sr-only"> {t.title}</span></a></>}</li>)}
          </ul>
        </section>
      </main>
    </div>
  );
}
