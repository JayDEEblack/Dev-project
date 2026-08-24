import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { materials } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireUser();
  const list = await db
    .select()
    .from(materials)
    .where(eq(materials.userId, user.id))
    .orderBy(desc(materials.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Your materials
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Pick one to summarize, listen to, quiz, or flip into flashcards.
          </p>
        </div>
        <Link
          href="/materials/new"
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          New material
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            No materials yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Add your first set of notes or a PDF to start creating study
            materials.
          </p>
          <Link
            href="/materials/new"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Create your first material
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((material) => (
            <li key={material.id}>
              <Link
                href={`/materials/${material.id}`}
                className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800"
              >
                <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {material.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-zinc-500 dark:text-zinc-400">
                  {material.content.slice(0, 160)}
                </p>
                <p className="mt-3 text-xs text-zinc-400">
                  {material.sourceType === "pdf" ? "PDF" : "Pasted text"} ·{" "}
                  {material.content.split(/\s+/).length.toLocaleString()} words
                  ·{" "}
                  {material.createdAt.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}