// Only a loopback Next.js process; explicit blank prevents .env credential loading.
import { spawn } from "node:child_process";
const child = spawn(process.execPath, [
  "node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", "3187",
], {
  env: { ...process.env, DATABASE_URL: "", NEXT_TELEMETRY_DISABLED: "1" },
  stdio: "inherit",
});
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", () => process.exit(1));
child.on("exit", (code) => process.exit(code ?? 1));
