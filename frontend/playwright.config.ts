import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/test",
  webServer: {
    command: "npm run dev",
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
});
