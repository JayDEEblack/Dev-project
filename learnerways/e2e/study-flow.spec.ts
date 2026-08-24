import { test, expect } from "@playwright/test";

test("full study flow: signup, create material, generate all four tools, sign out", async ({
  page,
}) => {
  const email = `e2e_${Date.now()}@example.com`;

  await page.goto("/signup");
  await page.getByLabel("Name").fill("E2E Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/dashboard/);

  await expect(page.getByRole("heading", { name: "Your materials" })).toBeVisible();
  await page.getByRole("link", { name: "New material" }).first().click();

  await page.getByLabel("Title").fill("Photosynthesis Notes");
  await page.getByLabel("Your notes").fill(
    "Photosynthesis is the process plants use to convert light energy into chemical energy. " +
      "It happens in chloroplasts. The main output is glucose and oxygen. " +
      "The light reactions and the Calvin cycle are the two major stages. " +
      "Chlorophyll absorbs red and blue light."
  );
  await page.getByRole("button", { name: "Create material" }).click();
  await page.waitForURL(/\/materials\/[A-Za-z0-9]+$/);

  await expect(page.getByRole("heading", { name: "Photosynthesis Notes" })).toBeVisible();

  await page.getByRole("button", { name: "Generate summary" }).click();
  await expect(page.getByText("Mock study summary")).toBeVisible();

  await page.getByRole("button", { name: "Audio version" }).click();
  await page.getByRole("button", { name: "Generate audio" }).click();
  const audio = page.locator("audio");
  await expect(audio).toBeVisible();
  await expect
    .poll(async () => audio.getAttribute("src"))
    .toMatch(/\/audio\/.+/);

  await page.getByRole("button", { name: "Quiz" }).click();
  await page.getByRole("button", { name: "Generate quiz" }).click();
  await expect(
    page.getByText("What is the main output of photosynthesis?")
  ).toBeVisible();
  await page.getByRole("button", { name: "B Glucose" }).click();
  await page.getByRole("button", { name: "Check answers" }).click();
  await expect(page.getByText("You scored 1 / 1")).toBeVisible();

  await page.getByRole("button", { name: "Flashcards" }).click();
  await page.getByRole("button", { name: "Generate flashcards" }).click();
  const card = page.getByRole("button").filter({
    hasText: "What is photosynthesis?",
  });
  await expect(card).toBeVisible();
  await card.click();
  await expect(page.getByText("The process of converting light into chemical energy.")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
});