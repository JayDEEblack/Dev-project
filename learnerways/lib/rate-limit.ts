import "server-only";

const lastRequestAt = new Map<string, number>();

export const DEFAULT_GENERATION_COOLDOWN_MS = Number(
  process.env.GENERATION_COOLDOWN_MS ?? 5000
);

export async function enforceCooldown(
  userId: string,
  ms = DEFAULT_GENERATION_COOLDOWN_MS
): Promise<void> {
  const now = Date.now();
  const last = lastRequestAt.get(userId);
  if (last !== undefined && now - last < ms) {
    const seconds = Math.ceil((ms - (now - last)) / 1000);
    throw new Error(
      `Please wait ${seconds}s before generating again (rate limit).`
    );
  }
  lastRequestAt.set(userId, now);
}