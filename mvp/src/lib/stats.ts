export type TalkStats = { talkId: string; average: number; count: number };

export function summarize(rows: { talkId: string; rating: number }[]): TalkStats[] {
  const byTalk = new Map<string, { sum: number; count: number }>();
  for (const { talkId, rating } of rows) {
    const s = byTalk.get(talkId) ?? { sum: 0, count: 0 };
    s.sum += rating;
    s.count += 1;
    byTalk.set(talkId, s);
  }
  return [...byTalk].map(([talkId, { sum, count }]) => ({
    talkId,
    average: Math.round((sum / count) * 10) / 10,
    count,
  }));
}
