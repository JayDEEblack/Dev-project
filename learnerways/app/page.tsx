import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

const FEATURES = [
  {
    title: "Summarizer",
    description:
      "Paste notes or a PDF and get a clear, structured summary of the key points.",
    icon: "📝",
  },
  {
    title: "Audio version",
    description:
      "Turn your material into natural speech so you can study hands-free.",
    icon: "🔊",
  },
  {
    title: "Quiz",
    description:
      "Generate multiple-choice questions and test how well you actually know it.",
    icon: "🧠",
  },
  {
    title: "Flashcards",
    description:
      "Create flip cards to drill concepts and lock them into memory.",
    icon: "🃏",
  },
];

export default async function Home() {
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col items-center">
      <section className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="mb-6 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
          Study smarter, not harder
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Turn any study material into a complete learning kit
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-500 dark:text-zinc-400">
          Paste your notes or upload a PDF, then generate summaries, audio
          versions, quizzes, and flashcards in seconds.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="grid w-full max-w-3xl gap-4 px-6 pb-24 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="text-2xl">{feature.icon}</span>
            <h2 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {feature.title}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              {feature.description}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}