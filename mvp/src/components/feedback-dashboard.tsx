"use client";

import { useEffect, useRef, useState } from "react";
import type { TalkStats } from "../lib/stats";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { TalkInsights } from "./talk-insights";
import { useLocale } from "./locale-provider";

type DashboardState = { requestKey: string; status: "error" | "ready" };

export function FeedbackDashboard({ revision = 0, feedbackHref = "#feedback", insights = false }: { revision?: number; feedbackHref?: string; insights?: boolean }) {
  const { t } = useLocale();
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
      <h2 id="results-heading" className="sr-only">{t("Talk results", "Resultados das palestras")}</h2>
      {!current ? (
        <div className={`dashboard-state${talks !== null ? " dashboard-refresh" : ""}`} role="status">
          <p>{talks !== null ? t("Refreshing results…", "Atualizando resultados…") : t("Loading feedback.", "Carregando feedback.")}</p>
          {talks === null && <div className="dashboard-skeleton" aria-hidden="true"><span /><span /><span /></div>}
        </div>
      ) : current.status === "error" ? (
        <div className={`dashboard-state dashboard-error${talks !== null ? " dashboard-refresh" : ""}`} role="alert">
          <p>{revision > 0 ? t("Feedback saved. Results could not refresh. Please try again.", "Feedback salvo. Não foi possível atualizar os resultados. Tente novamente.") : t("We couldn't load the feedback. Please try again.", "Não foi possível carregar o feedback. Tente novamente.")}</p>
          <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("Try again", "Tentar novamente")}</button>
        </div>
      ) : null}
      {talks !== null && (talks.length > 0 || current?.status === "ready") && <>
        {(!current || current.status === "error") && <p className="dashboard-stale">{t("Previously loaded results. These may not include your latest feedback.", "Resultados carregados anteriormente. Eles podem não incluir seu feedback mais recente.")}</p>}
        <TalkResults talks={talks} feedbackHref={feedbackHref} insights={insights} revision={revision} />
      </>}
    </section>
  );
}

export function TalkResults({ talks, feedbackHref = "#feedback", insights = false, revision = 0 }: { talks: TalkStats[]; feedbackHref?: string; insights?: boolean; revision?: number }) {
  const { t, number } = useLocale();
  const [selection, setSelection] = useState("");
  const explorer = useRef<HTMLSelectElement>(null);
  if (talks.length === 0) {
    return (
      <div className="dashboard-empty">
        <h3>{t("No feedback yet", "Ainda não há feedback")}</h3>
        <p>{t("Leave the first review to start the conversation.", "Deixe a primeira avaliação para começar a conversa.")}</p>
        <a href={feedbackHref}>{t("Leave feedback", "Deixe seu feedback")}</a>
      </div>
    );
  }

  const selected = talks.find(talk => talk.talkId === selection) ?? talks[0];
  const mostReviewed = talks.reduce((most, talk) => talk.count > most.count ? talk : most);
  const leadingCount = talks.filter(talk => talk.count === mostReviewed.count).length;
  const tied = leadingCount > 1;
  const responses = talks.reduce((total, talk) => total + talk.count, 0);
  const header = <>
    <div className="results-selected-title"><p>{t("Selected talk", "Palestra selecionada")}</p><h3>{selected.talkId}</h3></div>
    <div className="results-detail-picker">
      <label htmlFor="talk-explorer">{t("Explore a talk", "Explore uma palestra")}</label>
      <select ref={explorer} id="talk-explorer" value={selected.talkId} onChange={event => setSelection(event.target.value)}>
        {talks.map(talk => <option key={talk.talkId} value={talk.talkId}>{talk.talkId}</option>)}
      </select>
    </div>
  </>;
  const comparison = <Card className="results-comparison" role="region" aria-labelledby="comparison-heading">
    <CardHeader className="results-card-header"><div><h3 id="comparison-heading">{t("Across the workshop", "Visão geral do workshop")}</h3><p>{t("Choose a talk to explore its feedback.", "Escolha uma palestra para explorar seu feedback.")}</p></div><span className="results-panel-count">{number(talks.length)} {talks.length === 1 ? t("talk", "palestra") : t("talks", "palestras")}</span></CardHeader>
    <CardContent className="results-table-content">
      <div className="comparison-scroll" role="region" aria-label={t("Talk comparison rows", "Comparação entre palestras")} data-scroll={talks.length > 6 ? "true" : undefined} tabIndex={talks.length > 6 ? 0 : undefined}>
        <table className="dashboard-table">
          <caption className="sr-only">{t("Talk feedback summary", "Resumo do feedback das palestras")}</caption>
          <thead><tr><th scope="col">{t("Talk", "Palestra")}</th><th scope="col">{t("Average", "Média")}</th><th scope="col">{t("Responses", "Respostas")}</th></tr></thead>
          <tbody>{talks.map(talk => <tr key={talk.talkId} data-selected={selected.talkId === talk.talkId ? "true" : undefined}>
            <th scope="row"><Button variant="ghost" type="button" className="comparison-talk-button" aria-pressed={selected.talkId === talk.talkId} onClick={() => { setSelection(talk.talkId); explorer.current?.focus(); }}>{talk.talkId}<ArrowUpRight size={16} aria-hidden="true" /></Button></th>
            <td className="dashboard-average">{number(talk.average, 1)} <span>/ 5</span></td>
            <td className="dashboard-count">{number(talk.count)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {talks.length > 6 && <p className="comparison-scroll-note">{t(`Scroll to compare all ${number(talks.length)} talks.`, `Role para comparar todas as ${number(talks.length)} palestras.`)}</p>}
    </CardContent>
  </Card>;
  return <>
    <dl className="results-overview" aria-label={t("Workshop response summary", "Resumo das respostas do workshop")}>
      <div className="results-metric"><dt>{t("Responses received", "Respostas recebidas")}</dt><dd><strong className="results-total">{number(responses)}</strong></dd></div>
      <div className="results-metric"><dt>{talks.length === 1 ? t("Talk reviewed", "Palestra avaliada") : t("Talks reviewed", "Palestras avaliadas")}</dt><dd><strong>{number(talks.length)}</strong></dd></div>
      <div className="results-metric results-leading"><dt>{tied ? t("Most reviewed talks", "Palestras mais avaliadas") : t("Most reviewed talk", "Palestra mais avaliada")}</dt><dd><p>{tied ? t(`${number(leadingCount)} tied`, `${number(leadingCount)} empatadas`) : mostReviewed.talkId}</p><span>{number(mostReviewed.count)} {mostReviewed.count === 1 ? t("rating", "avaliação") : t("ratings", "avaliações")} {tied ? t("each", "cada") : mostReviewed.count === 1 ? t("received", "recebida") : t("received", "recebidas")}</span></dd></div>
    </dl>
    {insights ? <TalkInsights talkId={selected.talkId} revision={revision} header={header} comparison={comparison} /> : <>
      <Card className="results-analytics" role="region" aria-label={t("Selected talk feedback", "Feedback da palestra selecionada")}>
        <CardHeader className="results-analytics-header">{header}</CardHeader>
        <CardContent className="selected-summary"><strong>{number(selected.average, 1)}</strong><span>{t(` / 5 from ${number(selected.count)} ${selected.count === 1 ? "response" : "responses"}.`, ` / 5 com ${number(selected.count)} ${selected.count === 1 ? "resposta" : "respostas"}.`)}</span></CardContent>
      </Card>
      <div className="results-bottom-grid results-bottom-grid-summary">{comparison}</div>
    </>}
  </>;
}
