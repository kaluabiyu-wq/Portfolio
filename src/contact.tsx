import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { PROFILE } from './data';

/**
 * Contact form delivered to PROFILE.email through FormSubmit (no backend needed).
 *
 * One-time setup: submit the form once from the live site and click the activation link FormSubmit emails you.
 * Optional: set VITE_FORMSUBMIT_ID to the random alias FormSubmit gives you after activation, so your address
 * is not visible in the page's network requests.
 */
const FORM_ID = (import.meta.env.VITE_FORMSUBMIT_ID as string | undefined)?.trim() || PROFILE.email;
const ENDPOINT = `https://formsubmit.co/ajax/${FORM_ID}`;
const COOLDOWN_MS = 60_000;
const COOLDOWN_KEY = 'contact:lastSent';
const LIMITS = { name: 80, subject: 120, body: 4000 };

type Fields = { name: string; email: string; subject: string; body: string };
type Errors = Partial<Record<keyof Fields, string>>;
const EMPTY: Fields = { name: '', email: '', subject: '', body: '' };

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = 'Please enter your name.';
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Please enter a valid email address.';
  if (f.body.trim().length < 10) e.body = 'Please write a short message (at least 10 characters).';
  return e;
}

const secondsLeft = () => {
  try {
    const last = Number(sessionStorage.getItem(COOLDOWN_KEY) || 0);
    return Math.max(0, Math.ceil((last + COOLDOWN_MS - Date.now()) / 1000));
  } catch { return 0; }
};

export function ContactForm() {
  const id = useId();
  const [f, setF] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [wait, setWait] = useState(secondsLeft);
  const honey = useRef<HTMLInputElement>(null);
  const firstBad = useRef<HTMLFormElement>(null);

  // Tick the cooldown so the button re-enables by itself.
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(secondsLeft()), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    setF(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    // Bots fill the hidden field; pretend success and send nothing.
    if (honey.current?.value) { setF(EMPTY); setStatus({ ok: true, text: 'Message sent. Thank you!' }); return; }
    const errs = validate(f);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setStatus({ ok: false, text: 'Please fix the highlighted fields.' });
      firstBad.current?.querySelector<HTMLElement>('[aria-invalid="true"], input:invalid')?.focus();
      return;
    }
    if (secondsLeft() > 0) { setWait(secondsLeft()); return; }

    const subject = f.subject.trim() || `Portfolio enquiry from ${f.name.trim()}`;
    setSending(true); setStatus(null);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: f.name.trim(), email: f.email.trim(), message: f.body.trim(),
          _replyto: f.email.trim(), _subject: subject, _template: 'table', _captcha: 'false',
          _autoresponse: `Hi ${f.name.trim()}, thanks for your message. I received it and will reply to this address soon. — ${PROFILE.name}`,
        }),
      });
      // FormSubmit can answer 200 with { success: "false" } (for example before the form is activated).
      const data = await res.json().catch(() => ({} as { success?: unknown }));
      if (!res.ok || String(data.success) === 'false') throw new Error('send failed');
      try { sessionStorage.setItem(COOLDOWN_KEY, String(Date.now())); } catch { /* storage unavailable */ }
      setWait(secondsLeft());
      setF(EMPTY); setErrors({});
      setStatus({ ok: true, text: 'Message sent. Thank you, I will reply to your email soon.' });
    } catch {
      const body = encodeURIComponent(`${f.body}\n\n— ${f.name} (${f.email})`);
      window.location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent(subject)}&body=${body}`;
      setStatus({ ok: false, text: 'Could not send directly, so your email app is opening with the message filled in.' });
    } finally {
      setSending(false);
    }
  };

  const err = (k: keyof Fields) => errors[k]
    ? <small id={`${id}-${k}-err`} className="ferr">{errors[k]}</small> : null;
  const aria = (k: keyof Fields) => ({ 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `${id}-${k}-err` : undefined });

  return (
    <form ref={firstBad} onSubmit={submit} noValidate aria-label="Contact form">
      <h3>Send a message</h3>
      <p className="sub">Tell me about the role, project, or idea you have in mind. It lands straight in my inbox.</p>
      <div className="row">
        <label>Name<input name="name" autoComplete="name" maxLength={LIMITS.name} value={f.name} onChange={set('name')} placeholder="Your name" required {...aria('name')} />{err('name')}</label>
        <label>Email<input name="email" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={set('email')} placeholder="you@example.com" required {...aria('email')} />{err('email')}</label>
      </div>
      <label>Subject<input name="subject" maxLength={LIMITS.subject} value={f.subject} onChange={set('subject')} placeholder="What would you like to discuss?" /></label>
      <label>Message<textarea name="message" maxLength={LIMITS.body} value={f.body} onChange={set('body')} placeholder="Share a few details..." required {...aria('body')} />{err('body')}</label>
      {/* Honeypot: hidden from people and screen readers, tempting for bots. */}
      <div className="hp" aria-hidden="true"><label>Leave this empty<input ref={honey} name="_honey" tabIndex={-1} autoComplete="off" /></label></div>
      <button className="btn p" type="submit" disabled={sending || wait > 0}>
        {sending ? 'Sending…' : wait > 0 ? `Sent ✓ (send another in ${wait}s)` : 'Send Message'}
      </button>
      <div id="msg" role="status" aria-live="polite" style={{ color: status?.ok ? 'var(--green)' : 'var(--accent-text)' }}>{status?.text}</div>
    </form>
  );
}
