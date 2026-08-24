"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import {
  materials,
  summaries,
  audioFiles,
  quizzes,
  flashcards,
} from "@/lib/db/schema";
import {
  generateSummary,
  generateQuiz,
  generateFlashcards,
  generateSpeech,
  MAX_CONTENT_CHARS,
} from "@/lib/ai";
import { extractPdfText } from "@/lib/pdf";
import { getSession } from "@/lib/session";
import { enforceCooldown } from "@/lib/rate-limit";
import type { Flashcard, QuizQuestion, CreateMaterialResult } from "@/lib/types";

async function currentUser() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("You must be signed in to do that.");
  }
  return session.user;
}

async function ownedMaterial(materialId: string, userId: string) {
  const [mat] = await db
    .select()
    .from(materials)
    .where(and(eq(materials.id, materialId), eq(materials.userId, userId)))
    .limit(1);
  return mat;
}

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export async function createMaterialAction(
  formData: FormData
): Promise<CreateMaterialResult> {
  let title = String(formData.get("title") ?? "").trim();
  let textContent = String(formData.get("text") ?? "").trim();
  const file = formData.get("file");
  let sourceType: "text" | "pdf" = "text";
  let fileName: string | undefined;

  let userId: string;
  try {
    const user = await currentUser();
    userId = user.id;
  } catch (err) {
    return { ok: false, error: messageOf(err) };
  }

  try {
    await enforceCooldown(userId);

    if (file instanceof File && file.size > 0) {
      const name = file.name || "upload.pdf";
      const ext = name.split(".").pop()?.toLowerCase();
      if (ext !== "pdf") {
        return { ok: false, error: "Only PDF files are supported." };
      }
      if (file.size > 20 * 1024 * 1024) {
        return { ok: false, error: "PDF is too large (max 20 MB)." };
      }
      const buffer = await file.arrayBuffer();
      const magic = new TextDecoder("latin1").decode(buffer.slice(0, 5));
      if (!magic.startsWith("%PDF")) {
        return { ok: false, error: "That file is not a valid PDF." };
      }
      textContent = await extractPdfText(buffer);
      textContent = textContent.replace(/\x00/g, "").trim();
      sourceType = "pdf";
      fileName = name;
      if (!title) title = name.replace(/\.[^.]+$/, "");
    } else if (!textContent) {
      return {
        ok: false,
        error: "Paste your notes below or upload a PDF file.",
      };
    } else {
      textContent = textContent.replace(/\x00/g, "").trim();
    }

    if (title.length > 200) {
      return { ok: false, error: "Title is too long (max 200 characters)." };
    }
    if (textContent.length > 120_000) {
      return {
        ok: false,
        error: "Notes are too long (max 120,000 characters).",
      };
    }
    if (!title) {
      return { ok: false, error: "Please give your material a title." };
    }
    if (textContent.length < 20) {
      return {
        ok: false,
        error: "Material is too short — add at least 20 characters.",
      };
    }

    const id = randomUUID();
    await db.insert(materials).values({
      id,
      userId,
      title,
      content: textContent,
      sourceType,
      fileName,
      createdAt: new Date(),
    });

    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: messageOf(err) };
  }
}

export async function deleteMaterialAction(
  materialId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await currentUser();
    await enforceCooldown(user.id);
    const mat = await ownedMaterial(materialId, user.id);
    if (!mat) throw new Error("Material not found.");

    const [audio] = await db
      .select()
      .from(audioFiles)
      .where(eq(audioFiles.materialId, mat.id))
      .limit(1);
    if (audio) {
      const audioPath = path.join(
        process.cwd(),
        "public",
        "audio",
        audio.fileName
      );
      await unlink(audioPath).catch(() => {});
    }

    await db.delete(materials).where(eq(materials.id, mat.id));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: messageOf(err) };
  }
}

export async function generateSummaryAction(
  materialId: string
): Promise<{
  ok: boolean;
  summary?: string;
  truncated?: boolean;
  error?: string;
}> {
  try {
    const user = await currentUser();
    await enforceCooldown(user.id);
    const mat = await ownedMaterial(materialId, user.id);
    if (!mat) throw new Error("Material not found.");

    const truncated = mat.content.length > MAX_CONTENT_CHARS;
    const summary = await generateSummary(mat.content);
    await db.delete(summaries).where(eq(summaries.materialId, mat.id));
    if (summary.trim()) {
      await db.insert(summaries).values({
        id: randomUUID(),
        materialId: mat.id,
        content: summary,
        createdAt: new Date(),
      });
    }
    return { ok: true, summary, truncated };
  } catch (err) {
    return { ok: false, error: messageOf(err) };
  }
}

export async function generateAudioAction(
  materialId: string
): Promise<{
  ok: boolean;
  fileName?: string;
  truncated?: boolean;
  error?: string;
}> {
  try {
    const user = await currentUser();
    await enforceCooldown(user.id);
    const mat = await ownedMaterial(materialId, user.id);
    if (!mat) throw new Error("Material not found.");

    const truncated = mat.content.length > MAX_CONTENT_CHARS;
    const audio = await generateSpeech(mat.content);
    const dir = path.join(process.cwd(), "public", "audio");
    await mkdir(dir, { recursive: true });
    const fileName = `${mat.id}.mp3`;
    await writeFile(path.join(dir, fileName), audio);

    await db.delete(audioFiles).where(eq(audioFiles.materialId, mat.id));
    await db.insert(audioFiles).values({
      id: randomUUID(),
      materialId: mat.id,
      fileName,
      createdAt: new Date(),
    });

    return { ok: true, fileName, truncated };
  } catch (err) {
    return { ok: false, error: messageOf(err) };
  }
}

export async function generateQuizAction(
  materialId: string,
  count = 5
): Promise<{
  ok: boolean;
  questions?: QuizQuestion[];
  truncated?: boolean;
  error?: string;
}> {
  try {
    const user = await currentUser();
    await enforceCooldown(user.id);
    const mat = await ownedMaterial(materialId, user.id);
    if (!mat) throw new Error("Material not found.");

    const truncated = mat.content.length > MAX_CONTENT_CHARS;
    const questions = await generateQuiz(mat.content, count);
    await db.delete(quizzes).where(eq(quizzes.materialId, mat.id));
    await db.insert(quizzes).values({
      id: randomUUID(),
      materialId: mat.id,
      title: mat.title,
      questions: JSON.stringify(questions),
      createdAt: new Date(),
    });

    return { ok: true, questions, truncated };
  } catch (err) {
    return { ok: false, error: messageOf(err) };
  }
}

export async function generateFlashcardsAction(
  materialId: string,
  count = 10
): Promise<{
  ok: boolean;
  cards?: Flashcard[];
  truncated?: boolean;
  error?: string;
}> {
  try {
    const user = await currentUser();
    await enforceCooldown(user.id);
    const mat = await ownedMaterial(materialId, user.id);
    if (!mat) throw new Error("Material not found.");

    const truncated = mat.content.length > MAX_CONTENT_CHARS;
    const cards = await generateFlashcards(mat.content, count);
    await db.delete(flashcards).where(eq(flashcards.materialId, mat.id));
    await db.insert(flashcards).values({
      id: randomUUID(),
      materialId: mat.id,
      cards: JSON.stringify(cards),
      createdAt: new Date(),
    });

    return { ok: true, cards, truncated };
  } catch (err) {
    return { ok: false, error: messageOf(err) };
  }
}