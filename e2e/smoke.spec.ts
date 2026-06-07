import { test, expect } from "@playwright/test";

test("app boots: login renders the Punch List wordmark + tagline", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Punch");
  await expect(
    page.getByText("Built loud. Built heavy. Built to last."),
  ).toBeVisible();
});

test("task title accepts a paragraph break (plain Enter inserts a newline)", async ({
  page,
}) => {
  await page.goto("/smoke");
  const title = page
    .locator('textarea[placeholder="Untitled task"]:visible')
    .first();
  await expect(title).toBeVisible();

  await title.click();
  await title.fill("");
  await title.pressSequentially("First line");
  await title.press("Enter");
  await title.pressSequentially("Second line");

  const value = await title.inputValue();
  expect(value).toContain("\n");
  expect(value).toContain("First line");
  expect(value).toContain("Second line");
});

test("Cmd/Ctrl+Enter commits the title and exits the field", async ({
  page,
}) => {
  await page.goto("/smoke");
  const title = page
    .locator('textarea[placeholder="Untitled task"]:visible')
    .first();
  await title.click();
  await expect(title).toBeFocused();
  await title.press("Control+Enter");
  await expect(title).not.toBeFocused();
});
