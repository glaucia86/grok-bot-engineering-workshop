"use client";

import Link from "next/link";
import { FeedbackDashboard } from "./feedback-dashboard";
import { useLocale } from "./locale-provider";

export function ResultsPage() {
  const { t } = useLocale();
  return <>
    <div className="loop-page-intro results-intro">
      <h1>{t("Workshop results", "Resultados do workshop")}</h1>
      <p>{t("What resonated with the room? Explore ratings and response counts for every talk.", "O que mais marcou o público? Explore as avaliações e o número de respostas de cada palestra.")}</p>
      <Link className="loop-secondary" href="/feedback">{t("Leave feedback", "Deixe seu feedback")}</Link>
    </div>
    <div className="loop-results-frame"><FeedbackDashboard feedbackHref="/feedback" insights /></div>
  </>;
}
