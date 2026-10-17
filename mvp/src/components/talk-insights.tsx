"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MessageSquare, Star } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "./ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { Button } from "./ui/button";

export type TalkInsight = { talkId: string; count: number; average: number; distribution: number[]; comments: { text: string; date: string }[] };
type Load = { key: string; data?: TalkInsight; failed?: boolean };
const chartConfig = { count: { label: "Ratings", color: "#244be8" } };
const percent = (count: number, total: number) => new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(total ? count / total * 100 : 0);

export function TalkInsights({ talkId, revision = 0, header, comparison }: { talkId: string; revision?: number; header?: ReactNode; comparison?: ReactNode }) {
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

  const data = current?.data;
  const positive = data?.count ? Math.round((data.distribution[3] + data.distribution[4]) / data.count * 100) : null;
  const chartData = data ? [1,2,3,4,5].map(rating => ({ rating: String(rating), count: data.distribution[rating - 1], share: percent(data.distribution[rating - 1], data.count) })) : [];
  return <>
    <Card className="results-analytics" role="region" aria-label="Selected talk feedback">
      <CardHeader className="results-analytics-header">{header ?? <div className="results-selected-title"><p>Selected talk</p><h3>{talkId}</h3></div>}</CardHeader>
      {!current ? <CardContent className="insight-loading" role="status"><p>Loading rating details.</p><span aria-hidden="true" /></CardContent> : !data ? <CardContent className="insight-unavailable"><p role="status">Rating details and comments couldn&apos;t load. The talk comparison is still available.</p><Button variant="outline" type="button" onClick={() => setAttempt(value => value + 1)}>Retry details</Button></CardContent> : <CardContent className="results-analytics-body" data-sparse={data.count <= 1 ? "true" : undefined}>
        <div className="insight-summary">
          <p className="insight-eyebrow">Average rating</p>
          <div className="insight-score"><div><strong>{data.count ? data.average.toFixed(1) : "—"}</strong><span>out of 5</span></div><p className="insight-favorable"><Star size={16} aria-hidden="true" />{positive === null ? "No ratings yet" : `${positive}% rated 4 or 5`}</p></div>
          <p className="insight-sample">{data.count === 1 ? "Based on 1 response. This is an early signal." : data.count === 0 ? "No responses have been recorded for this talk." : `Based on ${data.count} responses.`}</p>
          <p className="insight-context">Every rating counts equally. Explore the spread to see the whole picture.</p>
        </div>
        <figure className="rating-distribution" aria-label={`Rating distribution for ${talkId}`}>
          <figcaption><h4>How the room rated it</h4><span>Individual ratings · counts by score</span></figcaption>
          <ChartContainer config={chartConfig} className="distribution-chart" initialDimension={{ width: 640, height: 230 }}>
            <BarChart accessibilityLayer data={chartData} margin={{ top: 16, right: 12, left: -20, bottom: 0 }} barSize={48}>
              <CartesianGrid vertical={false} stroke="#e5eaf2" />
              <XAxis dataKey="rating" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "#59657c", fontSize: 13 }} />
              <YAxis domain={[0, Math.max(data.count, 1)]} allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#59657c", fontSize: 12 }} width={48} />
              <ChartTooltip cursor={{ fill: "#eef2ff" }} content={<ChartTooltipContent hideLabel formatter={(value, _name, item) => <span>{item.payload.rating} {item.payload.rating === "1" ? "star" : "stars"}: {String(value)} {Number(value) === 1 ? "rating" : "ratings"} ({item.payload.share}%)</span>} />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[6,6,0,0]} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
          <ul className="distribution-values" aria-label="Rating distribution">{chartData.map(bin => <li key={bin.rating} aria-label={`${bin.rating} ${bin.rating === "1" ? "star" : "stars"}: ${bin.count} ${bin.count === 1 ? "rating" : "ratings"} (${bin.share}%)`}><span className="distribution-rating">{bin.rating} {bin.rating === "1" ? "star" : "stars"}</span><strong>{bin.count}</strong><span className="distribution-percentage">{bin.share}%</span></li>)}</ul>
          <p>Counts include responses without written comments.</p>
        </figure>
      </CardContent>}
    </Card>
    <div className="results-bottom-grid">
      {comparison}
      <Card className="talk-comments" role="region" aria-labelledby="comments-heading">
        <CardHeader className="results-card-header"><header><div><h3 id="comments-heading"><MessageSquare size={18} aria-hidden="true" />Written feedback</h3><p>Comments for the selected talk.</p></div><span>{data ? `${data.comments.length} ${data.comments.length === 1 ? "comment" : "comments"}` : "—"}</span></header></CardHeader>
        <CardContent className="comments-content">{!current ? <p className="comments-empty">Loading comments…</p> : !data ? <p className="comments-empty">Comments will be available when rating details load.</p> : data.comments.length ? <ul aria-label="Written feedback comments" tabIndex={0}>{data.comments.map((comment, index) => <li key={`${comment.date}:${index}`}><p>{comment.text}</p><time dateTime={comment.date}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(comment.date))}</time></li>)}</ul> : <div className="comments-empty"><MessageSquare size={24} aria-hidden="true" /><p>No written comments yet.</p><span>Ratings are included even when a comment isn&apos;t provided.</span></div>}</CardContent>
      </Card>
    </div>
  </>;
}
