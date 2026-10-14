import { buildApp } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
const app = buildApp();

app.listen({ port, host: process.env.HOST ?? "0.0.0.0" }).then(() => {
  console.log(`Talk Feedback API listening on http://localhost:${port}`);
});
