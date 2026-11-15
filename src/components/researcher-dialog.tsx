'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ResearcherCredential } from '@/lib/researcher-code';
import { verifyResearcherCode } from '@/lib/researcher-code';
import { useDialogFocus } from './hooks/use-dialog-focus';

export function ResearcherDialog({ credential, onUnlock, children }: {
  credential?: ResearcherCredential; onUnlock: () => void; children: ReactNode;
}) {
  const [open, setOpen] = useState(false), [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDialogElement>(null), attempt = useRef(0);
  const close = useCallback(() => {
    attempt.current++;
    setOpen(false); setUnlocked(false); setCode(''); setMessage(''); setBusy(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }, []);
  useEffect(() => {
    if (open) panel.current?.showModal(); else panel.current?.close();
  }, [open]);
  useDialogFocus(open, panel, trigger, close, false);
  useEffect(() => { if (unlocked) panel.current?.querySelector<HTMLButtonElement>('button')?.focus(); }, [unlocked]);
  async function unlock() {
    const currentAttempt = ++attempt.current;
    setBusy(true); setMessage('');
    try {
      const valid = await verifyResearcherCode(code, credential);
      if (currentAttempt !== attempt.current) return;
      setCode('');
      if (valid) { onUnlock(); setUnlocked(true); } else setMessage('That code did not match. Try again.');
    } catch {
      if (currentAttempt === attempt.current) setMessage('The code could not be checked. Try again.');
    } finally { if (currentAttempt === attempt.current) setBusy(false); }
  }
  return <>
    <button type="button" className="text-button researcher-trigger" ref={trigger} onClick={() => setOpen(true)}>Researcher</button>
    <dialog ref={panel} className="researcher-dialog" aria-labelledby="researcher-dialog-title" onCancel={event => { event.preventDefault(); close(); }}>
      {open && <><div className="settings-heading"><h2 id="researcher-dialog-title">Researcher controls</h2><button type="button" onClick={close} aria-label="Close researcher controls">×</button></div>
        {unlocked ? children : credential ? <form onSubmit={event => { event.preventDefault(); void unlock(); }}>
          <label htmlFor="researcher-code-unlock">Researcher code</label><input id="researcher-code-unlock" type="password" inputMode="numeric" pattern="[0-9]{4,8}" minLength={4} maxLength={8} autoComplete="off" required value={code} onChange={event => setCode(event.target.value)} aria-describedby="researcher-code-help" />
          <p id="researcher-code-help">Enter the 4–8 digit code set when this session was created.</p>
          {message && <p role="alert">{message}</p>}<button type="submit" disabled={busy}>{busy ? 'Checking…' : 'Unlock controls'}</button>
        </form> : <p>This saved session has no researcher code. Ask the researcher to prepare a new session in session setup.</p>}
      </>}
    </dialog>
  </>;
}
