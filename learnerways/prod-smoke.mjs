import { chromium } from "@playwright/test";

const BASE = "https://learnerways.vercel.app";
const stamp = Date.now();
const email = `smoke${stamp}@test.com`;
const password = "testpass123";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function log(step, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${step}${extra ? " - " + extra : ""}`);
  if (!ok) process.exitCode = 1;
}

async function generateAndSettle(page, buttonText, emptyText, maxMs = 150000) {
  const deadline = Date.now() + maxMs;
  let lastBody = "";
  while (Date.now() < deadline) {
    lastBody = await page.evaluate(() => document.body.innerText);
    if (!lastBody.includes(emptyText)) return { ok: true };
    const errLine = lastBody
      .split("\n")
      .find((l) => l.includes("rate limit") || l.includes("Something went wrong"));
    if (errLine) {
      await sleep(6000);
      await page.click(`button:has-text("${buttonText}")`);
      continue;
    }
    await sleep(2000);
  }
  return { ok: false, body: lastBody.slice(0, 300) };
}

const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(90000);

try {
  await page.goto(`${BASE}/signup`);
  await page.fill('input[type="text"]', "Smoke Test");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
  log("signup + redirect to dashboard", true);

  await page.goto(`${BASE}/materials/new`);
  const notes =
    "Photosynthesis is the process by which green plants convert light energy into chemical energy. Chlorophyll in chloroplasts absorbs sunlight, water is split during the light reactions, and carbon dioxide is fixed into glucose in the Calvin cycle.";
  await page.fill('input[name="title"]', "Smoke Test Material");
  await page.fill("textarea", notes);
  await page.click('button:has-text("Create material")');
  await page.waitForURL(/\/materials\/[0-9a-f-]{36}/, { timeout: 120000 });
  log("create material", true);
  await sleep(6000);

  await page.click('button:has-text("Summarizer")');
  await page.click('button:has-text("Generate summary")');
  let r = await generateAndSettle(page, "Regenerate summary", "No summary yet");
  log("summary generated", r.ok, r.body || "");

  await page.click('button:has-text("Audio version")');
  await page.click('button:has-text("Generate audio")');
  try {
    await page.waitForSelector("audio", { timeout: 180000 });
    log("audio generated", true);
  } catch {
    log("audio generated", false);
  }

  await sleep(6000);
  await page.click('button:has-text("Quiz")');
  await page.click('button:has-text("Generate quiz")');
  r = await generateAndSettle(page, "Generate new quiz", "No quiz yet");
  log("quiz generated", r.ok, r.body || "");

  await sleep(6000);
  await page.click('button:has-text("Flashcards")');
  await page.click('button:has-text("Generate flashcards")');
  r = await generateAndSettle(page, "Generate new set", "No flashcards yet");
  log("flashcards generated", r.ok, r.body || "");
} catch (err) {
  log("unexpected error", false, err.message.split("\n")[0]);
} finally {
  await browser.close();
}
