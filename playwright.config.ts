import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: 0,
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  webServer: {
    command: "DATABASE_URL=file:../data/e2e DEMO_MODE=true RATE_LIMIT_DISABLED=true PORT=3100 HOSTNAME=127.0.0.1 NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3100 sh scripts/serve-standalone.sh",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: "desktop", use: { viewport: { width: 1280, height: 900 } } }, { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }],
});
