"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatAverage } from "@/lib/feedback-form";
import type { TalkStats } from "@/lib/stats";

const chartConfig = {
  average: {
    label: "Average",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; talks: TalkStats[] };

export function FeedbackDashboard() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/feedback", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(payload) || !payload.every(isTalkStat)) {
          setState({ status: "error" });
          return;
        }
        setState({ status: "ready", talks: payload });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        setState({ status: "error" });
      });
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((current) => current + 1);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ratings</CardTitle>
        <CardDescription>Average score for each talk, on a scale of 0 to 5.</CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "loading" ? (
          <p className="text-sm text-muted-foreground">Loading ratings...</p>
        ) : null}
        {state.status === "error" ? (
          <div className="flex flex-col items-start gap-3">
            <p role="alert" className="text-sm text-destructive">
              Could not load ratings.
            </p>
            <Button type="button" variant="outline" onClick={retry}>
              Try again
            </Button>
          </div>
        ) : null}
        {state.status === "ready" && state.talks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feedback yet.</p>
        ) : null}
        {state.status === "ready" && state.talks.length > 0 ? (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {state.talks.map((talk) => (
                <li key={talk.talkId} className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-medium">{talk.talkId}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {formatAverage(talk.average)} · {talk.count}{" "}
                    {talk.count === 1 ? "response" : "responses"}
                  </span>
                </li>
              ))}
            </ul>
            <ChartContainer config={chartConfig} className="aspect-video w-full" aria-label="Average rating by talk">
              <BarChart data={state.talks} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                <YAxis
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  width={32}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <XAxis
                  dataKey="talkId"
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatAverage(Number(value))}
                    />
                  }
                />
                <Bar dataKey="average" fill="var(--color-average)" radius={4} isAnimationActive={false}>
                  <LabelList
                    dataKey="average"
                    position="top"
                    offset={8}
                    fill="var(--foreground)"
                    fontSize={12}
                    formatter={(label) => formatAverage(Number(label))}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function isTalkStat(value: unknown): value is TalkStats {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return typeof row.talkId === "string" && typeof row.average === "number" && typeof row.count === "number";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
