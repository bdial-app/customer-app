import { test as setup } from "@playwright/test";

setup("authenticate", async ({ page }) => {
  await page.goto("http://localhost:3000");

  await page.pause();

  await page.context().storageState({
    path: "tests/auth/auth-data/user.json",
  });
});
