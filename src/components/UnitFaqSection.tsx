import React from 'react';
import { HelpCircle } from 'lucide-react';
import seoUnitsCatalog from '../data/seoUnitsCatalog.json';
import { type UnitId } from '../data/curriculum';

interface UnitFaqSectionProps {
  unitId: UnitId;
}

export const UnitFaqSection: React.FC<UnitFaqSectionProps> = ({ unitId }) => {
  const unitMeta = seoUnitsCatalog.units[unitId];
  const faqs = seoUnitsCatalog.unitFaqs[unitId] ?? [];

  if (faqs.length === 0 && unitMeta.keyFormulas.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby={`unit-faq-heading-${unitId}`}
      className="app-surface rounded-xl p-5 space-y-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
        <h2
          id={`unit-faq-heading-${unitId}`}
          className="text-base font-bold inline-flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4 text-blue-700 dark:text-blue-400" aria-hidden="true" />
          この単元の重要公式・よくある質問（FAQ）
        </h2>
        <span className="text-xs app-text-muted">学習ポイントの整理</span>
      </div>

      {unitMeta.keyFormulas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold">主要公式と定義</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unitMeta.keyFormulas.map((item) => (
              <div key={item.name} className="app-surface-subtle rounded-lg p-3 space-y-1">
                <dt className="text-xs font-bold">{item.name}</dt>
                <dd className="text-xs font-mono-num text-blue-700 dark:text-blue-300 font-semibold break-words">
                  {item.formula}
                </dd>
                <dd className="text-xs app-text-muted leading-relaxed">{item.meaning}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {faqs.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <h3 className="text-sm font-bold">よくある質問（FAQ）</h3>
          <div className="space-y-2.5">
            {faqs.map((faq) => (
              <article
                key={faq.question}
                className="app-surface-subtle rounded-lg p-3.5 space-y-1"
              >
                <h4 className="text-xs sm:text-sm font-bold">{faq.question}</h4>
                <p className="text-xs sm:text-sm app-text-muted leading-relaxed">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
