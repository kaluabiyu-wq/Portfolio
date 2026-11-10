import { useEffect, useRef, useState } from 'react';
import { PROFILE, PROJECTS, SOCIALS, type Project } from './data';
import { Reveal } from './fx';

/** Quick-contact card for the About section: one-tap copy of the email, CV download and key profiles. */
export function QuickContact() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
    } catch {
      // Clipboard API blocked (insecure context / permissions): fall back to a temporary textarea.
      const t = document.createElement('textarea');
      t.value = PROFILE.email; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } finally { t.remove(); }
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const links = SOCIALS.filter(s => ['LinkedIn', 'GitHub', 'Telegram'].includes(s.label));
  return (
    <article className="quick" aria-labelledby="quick-title">
      <span className="kicker">LET'S TALK</span>
      <h4 id="quick-title">The fastest way to reach me</h4>
      <button type="button" className="copybtn" onClick={copy} aria-label={`Copy email address ${PROFILE.email}`}>
        <span className="addr">{PROFILE.email}</span>
        <span className={`state${copied ? ' ok' : ''}`}>{copied ? 'Copied ✓' : 'Copy'}</span>
      </button>
      <span className="sr-live" role="status" aria-live="polite">{copied ? 'Email address copied' : ''}</span>
      <div className="qrow">
        <a className="btn p" href={`mailto:${PROFILE.email}`}>Email me</a>
        <a className="btn g" href={PROFILE.cv} download>Download CV</a>
        <span className="qsoc">
          {links.map(s => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d={s.d} /></svg>
            </a>
          ))}
        </span>
      </div>
    </article>
  );
}

const PRACTICES: { icon: string; title: string; text: string; seen: string }[] = [
  { icon: '🏛️', title: 'Clean architecture', seen: 'TMS',
    text: 'Domain rules stay independent of the UI and database. CQRS with MediatR keeps every use case small, separate and easy to test.' },
  { icon: '🔐', title: 'Secure by default', seen: 'TMS',
    text: 'JWT with refresh-token rotation, resource-based policies, login rate limiting and security-headers middleware.' },
  { icon: '🧪', title: 'Tested end to end', seen: 'TMS',
    text: 'xUnit integration and unit tests on the API, Vitest specs on the client, and Playwright E2E for happy and failure paths.' },
  { icon: '⚡', title: 'Fast and live', seen: 'TMS',
    text: 'HybridCache with tag-based invalidation for hot data, and SignalR to push updates instead of asking users to refresh.' },
];

/** "How I build" strip: engineering habits taken from the case studies, each linking to the project that shows it. */
export function HowIBuild({ onOpen }: { onOpen: (p: Project) => void }) {
  return (
    <Reveal className="practices-wrap">
      <h3 className="practices-title">How I build <small>habits you'll find in my code</small></h3>
      <div className="practices">
        {PRACTICES.map((p, i) => {
          const proj = PROJECTS.find(x => x.short === p.seen);
          return (
            <Reveal key={p.title} delay={i * 90} from="zoom" className="cell">
              <div className="practice">
                <div className="ic" aria-hidden="true">{p.icon}</div>
                <h4>{p.title}</h4>
                <p>{p.text}</p>
                {proj && <button type="button" onClick={() => onOpen(proj)}>See it in {p.seen} →</button>}
              </div>
            </Reveal>
          );
        })}
      </div>
    </Reveal>
  );
}
