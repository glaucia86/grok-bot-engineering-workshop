"use client";

import { EyeOff, Lightbulb } from "lucide-react";
import { FeedbackForm } from "./feedback-form";
import { useLocale } from "./locale-provider";

export function FeedbackPage({ initialRating }: { initialRating?: number } = {}) {
  const { t } = useLocale();
  return (
    <>
      <header className="loop-page-intro">
        <h1>{t("Leave feedback", "Deixe seu feedback")}</h1>
        <p>{t("A small reflection can make the next talk better.", "Uma pequena reflexão pode melhorar a próxima palestra.")}</p>
      </header>
      <div className="loop-task-grid">
        <FeedbackForm onSaved={() => {}} resultsHref="/results" initialRating={initialRating} />
        <aside className="loop-context feedback-guidance" aria-labelledby="feedback-guidance-title">
          <div className="feedback-guidance-icon" aria-hidden="true"><Lightbulb size={21} /></div>
          <h2 id="feedback-guidance-title">{t("Make your feedback count", "Faça seu feedback valer")}</h2>
          <p>{t("You bring the perspective a speaker can't see from the stage.", "Você traz uma perspectiva que não se vê do palco.")}</p>
          <ol className="loop-checklist feedback-guidance-list">
            <li><h3>{t("Be specific", "Seja específico")}</h3><p>{t("Mention an example, a topic, or a moment that stood out.", "Mencione um exemplo, um tema ou um momento que se destacou.")}</p></li>
            <li><h3>{t("Keep it constructive", "Mantenha um tom construtivo")}</h3><p>{t("A suggestion for next time can turn a good talk into a great one.", "Uma sugestão para a próxima vez pode tornar uma boa palestra ainda melhor.")}</p></li>
            <li><h3>{t("Share what helped", "Compartilhe o que ajudou")}</h3><p>{t("Let the speaker know what you'll take into your own work.", "Conte à pessoa que palestrou o que você vai levar para o seu trabalho.")}</p></li>
          </ol>
          <div className="feedback-visibility-note">
            <EyeOff size={18} aria-hidden="true" />
            <p>{t("Names are not shown in results. Ratings and written comments help everyone learn.", "Os nomes não são exibidos nos resultados. Avaliações e comentários ajudam todo mundo a aprender.")}</p>
          </div>
        </aside>
      </div>
    </>
  );
}
