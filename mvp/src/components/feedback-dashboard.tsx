"use client";

import { useEffect, useRef, useState } from "react";
import type { TalkStats } from "../lib/stats";
import { ArrowUpRight } from "lucide-react";
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
      <header className="dashboard-header">
        <h2 id="results-heading">Talk results</h2>
        <p className="dashboard-intro">Every response adds perspective. Compare the talks, then read the feedback behind the score.</p>
      </header>
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
  return (
    <>
      <div className="results-overview"><div><strong className="results-total">{responses}</strong><span>Responses received</span></div><div><strong>{talks.length}</strong><span>{talks.length === 1 ? "Talk reviewed" : "Talks reviewed"}</span></div><div className="results-leading"><span>Most reviewed talk</span><p>{mostReviewed.talkId}</p><span>{mostReviewed.count} ratings received</span></div></div>
      <div className="results-workspace">
      <aside className="results-detail" aria-label="Selected talk feedback">
        <label htmlFor="talk-explorer">Explore a talk</label>
        <select ref={explorer} id="talk-explorer" value={selected.talkId} onChange={event => setSelection(event.target.value)}>{talks.map(talk => <option key={talk.talkId} value={talk.talkId}>{talk.talkId}</option>)}</select>
        <h3>{selected.talkId}</h3>
        {insights ? <TalkInsights talkId={selected.talkId} revision={revision} /> : <p className="selected-summary">{selected.average.toFixed(1)} / 5 from {selected.count} {selected.count === 1 ? "response" : "responses"}.</p>}
      </aside>
      <div className="results-comparison"><h3>Across the workshop</h3><p className="results-section-note">Each talk on the same five-point scale.</p>
      <figure className="dashboard-figure" aria-label="Average ratings by talk, from 0 to 5">
        <figcaption className="dashboard-chart-caption">
          Average rating <span>Fixed scale · out of 5</span>
        </figcaption>
        <div className="dashboard-scale" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(value => <span key={value}>{value}</span>)}</div>
        <ul className="dashboard-bars" data-scroll={talks.length > 6 ? "true" : undefined} tabIndex={talks.length > 6 ? 0 : undefined} aria-label="Average ratings and response counts">
          {talks.map(talk => <li key={talk.talkId} className="dashboard-bar-row">
            <button type="button" className="dashboard-bar-name" aria-pressed={selected.talkId === talk.talkId} onClick={() => { setSelection(talk.talkId); explorer.current?.focus(); }}>{talk.talkId}<ArrowUpRight size={16} aria-hidden="true" /></button>
            <p className="dashboard-bar-values"><span><strong className="dashboard-bar-average">{talk.average.toFixed(1)}</strong> / 5</span><span>{talk.count} {talk.count === 1 ? "response" : "responses"}</span></p>
            <div className="dashboard-bar-track" aria-hidden="true">
              <div key={`${talk.talkId}:${talk.average}`} className="dashboard-bar-fill" style={{ width: `${talk.average / 5 * 100}%` }} />
            </div>
          </li>)}
        </ul>
        <p className="dashboard-chart-note">{talks.length > 6 && `Scroll to compare all ${talks.length} talks. `}Exact values are listed in the table below.</p>
      </figure>
      </div>
</div>
      <div className="dashboard-table-wrap">
        <h3>The numbers, in full</h3>
        <table className="dashboard-table">
          <caption className="sr-only">Talk feedback summary</caption>
          <thead><tr><th scope="col">Talk</th><th scope="col">Average</th><th scope="col">Responses</th></tr></thead>
          <tbody>
            {talks.map(talk => (
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
