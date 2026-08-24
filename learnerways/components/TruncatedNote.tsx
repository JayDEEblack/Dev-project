export default function TruncatedNote() {
  return (
    <p
      role="status"
      className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
    >
      Only the first 40,000 characters of your material were used.
    </p>
  );
}