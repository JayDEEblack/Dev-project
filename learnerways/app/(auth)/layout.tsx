import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AuthLayout({
  children,
}: LayoutProps<"/">) {
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <Link href="/" className="mb-8 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        learnerways
      </Link>
      {children}
    </div>
  );
}