"use client";
import { useEffect, useState } from "react";
import { Star, MessageSquare } from "lucide-react";

export type TalkInsight = { talkId: string; count: number; average: number; distribution: number[]; comments: { text: string; date: string }[] };
type Load = { key: string; data?: TalkInsight; failed?: boolean };
export function TalkInsights({ talkId, revision = 0 }: { talkId: string; revision?: number }) {
  const [attempt, setAttempt] = useState(0);
  const [load, setLoad] = useState<Load | null>(null);
  const key = `${talkId}:${revision}:${attempt}`;
  const current = load?.key === key ? load : null;
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/feedback/insights?talkId=${encodeURIComponent(talkId)}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Details unavailable");
        const data: TalkInsight = await response.json();
        if (!controller.signal.aborted) setLoad({ key, data });
      } catch {
        if (!controller.signal.aborted) setLoad({ key, failed: true });
      }
    })();
    return () => controller.abort();
  }, [talkId, key]);
  if (!current) return <div className="insight-loading" role="status"><p>Loading rating details.</p><span aria-hidden="true" /></div>;
  if (current.failed || !current.data) return <div className="insight-unavailable"><p role="status">Rating details and comments couldn&apos;t load. The talk comparison is still available.</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Retry details</button></div>;
  const data = current.data;
  const positive = Math.round((data.distribution[3] + data.distribution[4]) / data.count * 100);
  return <>
    <div className="insight-score"><div><strong>{data.average.toFixed(1)}</strong><span>out of 5</span></div><p><Star size={18} aria-hidden="true" />{data.count} {data.count === 1 ? "rating" : "ratings"}<span>{positive}% rated 4 or 5</span></p></div>
    <section className="rating-distribution" aria-labelledby="distribution-heading"><h4 id="distribution-heading">How the room rated it</h4><ul aria-label="Rating distribution">{[5, 4, 3, 2, 1].map(rating => <li key={rating}><span>{rating} {rating === 1 ? "star" : "stars"}</span><div className="distribution-track" aria-hidden="true"><span style={{ width: `${data.distribution[rating - 1] / data.count * 100}%` }} /></div><strong>{data.distribution[rating - 1]}</strong></li>)}</ul><p>Counts of individual ratings, including responses without comments.</p></section>
    <section className="talk-comments" aria-labelledby="comments-heading"><header><h4 id="comments-heading"><MessageSquare size={18} aria-hidden="true" />Written feedback</h4><span>{data.comments.length}</span></header>{data.comments.length ? <ul>{data.comments.map((comment, index) => <li key={`${comment.date}:${index}`}><p>{comment.text}</p><time dateTime={comment.date}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(comment.date))}</time></li>)}</ul> : <p className="comments-empty">No written comments yet.</p>}</section>
  </>;
}
