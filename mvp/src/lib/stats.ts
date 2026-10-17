export type TalkStats = { talkId: string; average: number; count: number };

export function talkKey(talkId: string): string {
  return talkId.toLowerCase();
}

export function roundedMean(sum: number, count: number): number {
  return Math.round((sum / count) * 10) / 10;
}

export function summarize(rows: { talkId: string; rating: number }[]): TalkStats[] {
  const byTalk = new Map<string, { talkId: string; sum: number; count: number }>();
  for (const { talkId, rating } of rows) {
    const key = talkKey(talkId);
    const s = byTalk.get(key) ?? { talkId, sum: 0, count: 0 };
    s.sum += rating;
    s.count += 1;
    byTalk.set(key, s);
  }
  return [...byTalk.values()].map(({ talkId, sum, count }) => ({
    talkId,
    average: roundedMean(sum, count),
    count,
  }));
}
