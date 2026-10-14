import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  talkId: text("talk_id").notNull(),
  author: text("author").notNull(),
  comment: text("comment").notNull(),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
