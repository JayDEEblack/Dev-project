import "server-only";
import OpenAI from "openai";
import * as msedge from "msedge-tts";
import type { QuizQuestion, Flashcard } from "@/lib/types";

export const MAX_CONTENT_CHARS = 40000;

const useOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);

export const CHAT_MODEL =
  process.env.OPENAI_MODEL ??
  (useOpenRouter ? "minimax/minimax-m3:free" : "gpt-4o-mini");

const MODEL_CHAIN = Array.from(
  new Set(
    [
      CHAT_MODEL,
      ...(useOpenRouter
        ? [
            "z-ai/glm-5.2:free",
            "google/gemma-4-31b-it:free",
            "openrouter/free",
          ]
        : []),
    ].filter(Boolean)
  )
);

export const TTS_VOICE = process.env.TTS_VOICE || "en-US-JennyNeural";

if (!useOpenRouter && !process.env.OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY (or OPENROUTER_API_KEY for the free tier) is not set in .env"
  );
}

const client = new OpenAI({
  apiKey: useOpenRouter
    ? String(process.env.OPENROUTER_API_KEY)
    : String(process.env.OPENAI_API_KEY),
  baseURL:
    process.env.OPENAI_BASE_URL ||
    (useOpenRouter ? "https://openrouter.ai/api/v1" : undefined),
});

function trimInput(text: string): string {
  return text.length > MAX_CONTENT_CHARS
    ? text.slice(0, MAX_CONTENT_CHARS) + "\n[...truncated]"
    : text;
}

function contentToString(
  content: string | Array<{ type: string; text?: string }> | null
): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  return content
    .map((part) => (part.type === "text" ? part.text ?? "" : ""))
    .join("");
}

async function chatCompletion(
  system: string,
  user: string,
  useJsonMode: boolean,
  model: string
): Promise<string> {
  const completion = await client.chat.completions.create({
    model,
    max_tokens: 2000,
    response_format: useJsonMode ? { type: "json_object" } : undefined,
    messages: [
      { role: "system", content: system },
      { role: "user", content: trimInput(user) },
    ],
    temperature: useJsonMode ? 0 : undefined,
  });
  return contentToString(completion.choices[0]?.message?.content);
}

async function chatText(
  system: string,
  user: string
): Promise<string> {
  for (const model of MODEL_CHAIN) {
    const text = await chatCompletion(system, user, false, model);
    if (text.trim() !== "") return text;
  }
  throw new Error("The AI returned an empty response. Try again.");
}

function extractJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
  }
  throw new Error("The AI returned invalid JSON. Try again.");
}

async function chatJson<T>(
  system: string,
  user: string
): Promise<T> {
  const instruction =
    system +
    "\nRespond with valid strict JSON only. No markdown code fences, no commentary, no extra keys.";

  let lastError: Error | null = null;
  for (const model of MODEL_CHAIN) {
    // First attempt uses the API's JSON mode; a fallback attempt drops it
    // because some free models mishandle response_format.
    for (const useJsonMode of [true, false]) {
      let raw = "";
      try {
        raw = await chatCompletion(
          useJsonMode
            ? instruction
            : instruction + "\nDo not wrap the JSON in code fences.",
          user,
          useJsonMode,
          model
        );
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
      if (raw.trim() === "") {
        lastError = new Error("The AI returned an empty response.");
        continue;
      }
      try {
        return extractJson<T>(raw);
      } catch {
        lastError = new Error("The AI returned invalid JSON. Try again.");
      }
    }
  }
  throw (
    lastError ?? new Error("The AI failed to respond. Try again.")
  );
}

export async function generateSummary(text: string): Promise<string> {
  return chatText(
    [
      "You are a study assistant that writes clear, concise study summaries.",
      "Summarize the user's study material in structured markdown.",
      "Use headings, bullet points, and key takeaways where helpful.",
      "Keep it faithful to the source; do not invent facts.",
    ].join("\n"),
    text
  );
}

export async function generateQuiz(
  text: string,
  count = 5
): Promise<QuizQuestion[]> {
  const result = await chatJson<{ questions: QuizQuestion[] }>(
    [
      `Generate ${count} multiple-choice quiz questions from the study material.`,
      "Each question must have exactly 4 options with only one correct answer.",
      "correctIndex must be the 0-based index of the correct option.",
      "Shuffle the correct answer into a different position each time.",
      "Include a short explanation for each question.",
      "Output shape: {\"questions\": [{\"question\": string, \"options\": [4 strings], \"correctIndex\": number, \"explanation\": string}]}",
    ].join("\n"),
    text
  );

  if (!Array.isArray(result.questions)) {
    throw new Error("The AI returned invalid JSON. Try again.");
  }
  return result.questions.slice(0, count);
}

export async function generateFlashcards(
  text: string,
  count = 10
): Promise<Flashcard[]> {
  const result = await chatJson<{ cards: Flashcard[] }>(
    [
      `Create ${count} flashcards from the study material.`,
      'Each card has "front" (a question, term, or prompt) and "back" (the answer or explanation).',
      "Make the backs concise but complete enough to study from.",
      "Output shape: {\"cards\": [{\"front\": string, \"back\": string}]}",
    ].join("\n"),
    text
  );

  if (!Array.isArray(result.cards)) {
    throw new Error("The AI returned invalid JSON. Try again.");
  }
  return result.cards.slice(0, count);
}

function chunkForTts(text: string, maxLen = 1500): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const piece = sentence.trim();
    if (!piece) continue;
    if ((current + piece).length > maxLen) {
      if (current) chunks.push(current.trim());
      current = piece.length > maxLen ? piece.slice(0, maxLen) : piece;
    } else {
      current += ` ${piece}`;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [""];
}

export async function generateSpeech(text: string): Promise<Buffer> {
  const tts = new msedge.MsEdgeTTS();
  try {
    await tts.setMetadata(
      TTS_VOICE,
      msedge.OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
    );
    const parts: Buffer[] = [];
    for (const chunk of chunkForTts(trimInput(text))) {
      const { audioStream } = await tts.toStream(chunk);
      const frames: Buffer[] = [];
      for await (const data of audioStream) {
        frames.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
      }
      parts.push(Buffer.concat(frames));
    }
    return Buffer.concat(parts);
  } finally {
    tts.close();
  }
}

export { client as openai };