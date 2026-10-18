"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, MessageSquareText, Star } from "lucide-react";
import { feedbackSchema, fieldErrors } from "@/lib/feedback-schema";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useLocale } from "./locale-provider";

const portugueseErrors: Record<string, string> = {
  "talkId must be text": "Informe o título da palestra em texto.",
  "talkId is required": "Informe a palestra.",
  "author must be text": "Informe seu nome em texto.",
  "author is required": "Informe seu nome.",
  "comment must be text": "O comentário deve ser um texto.",
  "comment must be at most 1000 characters": "O comentário deve ter no máximo 1.000 caracteres.",
  "rating must be a number": "Escolha uma avaliação de 1 a 5 estrelas.",
  "rating must be a whole number": "Escolha uma avaliação com um número inteiro de estrelas.",
  "rating must be between 1 and 5": "A avaliação deve ser de 1 a 5 estrelas.",
};

const initial = { talkId: "", author: "", comment: "", rating: "" };

export function FeedbackForm({ onSaved, resultsHref = "#results", initialRating }: { onSaved: () => void; resultsHref?: string; initialRating?: number }) {
  const { t, number } = useLocale();
  const translateError = (message: string) => t(message, Object.hasOwn(portugueseErrors, message) ? portugueseErrors[message] : "Confira este campo e tente novamente.");
  const [values, setValues] = useState(() => ({ ...initial, rating: typeof initialRating === "number" && Number.isInteger(initialRating) && initialRating >= 1 && initialRating <= 5 ? String(initialRating) : "" }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [failure, setFailure] = useState("");
  const [previewRating, setPreviewRating] = useState(0);
  const pending = useRef(false);
  const form = useRef<HTMLFormElement>(null);

  function focusError(next: Record<string, string>) {
    const name = ["talkId", "author", "rating", "comment"].find((key) => next[key]);
    requestAnimationFrame(() => form.current?.querySelector<HTMLElement>(`[name="${name}"]`)?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    setPreviewRating(0);
    setFailure(""); setStatus("idle");
    const parsed = feedbackSchema.safeParse({ ...values, rating: values.rating === "" ? undefined : Number(values.rating) });
    if (!parsed.success) {
      const next = fieldErrors(parsed.error);
      setErrors(next); focusError(next); return;
    }
    setErrors({}); setStatus("saving"); pending.current = true;
    try {
      const response = await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
      });
      const body = await response.json().catch(() => null);
      if (response.status === 400 && body?.errors && typeof body.errors === "object") {
        const next = Object.fromEntries(Object.entries(body.errors).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
        setErrors(next); focusError(next); setStatus("idle");
        if (next.body || Object.keys(next).length === 0) setFailure("invalid-response");
        return;
      }
      if (response.status !== 201 || !body || !Number.isInteger(body.id) || !feedbackSchema.safeParse(body).success || typeof body.createdAt !== "string") {
        throw new Error("Unexpected creation response");
      }
      setValues(initial); setPreviewRating(0); setStatus("saved"); onSaved();
    } catch {
      setFailure("save-failed"); setStatus("idle");
    } finally { pending.current = false; }
  }

  const update = (key: keyof typeof initial, value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    if (key === "rating") setPreviewRating(0);
  };

  const ratingDescription = `rating-hint${errors.rating ? " rating-error" : ""}`;

  return (
    <section id="feedback" className="feedback-panel" aria-labelledby="feedback-title">
      <header className="panel-heading">
        <div className="feedback-heading-icon" aria-hidden="true"><MessageSquareText size={22} /></div>
        <div><h2 id="feedback-title">{t("How was the talk?", "Como foi a palestra?")}</h2><p>{t("A useful detail makes the next session better.", "Um detalhe útil pode melhorar a próxima sessão.")}</p></div>
      </header>
      <form ref={form} onSubmit={submit} noValidate aria-labelledby="feedback-title" aria-describedby="feedback-requirements" aria-busy={status === "saving"}>
        <p id="feedback-requirements" className="form-note">{t("Talk, your name and a rating are required. Comments are optional.", "Palestra, seu nome e uma avaliação são obrigatórios. Comentários são opcionais.")}</p>
        {([
          ["talkId", t("Talk", "Palestra"), t("The talk you attended", "A palestra de que você participou"), t("Use the talk title so your feedback reaches the right session.", "Use o título da palestra para enviar seu feedback à sessão certa.")],
          ["author", t("Your name", "Seu nome"), t("Enter your name", "Digite seu nome"), t("Your name is required, but it won’t be shown in results.", "Seu nome é obrigatório, mas não será exibido nos resultados.")],
        ] as const).map(([key, label, placeholder, hint]) => (
          <div className="form-field" key={key}>
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              name={key}
              value={values[key]}
              placeholder={placeholder}
              autoComplete={key === "author" ? "name" : "off"}
              required
              disabled={status === "saving"}
              aria-invalid={!!errors[key]}
              aria-describedby={`${key}-hint${errors[key] ? ` ${key}-error` : ""}`}
              onChange={(event) => update(key, event.target.value)}
            />
            <p id={`${key}-hint`} className="field-hint">{hint}</p>
            {errors[key] && <p id={`${key}-error`} className="field-error">{translateError(errors[key])}</p>}
          </div>
        ))}
        <fieldset className="rating-field" aria-describedby={ratingDescription} aria-invalid={!!errors.rating} disabled={status === "saving"}>
          <legend>{t("Rating", "Avaliação")}</legend><p id="rating-hint">{t("Choose 1 to 5 stars. 1 = needs work · 5 = excellent", "Escolha de 1 a 5 estrelas. 1 = precisa melhorar · 5 = excelente")}</p>
          <div className="rating-options" onPointerLeave={() => setPreviewRating(0)} onKeyDown={() => setPreviewRating(0)}>
            {[1, 2, 3, 4, 5].map((rating) => (
              // Pointer entry can come from scrolling beneath a stationary mouse.
              // Only actual pointer movement should override keyboard shape cues.
              <label className="rating-option" key={rating} data-preview={previewRating >= rating || undefined} onPointerMove={() => { if (status !== "saving") setPreviewRating(rating); }}>
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  checked={values.rating === String(rating)}
                  required
                  aria-label={rating === 1 ? t("1 star", "1 estrela") : t(`${number(rating)} stars`, `${number(rating)} estrelas`)}
                  aria-invalid={!!errors.rating}
                  aria-describedby={ratingDescription}
                  onChange={(event) => update("rating", event.target.value)}
                />
                <span aria-hidden="true">
                  <Star size={26} strokeWidth={1.75} fill={(previewRating || Number(values.rating)) >= rating ? "currentColor" : "none"} />
                </span>
              </label>
            ))}
          </div>
          <p className="rating-selection" aria-live="polite" aria-atomic="true">
            {values.rating ? t(`${values.rating} of 5 stars selected`, `${values.rating} de 5 estrelas selecionadas`) : t("No rating selected", "Nenhuma avaliação selecionada")}
          </p>
          {errors.rating && <p id="rating-error" className="field-error">{translateError(errors.rating)}</p>}
          <p className="rating-preview" aria-hidden="true">{previewRating ? t(`Preview: ${number(previewRating)} of 5 stars`, `Prévia: ${number(previewRating)} de 5 estrelas`) : "\u00a0"}</p>
        </fieldset>
        <div className="form-field comment-field">
          <Label htmlFor="comment">{t("Comment (optional)", "Comentário (opcional)")}</Label>
          <Textarea
            id="comment"
            name="comment"
            rows={4}
            value={values.comment}
            placeholder={t("What clicked? What could be clearer?", "O que fez sentido? O que poderia ficar mais claro?")}
            disabled={status === "saving"}
            aria-invalid={!!errors.comment}
            aria-describedby={`comment-hint${errors.comment ? " comment-error" : ""}`}
            onChange={(event) => update("comment", event.target.value)}
          />
          <p id="comment-hint" className="field-hint comment-hint">
            <span>{t("Written comments appear in results; names are not shown.", "Os comentários aparecem nos resultados; os nomes não são exibidos.")}</span>
            <span className="comment-count">{t(`${number(values.comment.trim().length)} / ${number(1000)} characters after trimming.`, `${number(values.comment.trim().length)} / ${number(1000)} caracteres, sem espaços nas extremidades.`)}</span>
          </p>
          {errors.comment && <p id="comment-error" className="field-error">{translateError(errors.comment)}</p>}
        </div>
        {failure && <p role="alert" className="save-error">{failure === "invalid-response" ? t("We could not save your feedback. Please try again.", "Não foi possível salvar seu feedback. Tente novamente.") : t("We could not save your feedback. Your entries are still here. Please try again.", "Não foi possível salvar seu feedback. Suas respostas continuam aqui. Tente novamente.")}</p>}
        <div className="form-actions">
          <Button type="submit" className="submit-button" disabled={status === "saving"}>
            {status === "saving" ? t("Saving…", "Salvando…") : failure ? t("Try again", "Tentar novamente") : t("Send feedback", "Enviar feedback")}<ArrowRight aria-hidden="true" />
          </Button>
        </div>
        <div aria-live="polite" aria-atomic="true">
          {status === "saved" && (
            <div className="save-success">
              <Check aria-hidden="true" size={18} />
              <div><p>{t("Feedback saved. Thank you for helping the next talk.", "Feedback salvo. Obrigado por ajudar a melhorar a próxima palestra.")}</p><a href={resultsHref}>{t("View results", "Ver resultados")}<ArrowRight size={15} aria-hidden="true" /></a></div>
            </div>
          )}
        </div>
      </form>
    </section>
  );
}
