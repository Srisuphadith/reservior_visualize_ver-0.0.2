import { createApp } from "./app";
import { loadConfig } from "./config";
import { createRidSource } from "./rid-client";

const config = loadConfig();

const source = createRidSource({
  url: config.ridApiUrl,
  ttlMs: config.cacheTtlMs,
  timeoutMs: config.ridTimeoutMs,
});

createApp(source).listen({ port: config.port, hostname: "0.0.0.0" });

console.log(`api listening on :${config.port}`);
