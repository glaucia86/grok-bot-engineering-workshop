"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import type { TalkStats } from "../lib/stats";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";

const chartConfig = { average: { label: "Average rating", color: "#285544" } };

type DashboardState = { requestKey: string } & (
  | { status: "error" }
  | { status: "ready"; talks: TalkStats[] }
);

export function FeedbackDashboard({ revision = 0 }: { revision?: number }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<DashboardState | null>(null);
  const requestKey = `${revision}:${attempt}`;
  const current = result?.requestKey === requestKey ? result : null;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/feedback", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Feedback request failed");
        const talks: TalkStats[] = await response.json();
        if (!controller.signal.aborted) setResult({ requestKey, status: "ready", talks });
      } catch {
        if (!controller.signal.aborted) setResult({ requestKey, status: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [requestKey]);

  return (
    <section id="results" className="dashboard-root" aria-labelledby="results-heading">
      <header className="dashboard-header">
        <p className="section-number">02 / THE ROOM</p>
        <h2 id="results-heading">What the room thinks</h2>
        <p className="dashboard-intro">Every response adds to the picture.</p>
      </header>
      {!current ? (
        <div className="dashboard-state" role="status">
          <p>Loading feedback…</p>
          <div className="dashboard-skeleton" aria-hidden="true"><span /><span /><span /></div>
        </div>
      ) : current.status === "error" ? (
        <div className="dashboard-state dashboard-error" role="alert">
          <p>We couldn’t load the feedback. Please try again.</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
        </div>
      ) : <TalkResults talks={current.talks} />}
    </section>
  );
}

export function TalkResults({ talks }: { talks: TalkStats[] }) {
  if (talks.length === 0) {
    return (
      <div className="dashboard-empty">
        <span className="dashboard-empty-mark" aria-hidden="true">01</span>
        <h3>No feedback yet</h3>
        <p>Leave the first review to start the conversation.</p>
        <a href="#feedback">Leave feedback</a>
      </div>
    );
  }

  return (
    <>
      <figure className="dashboard-figure" aria-label="Average ratings by talk, from 0 to 5">
        <figcaption className="dashboard-chart-caption">
          Average rating <span>Out of 5</span>
        </figcaption>
        <div className="dashboard-chart-scroll" tabIndex={0} role="region" aria-label="Scrollable rating chart">
          <ChartContainer
            config={chartConfig}
            className="dashboard-chart"
            style={{ height: 300, width: "100%", minWidth: Math.max(320, talks.length * 136) }}
          >
            <BarChart accessibilityLayer data={talks} margin={{ top: 28, right: 24, left: 0, bottom: 20 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="talkId"
                axisLine={false}
                tickLine={false}
                interval={0}
                tickMargin={12}
                tickFormatter={(name: string) => name.length > 18 ? `${name.slice(0, 17)}…` : name}
              />
              <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} axisLine={false} tickLine={false} width={28} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent formatter={(value) => <span>{Number(value).toFixed(1)} / 5</span>} />}
              />
              <Bar dataKey="average" fill="var(--color-average)" maxBarSize={64} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey="average" position="top" formatter={(value) => Number(value).toFixed(1)} fill="#20291f" />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
        <p className="dashboard-chart-note">Exact values are listed in the table below. Long talk names are shortened in the chart.</p>
      </figure>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <caption className="sr-only">Talk feedback summary</caption>
          <thead><tr><th scope="col">Talk</th><th scope="col">Average</th><th scope="col">Responses</th></tr></thead>
          <tbody>
            {talks.map((talk) => (
              <tr key={talk.talkId}>
                <th scope="row">{talk.talkId}</th>
                <td className="dashboard-average">{talk.average.toFixed(1)} <span>/ 5</span></td>
                <td className="dashboard-count">{talk.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
