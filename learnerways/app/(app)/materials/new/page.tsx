import Link from "next/link";
import NewMaterialForm from "@/components/NewMaterialForm";
import { requireUser } from "@/lib/session";

export const maxDuration = 60;

export default async function NewMaterialPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          ← Back to materials
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          New material
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Paste your notes or upload a PDF to get started.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <NewMaterialForm />
      </div>
    </div>
  );
}