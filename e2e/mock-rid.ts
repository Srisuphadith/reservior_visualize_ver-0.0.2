// Serves a saved RID response so integration tests never call the live RID API.
const fixturePath = process.env.FIXTURE ?? `${import.meta.dir}/../backend/test/fixtures/rid-2026-10-03.json`;
const port = Number(process.env.PORT ?? 4000);
const body = await Bun.file(fixturePath).text();

Bun.serve({
  port,
  hostname: "0.0.0.0",
  fetch: () => new Response(body, { headers: { "content-type": "application/json" } }),
});

console.log(`mock RID serving ${fixturePath} on :${port}`);
