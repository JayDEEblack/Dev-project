"use client";

import { useState } from "react";
import { generateAudioAction } from "@/app/actions";
import TruncatedNote from "@/components/TruncatedNote";

export default function AudioPanel({
  materialId,
  initialFileName,
  truncated,
}: {
  materialId: string;
  initialFileName: string | null;
  truncated: boolean;
}) {
  const [fileName, setFileName] = useState<string | null>(initialFileName);
  const [isTruncated, setIsTruncated] = useState(truncated);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateAudioAction(materialId);
      if (!result.ok) {
        throw new Error(result.error ?? "Could not generate audio.");
      }
      setFileName(result.fileName ?? null);
      setIsTruncated(!!result.truncated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {fileName ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Listen while you study
          </p>
          <audio controls className="w-full" src={`/api/audio/${materialId}`}>
            Your browser does not support the audio element.
          </audio>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No audio yet. Generate an audio version of your material so you can
            listen on the go.
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
        {loading ? "Generating audio…" : fileName ? "Regenerate audio" : "Generate audio"}
      </button>
    </div>
  );
}