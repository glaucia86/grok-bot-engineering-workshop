export interface Feedback {
  id: number;
  talkId: string;
  author: string;
  comment: string;
  createdAt: string;
}

export type NewFeedback = Pick<Feedback, "talkId" | "author" | "comment">;

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
}
