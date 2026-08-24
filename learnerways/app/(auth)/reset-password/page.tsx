import Link from "next/link";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage(
  props: PageProps<"/reset-password">
) {
  const searchParams = await props.searchParams;
  const token = Array.isArray(searchParams.token)
    ? searchParams.token[0]
    : searchParams.token;

  if (!token) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Invalid reset link
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          This link is missing or has expired. Request a new one to continue.
        </p>
        <Link
          href="/forgot-password"
          className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}