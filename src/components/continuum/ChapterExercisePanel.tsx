import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  HelpCircle,
  Play,
  XCircle,
} from 'lucide-react';
import { MathFormula } from '../MathFormula';

export interface ContinuumExercise {
  id: string;
  title: string;
  category: string;
  statement: string;
  mathContext?: string;
  kind: 'numeric' | 'choice';
  // kind === 'numeric'
  expectedValue?: number;
  tolerance?: number;
  unit?: string;
  inputHint?: string;
  // kind === 'choice'
  choices?: { id: string; label: string }[];
  correctChoiceId?: string;
  // 共通
  hint: string;
  steps: { label: string; math: string }[];
  answerSummary: string;
  onApplyPreset?: () => void;
}

interface ChapterExercisePanelProps {
  chapterTitle: string;
  exercises: ContinuumExercise[];
  completedIds: string[];
  onToggleDone: (id: string) => void;
  onMarkDone: (id: string) => void;
}

interface SubmissionState {
  status: 'idle' | 'correct' | 'incorrect' | 'invalid-input';
  message: string;
}

export const ChapterExercisePanel: React.FC<ChapterExercisePanelProps> = ({
  chapterTitle,
  exercises,
  completedIds,
  onToggleDone,
  onMarkDone,
}) => {
  const [numericInputs, setNumericInputs] = useState<Record<string, string>>({});
  const [choiceInputs, setChoiceInputs] = useState<Record<string, string>>({});
  const [submissions, setSubmissions] = useState<Record<string, SubmissionState>>({});
  const [openHints, setOpenHints] = useState<Record<string, boolean>>({});
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const solvedCount = exercises.filter((ex) => completedIds.includes(ex.id)).length;

  const handleCheck = (ex: ContinuumExercise) => {
    if (ex.kind === 'numeric') {
      const raw = (numericInputs[ex.id] ?? '').trim();
      const parsed = Number(raw);
      if (raw === '' || !Number.isFinite(parsed)) {
        const msg = '半角数字で数値を入力してから判定してください。';
        setSubmissions((prev) => ({
          ...prev,
          [ex.id]: { status: 'invalid-input', message: msg },
        }));
        setLiveAnnouncement(`${ex.title}: ${msg}`);
        return;
      }
      const expected = ex.expectedValue ?? 0;
      const tol = ex.tolerance ?? 0.5;
      const ok = Math.abs(parsed - expected) <= tol;
      if (ok) {
        const msg = `正解です！ (${ex.answerSummary})`;
        setSubmissions((prev) => ({
          ...prev,
          [ex.id]: { status: 'correct', message: msg },
        }));
        onMarkDone(ex.id);
        setLiveAnnouncement(`${ex.title}: ${msg}`);
      } else {
        const msg = `不正解です（入力値: ${parsed}${ex.unit ? ' ' + ex.unit : ''}）。ヒントやステップ解説を確認して再挑戦してください。`;
        setSubmissions((prev) => ({
          ...prev,
          [ex.id]: { status: 'incorrect', message: msg },
        }));
        setLiveAnnouncement(`${ex.title}: ${msg}`);
      }
    } else {
      const picked = choiceInputs[ex.id];
      if (!picked) {
        const msg = '選択肢を1つ選んでから判定してください。';
        setSubmissions((prev) => ({
          ...prev,
          [ex.id]: { status: 'invalid-input', message: msg },
        }));
        setLiveAnnouncement(`${ex.title}: ${msg}`);
        return;
      }
      const ok = picked === ex.correctChoiceId;
      if (ok) {
        const msg = `正解です！ (${ex.answerSummary})`;
        setSubmissions((prev) => ({
          ...prev,
          [ex.id]: { status: 'correct', message: msg },
        }));
        onMarkDone(ex.id);
        setLiveAnnouncement(`${ex.title}: ${msg}`);
      } else {
        const msg = '不正解です。ヒントを確認してもう一度考えてみましょう。';
        setSubmissions((prev) => ({
          ...prev,
          [ex.id]: { status: 'incorrect', message: msg },
        }));
        setLiveAnnouncement(`${ex.title}: ${msg}`);
      }
    }
  };

  return (
    <section className="app-surface rounded-xl shadow-sm overflow-hidden">
      <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold">
            3. 演習問題（{chapterTitle}）
          </h3>
          <p className="text-xs app-text-muted mt-0.5">
            自分で計算・考察して解答を判定できます。条件をシミュレーターへ読み込んで視覚的に検算もできます。
          </p>
        </div>
        <span className="text-xs font-semibold font-mono-num app-surface rounded-md px-2.5 py-1">
          この章の達成: {solvedCount} / {exercises.length}
        </span>
      </div>

      {/* スクリーンリーダー向け単一 polite live region */}
      <div aria-live="polite" className="visually-hidden">
        {liveAnnouncement}
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {exercises.map((ex) => {
          const isDone = completedIds.includes(ex.id);
          const sub = submissions[ex.id] ?? { status: 'idle', message: '' };
          const hintOpen = !!openHints[ex.id];
          const stepsOpen = !!openSteps[ex.id];
          const hintId = `hint-${ex.id}`;
          const stepsId = `steps-${ex.id}`;
          const inputId = `ans-${ex.id}`;
          const errId = `err-${ex.id}`;

          return (
            <div key={ex.id} className="p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-block rounded-md bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  {ex.category}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={isDone}
                    onClick={() => onToggleDone(ex.id)}
                    className={`interactive-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
                      isDone
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                        : 'app-surface'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {isDone ? '演習完了' : '完了にする'}
                  </button>

                  {ex.onApplyPreset && (
                    <button
                      type="button"
                      onClick={ex.onApplyPreset}
                      className="interactive-btn app-surface-subtle inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" aria-hidden="true" />
                      シミュレーターに読み込む
                    </button>
                  )}
                </div>
              </div>

              <h4 className="text-sm font-bold">{ex.title}</h4>
              <p className="text-sm app-text-muted leading-relaxed">{ex.statement}</p>
              {ex.mathContext && (
                <div className="app-surface-subtle rounded-lg px-3 py-2 overflow-x-auto">
                  <MathFormula block math={ex.mathContext} />
                </div>
              )}

              {/* 解答入力UI */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCheck(ex);
                }}
                className="space-y-3 pt-1"
              >
                {ex.kind === 'numeric' ? (
                  <div className="space-y-1.5">
                    <label htmlFor={inputId} className="block text-xs font-semibold">
                      解答の数値{ex.unit ? ` (${ex.unit})` : ''}
                    </label>
                    {ex.inputHint && (
                      <p id={`${inputId}-hint`} className="text-xs app-text-muted">
                        {ex.inputHint}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        id={inputId}
                        type="text"
                        inputMode="decimal"
                        value={numericInputs[ex.id] ?? ''}
                        onChange={(e) => {
                          setNumericInputs((prev) => ({ ...prev, [ex.id]: e.target.value }));
                          if (sub.status !== 'idle') {
                            setSubmissions((prev) => ({
                              ...prev,
                              [ex.id]: { status: 'idle', message: '' },
                            }));
                          }
                        }}
                        aria-invalid={sub.status === 'incorrect' || sub.status === 'invalid-input'}
                        aria-describedby={
                          [
                            ex.inputHint ? `${inputId}-hint` : '',
                            sub.status !== 'idle' ? errId : '',
                          ]
                            .filter(Boolean)
                            .join(' ') || undefined
                        }
                        placeholder="例: 120"
                        className="app-surface rounded-lg px-3 py-1.5 text-sm font-mono-num w-40"
                      />
                      {ex.unit && (
                        <span className="text-xs font-semibold app-text-muted">{ex.unit}</span>
                      )}
                      <button
                        type="submit"
                        className="interactive-btn rounded-lg bg-blue-700 text-white px-4 py-1.5 text-xs font-semibold cursor-pointer"
                      >
                        解答を判定する
                      </button>
                    </div>
                  </div>
                ) : (
                  <fieldset className="space-y-2">
                    <legend className="text-xs font-semibold mb-1">
                      最も適切な選択肢を選んでください
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(ex.choices ?? []).map((ch) => {
                        const checked = choiceInputs[ex.id] === ch.id;
                        return (
                          <label
                            key={ch.id}
                            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm cursor-pointer transition-colors ${
                              checked
                                ? 'border-blue-600 bg-blue-600/10 font-semibold'
                                : 'border-[var(--border-subtle)] hover:bg-[var(--surface-subtle)]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`choice-${ex.id}`}
                              value={ch.id}
                              checked={checked}
                              onChange={() => {
                                setChoiceInputs((prev) => ({ ...prev, [ex.id]: ch.id }));
                                if (sub.status !== 'idle') {
                                  setSubmissions((prev) => ({
                                    ...prev,
                                    [ex.id]: { status: 'idle', message: '' },
                                  }));
                                }
                              }}
                              className="mt-0.5 shrink-0"
                            />
                            <span>{ch.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    <button
                      type="submit"
                      className="interactive-btn rounded-lg bg-blue-700 text-white px-4 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      解答を判定する
                    </button>
                  </fieldset>
                )}

                {sub.status !== 'idle' && (
                  <div
                    id={errId}
                    className={`rounded-lg border px-3 py-2 text-xs flex items-start gap-2 ${
                      sub.status === 'correct'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                        : 'border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200'
                    }`}
                  >
                    {sub.status === 'correct' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <span className="font-medium leading-relaxed">{sub.message}</span>
                  </div>
                )}
              </form>

              {/* ヒント・ステップ解説トグル */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  aria-expanded={hintOpen}
                  aria-controls={hintId}
                  onClick={() => setOpenHints((p) => ({ ...p, [ex.id]: !p[ex.id] }))}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  {hintOpen ? 'ヒントを閉じる' : 'ヒントを見る'}
                </button>

                <button
                  type="button"
                  aria-expanded={stepsOpen}
                  aria-controls={stepsId}
                  onClick={() => setOpenSteps((p) => ({ ...p, [ex.id]: !p[ex.id] }))}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {stepsOpen ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                      ステップ解説を閉じる
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                      ステップ解説を見る
                    </>
                  )}
                </button>
              </div>

              {hintOpen && (
                <div
                  id={hintId}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed"
                >
                  <span className="font-bold">ヒント：</span>
                  {ex.hint}
                </div>
              )}

              {stepsOpen && (
                <div id={stepsId} className="app-surface-subtle rounded-lg p-4 space-y-2.5">
                  {ex.steps.map((step, idx) => (
                    <div key={idx}>
                      <div className="text-xs font-semibold app-text-muted">
                        Step {idx + 1}: {step.label}
                      </div>
                      <MathFormula block math={step.math} />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[var(--border-subtle)] text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    解答: {ex.answerSummary}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
