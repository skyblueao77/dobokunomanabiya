import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathFormulaProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const MathFormula: React.FC<MathFormulaProps> = ({
  math,
  block = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    try {
      katex.render(math, el, {
        displayMode: block,
        throwOnError: false,
        strict: false,
      });
    } catch {
      el.textContent = math;
    }
  }, [math, block]);

  return (
    <span
      ref={containerRef}
      className={`${
        block
          ? 'block my-2 max-w-full overflow-x-auto overflow-y-hidden text-[0.92rem]'
          : 'inline align-baseline'
      } ${className}`}
    />
  );
};
