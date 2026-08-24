"use client";

import { useState } from "react";
import { generateSummaryAction } from "@/app/actions";
import TruncatedNote from "@/components/TruncatedNote";

export default function SummaryPanel({
  materialId,
  initial,
  truncated,
}: {
  materialId: string;
  initial: string | null;
  truncated: boolean;
}) {
  const [summary, setSummary] = useState<string | null>(initial);
  const [isTruncated, setIsTruncated] = useState(truncated);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateSummaryAction(materialId);
      if (!result.ok) {
        throw new Error(result.error ?? "Could not generate summary.");
      }
      setSummary(result.summary ?? "");
      setIsTruncated(!!result.truncated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {summary ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            {summary}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No summary yet. Generate a concise study summary of your material.
          </p>
        </div>
      )}

      {isTruncated && <TruncatedNote />}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Summarizing…" : summary ? "Regenerate summary" : "Generate summary"}
      </button>
    </div>
  );
}