"use client";

import { useState } from "react";
import { generateQuizAction } from "@/app/actions";
import TruncatedNote from "@/components/TruncatedNote";
import type { QuizQuestion } from "@/lib/types";

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function QuizPanel({
  materialId,
  initial,
  defaultCount,
  truncated,
}: {
  materialId: string;
  initial: QuizQuestion[];
  defaultCount: number;
  truncated: boolean;
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initial);
  const [isTruncated, setIsTruncated] = useState(truncated);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnswered =
    questions.length > 0 &&
    questions.every((_, i) => answers[i] !== undefined);

  function selectOption(qIndex: number, oIndex: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: oIndex }));
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateQuizAction(materialId, defaultCount);
      if (!result.ok) {
        throw new Error(result.error ?? "Could not generate quiz.");
      }
      setQuestions(result.questions ?? []);
      setIsTruncated(!!result.truncated);
      setAnswers({});
      setSubmitted(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function score(): number {
    return questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
      0
    );
  }

  return (
    <div className="space-y-5">
      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No quiz yet. Generate multiple-choice questions to test what you
            have learned.
          </p>
        </div>
      ) : (
        <>
          {submitted && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                score() === questions.length
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
              }`}
            >
              You scored {score()} / {questions.length}
              {score() === questions.length ? " — perfect!" : ""}
            </div>
          )}

          <ol className="space-y-5">
            {questions.map((q, qi) => (
              <li
                key={qi}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {qi + 1}. {q.question}
                </p>
                <div className="mt-3 grid gap-2">
                  {q.options.map((option, oi) => {
                    const selected = answers[qi] === oi;
                    const isCorrect = oi === q.correctIndex;
                    let style =
                      "border-zinc-200 text-zinc-700 hover:border-indigo-400 dark:border-zinc-700 dark:text-zinc-300";
                    if (submitted && isCorrect) {
                      style =
                        "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
                    } else if (
                      submitted &&
                      selected &&
                      !isCorrect
                    ) {
                      style =
                        "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300";
                    } else if (selected && !submitted) {
                      style =
                        "border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300";
                    }
                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => selectOption(qi, oi)}
                        disabled={submitted}
                        className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition disabled:cursor-default ${style}`}
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold">
                          {OPTION_LABELS[oi]}
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
                {submitted && (
                  <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    {q.explanation}
                  </p>
                )}
              </li>
            ))}
          </ol>

          <div className="flex gap-3">
            {!submitted ? (
              <button
                type="button"
                onClick={() => setSubmitted(true)}
                disabled={!allAnswered}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Check answers
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
              >
                Retry quiz
              </button>
            )}
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
            >
              {loading ? "Generating…" : "Generate new quiz"}
            </button>
          </div>
        </>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}

      {isTruncated && <TruncatedNote />}

      {questions.length === 0 && !loading && (
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Generate quiz
        </button>
      )}
    </div>
  );
}