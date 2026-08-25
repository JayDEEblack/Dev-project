import postgres from "postgres";

const p = postgres(process.env.DATABASE_URL, { prepare: false });
const tables = ["summary", "quiz", "flashcard", "audio_file"];
for (const t of tables) {
  const rows = await p.unsafe(`select count(*)::int as n from ${t}`);
  console.log(t + ":", rows[0].n);
}
await p.end();
