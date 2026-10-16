"use client";

import { useEffect, useState } from "react";
import type { TalkStats } from "../lib/stats";

type DashboardState = { requestKey: string; status: "error" | "ready" };

export function FeedbackDashboard({ revision = 0 }: { revision?: number }) {
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
        <p className="dashboard-intro">Average ratings and response counts for each talk.</p>
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
      {talks !== null && <>
        {(!current || current.status === "error") && <p className="dashboard-stale">Previously loaded results. These may not include your latest feedback.</p>}
        <TalkResults talks={talks} />
      </>}
    </section>
  );
}

export function TalkResults({ talks }: { talks: TalkStats[] }) {
  if (talks.length === 0) {
    return (
      <div className="dashboard-empty">
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
          Average rating <span>Fixed scale · out of 5</span>
        </figcaption>
        <div className="dashboard-scale" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(value => <span key={value}>{value}</span>)}</div>
        <ul className="dashboard-bars" aria-label="Average ratings and response counts">
          {talks.map(talk => <li key={talk.talkId} className="dashboard-bar-row">
            <p className="dashboard-bar-name">{talk.talkId}</p>
            <p className="dashboard-bar-values"><span><strong className="dashboard-bar-average">{talk.average.toFixed(1)}</strong> / 5</span><span>{talk.count} {talk.count === 1 ? "response" : "responses"}</span></p>
            <div className="dashboard-bar-track" aria-hidden="true">
              <div key={`${talk.talkId}:${talk.average}`} className="dashboard-bar-fill" style={{ width: `${talk.average / 5 * 100}%` }} />
            </div>
          </li>)}
        </ul>
        <p className="dashboard-chart-note">Exact values are listed in the table below.</p>
      </figure>
      <div className="dashboard-table-wrap">
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
