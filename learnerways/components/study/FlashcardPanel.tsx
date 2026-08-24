"use client";

import { useState } from "react";
import { generateFlashcardsAction } from "@/app/actions";
import TruncatedNote from "@/components/TruncatedNote";
import type { Flashcard } from "@/lib/types";

export default function FlashcardPanel({
  materialId,
  initial,
  defaultCount,
  truncated,
}: {
  materialId: string;
  initial: Flashcard[];
  defaultCount: number;
  truncated: boolean;
}) {
  const [cards, setCards] = useState<Flashcard[]>(initial);
  const [isTruncated, setIsTruncated] = useState(truncated);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateFlashcardsAction(materialId, defaultCount);
      if (!result.ok) {
        throw new Error(result.error ?? "Could not generate flashcards.");
      }
      setCards(result.cards ?? []);
      setIsTruncated(!!result.truncated);
      setIndex(0);
      setFlipped(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function go(step: number) {
    setIndex((i) => Math.min(Math.max(0, i + step), cards.length - 1));
    setFlipped(false);
  }

  if (cards.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No flashcards yet. Generate flip cards to drill the key concepts.
          </p>
        </div>
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
          {loading ? "Generating flashcards…" : "Generate flashcards"}
        </button>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>
          Card {index + 1} of {cards.length}
        </span>
        <span>{flipped ? "Back" : "Front"}</span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
      >
        <p className="text-sm font-medium text-indigo-500 dark:text-indigo-400">
          {flipped ? "ANSWER" : "QUESTION"}
        </p>
        <p className="mt-3 text-lg leading-7 text-zinc-900 dark:text-zinc-50">
          {flipped ? card.back : card.front}
        </p>
      </button>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
        >
          Previous
        </button>
        <span className="text-xs text-zinc-400">
          Click the card to flip it
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === cards.length - 1}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
        >
          Next
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}

      {isTruncated && <TruncatedNote />}

      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
      >
        {loading ? "Generating…" : "Generate new set"}
      </button>
    </div>
  );
}