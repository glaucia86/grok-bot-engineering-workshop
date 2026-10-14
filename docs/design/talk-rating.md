# Design: Talk rating (issue 01)

## The issue in our own words

Issue `docs/issues/01-add-talk-rating.md` says only *"people should be able to rate talks"*.
Restated: an attendee who submits feedback can also give the talk a score, and anyone can see
the average score of a talk.

## Clarified decisions

| Question | Decision |
| :--- | :--- |
| Scale? | Integer 1 to 5 |
| Required? | No, optional field on `POST /feedback` |
| Where to read it? | New endpoint `GET /talks/:talkId/rating` |
| No ratings yet? | `{ talkId, average: null, count: 0 }` |
| Invalid value (0, 6, 2.5, "5")? | `400 Bad Request` |

## Contract

```http
POST /feedback
{ "talkId": "keynote", "author": "Ana", "comment": "Great", "rating": 5 }
→ 201 { "id": 1, "talkId": "keynote", "author": "Ana", "comment": "Great", "rating": 5, "createdAt": "..." }

GET /talks/keynote/rating
→ 200 { "talkId": "keynote", "average": 5, "count": 1 }
```

`average` is rounded to 2 decimals. `count` counts only feedback that has a rating.

## Types and signatures

```ts
// src/store.ts
export interface Feedback {
  id: number;
  talkId: string;
  author: string;
  comment: string;
  rating?: number; // integer 1..5
  createdAt: string;
}

export type NewFeedback = Pick<Feedback, "talkId" | "author" | "comment" | "rating">;

export interface TalkRating {
  talkId: string;
  average: number | null;
  count: number;
}

class FeedbackStore {
  add(input: NewFeedback): Feedback;
  list(talkId?: string): Feedback[];
  rating(talkId: string): TalkRating; // new
}
```

```ts
// src/app.ts
// feedbackBody schema: add  rating: { type: "integer", minimum: 1, maximum: 5 }
app.get<{ Params: { talkId: string } }>("/talks/:talkId/rating", ...); // new
```

## Files to change

- `src/store.ts`: `rating` field, `TalkRating`, `rating()` method
- `src/app.ts`: schema field + new route
- `test/app.test.ts`: new cases

## Tests

1. POST with `rating: 5` returns 201 and echoes the rating.
2. POST without rating still works (backward compatible).
3. POST with `rating: 0`, `6`, `2.5` returns 400.
4. `GET /talks/:id/rating` returns the average and count, ignoring unrated feedback.
5. A talk with no ratings returns `average: null, count: 0`.

## Out of scope

One rating per author, editing ratings, persistence.
