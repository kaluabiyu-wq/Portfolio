import { useEffect, useRef, useState } from 'react';
import { PROFILE, SOCIALS, HIRE_FACTS } from './data';
import { Reveal, LocalTime } from './fx';

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

/** Hire + CV in one section: the facts recruiters ask for first, next to a one-page CV preview they can open or download. */
export function HireCv() {
  const [missing, setMissing] = useState(false);
  const group = (g: 'looking' | 'background') => HIRE_FACTS.filter(f => f.group === g);
  const rows = (g: 'looking' | 'background') => (
    <dl className="looking">{group(g).map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
  );
  return (
    <section id="hire" className="alt">
      <div className="wrap">
        <Reveal>
          <div className="tag">HIRE ME</div>
          <h2>What I'm looking for, and my CV.</h2>
          <LocalTime zone="Africa/Addis_Ababa" city="Addis Ababa" utcOffsetMin={180} />
        </Reveal>
        <div className="cvgrid">
          <Reveal from="left">
            <div className="cvside">
              {rows('looking')}
              <h3 className="lgroup">Background</h3>
              {rows('background')}
              <div className="btns">
                <a className="btn p" href="#contact">Start a conversation</a>
                <a className="btn g" href={PROFILE.cv} download>Download CV (PDF)</a>
              </div>
            </div>
          </Reveal>
          <Reveal from="right">
            <a id="cv" className="cvpage" href={PROFILE.cv} target="_blank" rel="noreferrer" aria-label="Open the full CV as a PDF in a new tab">
              {missing
                ? <span className="cvfallback">CV preview unavailable. Open the PDF instead.</span>
                : <img src={PROFILE.cvPreview} alt={`First page of ${PROFILE.name}'s CV: profile, projects, education and skills`} width="1075" height="1521" loading="lazy" onError={() => setMissing(true)} />}
              <span className="cvhint" aria-hidden="true">Click to open full size ↗</span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
