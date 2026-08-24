"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createMaterialAction } from "@/app/actions";

type InputMode = "text" | "pdf";

export default function NewMaterialForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<InputMode>("text");
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await createMaterialAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Could not create material.");
        setLoading(false);
        return;
      }
      router.push(`/materials/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create material.");
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          placeholder="e.g. Chapter 3 — Photosynthesis"
        />
      </div>

      <div>
        <p className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Source
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              mode === "text"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            Paste text
          </button>
          <button
            type="button"
            onClick={() => setMode("pdf")}
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              mode === "pdf"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            Upload PDF
          </button>
        </div>
      </div>

      {mode === "text" ? (
        <div>
          <label
            htmlFor="text"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Your notes
          </label>
          <textarea
            id="text"
            name="text"
            rows={12}
            className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            placeholder="Paste a chapter, lecture notes, article text…"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Larger texts work best — the AI can summarize, quiz, and more from
            long notes.
          </p>
        </div>
      ) : (
        <div>
          <label
            htmlFor="file"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            PDF file
          </label>
          <label
            htmlFor="file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-white px-4 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-indigo-950/20"
          >
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {fileName || "Click to choose a PDF"}
            </span>
            <span className="mt-1 text-xs text-zinc-400">
              Text will be extracted automatically. Max 20 MB.
            </span>
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          />
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {loading
          ? mode === "pdf"
            ? "Extracting text…"
            : "Saving…"
          : "Create material"}
      </button>
    </form>
  );
}