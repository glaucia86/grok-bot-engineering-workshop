import Fastify, { type FastifyInstance } from "fastify";
import { FeedbackStore, type NewFeedback } from "./store.js";

const feedbackBody = {
  type: "object",
  required: ["talkId", "author", "comment"],
  additionalProperties: false,
  properties: {
    talkId: { type: "string", minLength: 1 },
    author: { type: "string", minLength: 1 },
    comment: { type: "string", minLength: 1, maxLength: 1000 },
    rating: { type: "integer", minimum: 1, maximum: 5 },
  },
} as const;

export function buildApp(store = new FeedbackStore()): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get("/health", async () => ({ status: "ok" }));

  app.post<{ Body: NewFeedback }>(
    "/feedback",
    { schema: { body: feedbackBody } },
    async (request, reply) => reply.code(201).send(store.add(request.body)),
  );

  app.get<{ Querystring: { talkId?: string } }>("/feedback", async (request) =>
    store.list(request.query.talkId),
  );

  app.get<{ Params: { talkId: string } }>("/talks/:talkId/rating", async (request) =>
    store.rating(request.params.talkId),
  );

  return app;
}
