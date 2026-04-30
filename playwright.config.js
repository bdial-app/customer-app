import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/app-tests",

  use: {
    storageState: "tests/auth/auth-data/user.json",
    headless: false,
  },
});
