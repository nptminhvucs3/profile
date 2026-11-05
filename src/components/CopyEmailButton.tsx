import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  email: string;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* thử cách dự phòng bên dưới */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-100px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Nút nhỏ nằm trong nút Email: bấm để sao chép địa chỉ email */
export default function CopyEmailButton({ email }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = async () => {
    const ok = await copyText(email);
    setState(ok ? 'copied' : 'failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 1800);
  };

  const label = state === 'copied' ? 'Copied!' : state === 'failed' ? 'Copy failed' : 'Copy email';

  return (
    <>
      <button
        type="button"
        className={`copy-email${state === 'copied' ? ' is-copied' : ''}`}
        onClick={onClick}
        aria-label={`Copy email address ${email}`}
        title={label}
      >
        {state === 'copied' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      </button>
      <span className={`copy-email__tip${state !== 'idle' ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {state === 'idle' ? '' : label}
      </span>
    </>
  );
}
