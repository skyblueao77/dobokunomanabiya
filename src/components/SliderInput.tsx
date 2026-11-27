import React, { useId, useState } from 'react';

interface SliderInputProps {
  label: string;
  symbol: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}

export const SliderInput: React.FC<SliderInputProps> = ({
  label,
  symbol,
  unit,
  value,
  min,
  max,
  step = 1,
  onChange,
}) => {
  const numId = useId();
  const rangeId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const displayedDraft = isEditing ? draft : String(value);
  const formattedValueText = unit && unit !== '-' ? `${value} ${unit}` : String(value);

  const commitDraft = () => {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (trimmed === '') {
      setDraft(String(value));
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.max(min, Math.min(max, parsed));
    setDraft(String(clamped));
    if (clamped !== value) {
      onChange(clamped);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <label htmlFor={numId} className="font-medium">
          {label} <span className="font-mono-num app-text-muted">({symbol})</span>
        </label>
        <div className="flex items-center gap-1">
          <input
            id={numId}
            type="number"
            value={displayedDraft}
            min={min}
            max={max}
            step={step}
            onFocus={() => {
              setIsEditing(true);
              setDraft(String(value));
            }}
            onChange={(e) => {
              const raw = e.target.value;
              setDraft(raw);
              if (raw.trim() === '') return;
              const parsed = Number(raw);
              if (Number.isFinite(parsed) && parsed >= min && parsed <= max) {
                onChange(parsed);
              }
            }}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                commitDraft();
              } else if (e.key === 'Escape') {
                setIsEditing(false);
                setDraft(String(value));
              }
            }}
            className="app-surface w-20 rounded px-2 py-1 text-right text-xs font-semibold font-mono-num"
          />
          <span className="app-text-muted min-w-8">{unit}</span>
        </div>
      </div>
      <input
        id={rangeId}
        aria-label={`${label} (${symbol}) スライダー`}
        aria-valuetext={formattedValueText}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg cursor-pointer accent-[var(--accent-color)]"
      />
    </div>
  );
};
