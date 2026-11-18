import React, { useId } from 'react';

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
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const parsed = Number(e.target.value);
              if (!Number.isNaN(parsed)) {
                onChange(Math.max(min, Math.min(max, parsed)));
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
