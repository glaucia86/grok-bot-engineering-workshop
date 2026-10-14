export interface Feedback {
  id: number;
  talkId: string;
  author: string;
  comment: string;
  rating?: number;
  createdAt: string;
}

export type NewFeedback = Pick<Feedback, "talkId" | "author" | "comment" | "rating">;

export interface TalkRating {
  talkId: string;
  average: number | null;
  count: number;
}

export class FeedbackStore {
  private items: Feedback[] = [];
  private nextId = 1;

  add(input: NewFeedback): Feedback {
    const item: Feedback = { id: this.nextId++, ...input, createdAt: new Date().toISOString() };
    this.items.push(item);
    return item;
  }

  list(talkId?: string): Feedback[] {
    return talkId ? this.items.filter((f) => f.talkId === talkId) : [...this.items];
  }

  rating(talkId: string): TalkRating {
    const ratings = this.list(talkId)
      .map((f) => f.rating)
      .filter((r): r is number => r !== undefined);
    if (ratings.length === 0) return { talkId, average: null, count: 0 };
    const sum = ratings.reduce((a, b) => a + b, 0);
    return { talkId, average: Math.round((sum / ratings.length) * 100) / 100, count: ratings.length };
  }
}
