"use client";

import { useState } from "react";
import SummaryPanel from "@/components/study/SummaryPanel";
import AudioPanel from "@/components/study/AudioPanel";
import QuizPanel from "@/components/study/QuizPanel";
import FlashcardPanel from "@/components/study/FlashcardPanel";
import type { Flashcard, QuizQuestion } from "@/lib/types";

type Tab = "summary" | "audio" | "quiz" | "flashcards";

const TABS: { id: Tab; label: string }[] = [
  { id: "summary", label: "Summarizer" },
  { id: "audio", label: "Audio version" },
  { id: "quiz", label: "Quiz" },
  { id: "flashcards", label: "Flashcards" },
];

export default function MaterialTabs({
  materialId,
  initialSummary,
  initialAudioFileName,
  initialQuestions,
  initialCards,
  truncated,
}: {
  materialId: string;
  initialSummary: string | null;
  initialAudioFileName: string | null;
  initialQuestions: QuizQuestion[];
  initialCards: Flashcard[];
  truncated: boolean;
}) {
  const [tab, setTab] = useState<Tab>("summary");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <SummaryPanel
          materialId={materialId}
          initial={initialSummary}
          truncated={truncated}
        />
      )}
      {tab === "audio" && (
        <AudioPanel
          materialId={materialId}
          initialFileName={initialAudioFileName}
          truncated={truncated}
        />
      )}
      {tab === "quiz" && (
        <QuizPanel
          materialId={materialId}
          initial={initialQuestions}
          defaultCount={5}
          truncated={truncated}
        />
      )}
      {tab === "flashcards" && (
        <FlashcardPanel
          materialId={materialId}
          initial={initialCards}
          defaultCount={10}
          truncated={truncated}
        />
      )}
    </div>
  );
}