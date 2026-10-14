import Fastify, { type FastifyInstance } from "fastify";
import { FeedbackStore } from "./store.js";

const feedbackBody = {
  type: "object",
  required: ["talkId", "author", "comment"],
  additionalProperties: false,
  properties: {
    talkId: { type: "string", minLength: 1 },
    author: { type: "string", minLength: 1 },
    comment: { type: "string", minLength: 1, maxLength: 1000 },
  },
} as const;

export function buildApp(store = new FeedbackStore()): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get("/health", async () => ({ status: "ok" }));

  app.post<{ Body: { talkId: string; author: string; comment: string } }>(
    "/feedback",
    { schema: { body: feedbackBody } },
    async (request, reply) => reply.code(201).send(store.add(request.body)),
  );

  app.get<{ Querystring: { talkId?: string } }>("/feedback", async (request) =>
    store.list(request.query.talkId),
  );

  return app;
}
