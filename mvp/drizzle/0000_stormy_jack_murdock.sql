CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"talk_id" text NOT NULL,
	"author" text NOT NULL,
	"comment" text NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
