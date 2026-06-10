import { test, expect } from "@playwright/test";

// "Everything renders" guard: no page should scroll sideways (the classic
// mobile breakage). Runs at both viewports via the projects in the config.
async function horizontalOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}

test("login renders with no horizontal overflow", async ({ page }) => {
  await page.goto("/login");
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
});

test("a task row renders with no horizontal overflow", async ({ page }) => {
  await page.goto("/smoke");
  await expect(
    page.locator('textarea[placeholder="Untitled task"]:visible').first(),
  ).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
});
