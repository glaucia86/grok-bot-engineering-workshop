"use client";

import { useEffect, useRef, useState } from "react";
import type { TalkStats } from "../lib/stats";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { TalkInsights } from "./talk-insights";

type DashboardState = { requestKey: string; status: "error" | "ready" };

export function FeedbackDashboard({ revision = 0, feedbackHref = "#feedback", insights = false }: { revision?: number; feedbackHref?: string; insights?: boolean }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<DashboardState | null>(null);
  const [talks, setTalks] = useState<TalkStats[] | null>(null);
  const requestKey = `${revision}:${attempt}`;
  const current = result?.requestKey === requestKey ? result : null;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/feedback", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Feedback request failed");
        const talks: TalkStats[] = await response.json();
        if (!controller.signal.aborted) {
          setTalks(talks);
          setResult({ requestKey, status: "ready" });
        }
      } catch {
        if (!controller.signal.aborted) setResult({ requestKey, status: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [requestKey]);

  return (
    <section id="results" className="dashboard-root" aria-labelledby="results-heading">
      <h2 id="results-heading" className="sr-only">Talk results</h2>
      {!current ? (
        <div className={`dashboard-state${talks !== null ? " dashboard-refresh" : ""}`} role="status">
          <p>{talks !== null ? "Refreshing results…" : "Loading feedback."}</p>
          {talks === null && <div className="dashboard-skeleton" aria-hidden="true"><span /><span /><span /></div>}
        </div>
      ) : current.status === "error" ? (
        <div className={`dashboard-state dashboard-error${talks !== null ? " dashboard-refresh" : ""}`} role="alert">
          <p>{revision > 0 ? "Feedback saved. Results could not refresh. Please try again." : "We couldn't load the feedback. Please try again."}</p>
          <button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button>
        </div>
      ) : null}
      {talks !== null && (talks.length > 0 || current?.status === "ready") && <>
        {(!current || current.status === "error") && <p className="dashboard-stale">Previously loaded results. These may not include your latest feedback.</p>}
        <TalkResults talks={talks} feedbackHref={feedbackHref} insights={insights} revision={revision} />
      </>}
    </section>
  );
}

export function TalkResults({ talks, feedbackHref = "#feedback", insights = false, revision = 0 }: { talks: TalkStats[]; feedbackHref?: string; insights?: boolean; revision?: number }) {
  const [selection, setSelection] = useState("");
  const explorer = useRef<HTMLSelectElement>(null);
  if (talks.length === 0) {
    return (
      <div className="dashboard-empty">
        <h3>No feedback yet</h3>
        <p>Leave the first review to start the conversation.</p>
        <a href={feedbackHref}>Leave feedback</a>
      </div>
    );
  }

  const selected = talks.find(talk => talk.talkId === selection) ?? talks[0];
  const mostReviewed = talks.reduce((most, talk) => talk.count > most.count ? talk : most);
  const responses = talks.reduce((total, talk) => total + talk.count, 0);
  const header = <>
    <div className="results-selected-title"><p>Selected talk</p><h3>{selected.talkId}</h3></div>
    <div className="results-detail-picker">
      <label htmlFor="talk-explorer">Explore a talk</label>
      <select ref={explorer} id="talk-explorer" value={selected.talkId} onChange={event => setSelection(event.target.value)}>
        {talks.map(talk => <option key={talk.talkId} value={talk.talkId}>{talk.talkId}</option>)}
      </select>
    </div>
  </>;
  const comparison = <Card className="results-comparison" role="region" aria-labelledby="comparison-heading">
    <CardHeader className="results-card-header"><div><h3 id="comparison-heading">Across the workshop</h3><p>Choose a talk to explore its feedback.</p></div><span className="results-panel-count">{talks.length} {talks.length === 1 ? "talk" : "talks"}</span></CardHeader>
    <CardContent className="results-table-content">
      <div className="comparison-scroll" role="region" aria-label="Talk comparison rows" data-scroll={talks.length > 6 ? "true" : undefined} tabIndex={talks.length > 6 ? 0 : undefined}>
        <table className="dashboard-table">
          <caption className="sr-only">Talk feedback summary</caption>
          <thead><tr><th scope="col">Talk</th><th scope="col">Average</th><th scope="col">Responses</th></tr></thead>
          <tbody>{talks.map(talk => <tr key={talk.talkId} data-selected={selected.talkId === talk.talkId ? "true" : undefined}>
            <th scope="row"><Button variant="ghost" type="button" className="comparison-talk-button" aria-pressed={selected.talkId === talk.talkId} onClick={() => { setSelection(talk.talkId); explorer.current?.focus(); }}>{talk.talkId}<ArrowUpRight size={16} aria-hidden="true" /></Button></th>
            <td className="dashboard-average">{talk.average.toFixed(1)} <span>/ 5</span></td>
            <td className="dashboard-count">{talk.count}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {talks.length > 6 && <p className="comparison-scroll-note">Scroll to compare all {talks.length} talks.</p>}
    </CardContent>
  </Card>;
  return <>
    <dl className="results-overview" aria-label="Workshop response summary">
      <div className="results-metric"><dt>Responses received</dt><dd><strong className="results-total">{responses}</strong></dd></div>
      <div className="results-metric"><dt>{talks.length === 1 ? "Talk reviewed" : "Talks reviewed"}</dt><dd><strong>{talks.length}</strong></dd></div>
      <div className="results-metric results-leading"><dt>Most reviewed talk</dt><dd><p>{mostReviewed.talkId}</p><span>{mostReviewed.count} {mostReviewed.count === 1 ? "rating" : "ratings"} received</span></dd></div>
    </dl>
    {insights ? <TalkInsights talkId={selected.talkId} revision={revision} header={header} comparison={comparison} /> : <>
      <Card className="results-analytics" role="region" aria-label="Selected talk feedback">
        <CardHeader className="results-analytics-header">{header}</CardHeader>
        <CardContent className="selected-summary"><strong>{selected.average.toFixed(1)}</strong><span> / 5 from {selected.count} {selected.count === 1 ? "response" : "responses"}.</span></CardContent>
      </Card>
      <div className="results-bottom-grid results-bottom-grid-summary">{comparison}</div>
    </>}
  </>;
}
