import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import { requireUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            learnerways
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/materials/new"
              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              New material
            </Link>
            <span className="hidden text-sm text-zinc-400 sm:inline">
              {user.name}
            </span>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}