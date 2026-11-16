import React, { useMemo } from 'react';
import katex from 'katex';

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
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return math;
    }
  }, [math, block]);

  return (
    <span
      className={`${
        block ? 'block my-2 max-w-full overflow-x-auto text-[0.92rem]' : 'inline-block max-w-full overflow-x-auto align-middle'
      } ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
