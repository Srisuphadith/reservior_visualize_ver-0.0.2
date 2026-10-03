import { expect, test } from "@playwright/test";

// Data comes from the mock RID fixture (backend/test/fixtures/rid-2026-10-03.json).

test("nginx serves the app and proxies the API", async ({ request }) => {
  const page = await request.get("/");
  expect(page.ok()).toBe(true);
  expect(await page.text()).toContain('<div id="root">');

  const health = await request.get("/api/health");
  expect(await health.json()).toEqual({ status: "ok" });

  const summary = await (await request.get("/api/summary")).json();
  expect(summary).toMatchObject({ date: "2026-10-03", total: 461, stale: false });
  expect(summary.regions).toHaveLength(6);
});

test("nginx sets security and cache headers", async ({ request }) => {
  const page = await request.get("/");
  expect(page.headers()["x-content-type-options"]).toBe("nosniff");
  expect(page.headers()["cache-control"]).toBe("no-cache");
  expect(page.headers()["server"]).toBe("nginx");

  const asset = (await page.text()).match(/\/assets\/[^"]+\.js/)?.[0];
  expect(asset).toBeTruthy();
  const res = await request.get(asset!);
  expect(res.ok()).toBe(true);
  expect(res.headers()["cache-control"]).toContain("immutable");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");

  const api = await request.get("/api/health");
  expect(api.headers()["x-content-type-options"]).toBe("nosniff");
});

test("unknown client routes fall back to the app", async ({ request }) => {
  const res = await request.get("/some/deep/link");
  expect(res.ok()).toBe(true);
  expect(await res.text()).toContain('<div id="root">');
});

test("dashboard renders with data and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto("/");
  await expect(page.getByText("3 ต.ค. 2569").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /รายชื่ออ่างเก็บน้ำ/ })).toContainText("461");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(462);
  expect(errors).toEqual([]);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("region filter updates every section and the URL", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("ภาค", { exact: true }).selectOption("ภาคใต้");

  await expect(page).toHaveURL(/region=/);
  await expect(page.getByRole("heading", { name: /รายชื่ออ่างเก็บน้ำ/ })).toContainText("44");
  await expect(page.getByRole("heading", { name: /จำนวนอ่างตามสถานะน้ำ/ })).toContainText("ภาคใต้");
  const lowest = page.getByRole("region", { name: /10 อ่างที่น้ำน้อยที่สุด/ });
  await expect(lowest.getByText("ภาคใต้").first()).toBeVisible();
  await expect(lowest.getByText("ภาคตะวันออกเฉียงเหนือ")).toHaveCount(0);

  await page.reload();
  await expect(page.getByLabel("ภาค", { exact: true })).toHaveValue("ภาคใต้");
});

test("clicking a table row opens the detail drawer", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("ค้นหา").fill("rsv545");
  await page.getByRole("table").getByText("อ่างเก็บน้ำบึงละหาน").click();

  const dialog = page.getByRole("dialog", { name: "อ่างเก็บน้ำบึงละหาน" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("182.7%");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
