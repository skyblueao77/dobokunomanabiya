import React, { useEffect, useRef, useState } from 'react';
import { Check, Share2, AlertCircle } from 'lucide-react';

interface CopyShareButtonProps {
  getTextToCopy: () => string;
  label?: string;
  ariaLabel?: string;
}

function legacyCopy(text: string): boolean {
  const field = Object.assign(document.createElement('textarea'), { value: text });
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
  document.body.append(field);
  field.select();
  try {
    return document.execCommand('copy');
  } finally {
    field.remove();
  }
}

export const CopyShareButton: React.FC<CopyShareButtonProps> = ({
  getTextToCopy,
  label = '条件リンクをコピー',
  ariaLabel = '現在の計算条件を含むURLをクリップボードにコピー',
}) => {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [liveMessage, setLiveMessage] = useState('');
  const timerRef = useRef<number | null>(null);
  const lastAnnouncementRef = useRef('');

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    const text = getTextToCopy();
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = legacyCopy(text);
    }

    setStatus(ok ? 'copied' : 'failed');
    let msg = ok ? 'URLをコピーしました' : 'コピーに失敗しました';
    if (msg === lastAnnouncementRef.current) {
      msg += '\u00A0';
    }
    lastAnnouncementRef.current = msg;
    setLiveMessage(msg);

    timerRef.current = window.setTimeout(() => {
      setStatus('idle');
      setLiveMessage('');
    }, 2200);
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={ariaLabel}
        className="interactive-btn app-surface inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
      >
        {status === 'copied' ? (
          <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
        ) : status === 'failed' ? (
          <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" aria-hidden="true" />
        ) : (
          <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span>{status === 'copied' ? 'コピー完了' : label}</span>
      </button>
      <span role="status" className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
        {liveMessage}
      </span>
    </span>
  );
};
