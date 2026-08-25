import Link from "next/link";
import { notFound } from "next/navigation";

export const maxDuration = 60;

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import {
  materials,
  summaries,
  quizzes,
  flashcards,
  audioFiles,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { MAX_CONTENT_CHARS } from "@/lib/ai";
import MaterialTabs from "@/components/MaterialTabs";
import DeleteMaterialButton from "@/components/DeleteMaterialButton";
import type { Flashcard, QuizQuestion } from "@/lib/types";

function parseJson<T>(raw: string | null): T {
  if (!raw) return [] as unknown as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return [] as unknown as T;
  }
}

export default async function MaterialPage(
  props: PageProps<"/materials/[id]">
) {
  const { id } = await props.params;
  const user = await requireUser();

  const [material] = await db
    .select()
    .from(materials)
    .where(and(eq(materials.id, id), eq(materials.userId, user.id)))
    .limit(1);

  if (!material) {
    notFound();
  }

  const [summary] = await db
    .select()
    .from(summaries)
    .where(eq(summaries.materialId, id))
    .limit(1);
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.materialId, id))
    .limit(1);
  const [flashcardSet] = await db
    .select()
    .from(flashcards)
    .where(eq(flashcards.materialId, id))
    .limit(1);
  const [audio] = await db
    .select()
    .from(audioFiles)
    .where(eq(audioFiles.materialId, id))
    .limit(1);

  const questions = parseJson<QuizQuestion[]>(quiz?.questions);
  const cards = parseJson<Flashcard[]>(flashcardSet?.cards);
  const wordCount = material.content.split(/\s+/).length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          ← Back to materials
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {material.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {material.sourceType === "pdf" ? "PDF" : "Pasted text"} ·{" "}
            {wordCount.toLocaleString()} words
          </p>
        </div>
        <DeleteMaterialButton materialId={material.id} />
      </div>

      <details className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-medium text-zinc-600 dark:text-zinc-300">
          View original material
        </summary>
        <p className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          {material.content}
        </p>
      </details>

      <MaterialTabs
        materialId={material.id}
        initialSummary={summary?.content ?? null}
        initialAudioFileName={audio?.fileName ?? null}
        initialQuestions={questions}
        initialCards={cards}
        truncated={material.content.length > MAX_CONTENT_CHARS}
      />
    </div>
  );
}