"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, Star } from "lucide-react";
import { feedbackSchema, fieldErrors } from "@/lib/feedback-schema";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const initial = { talkId: "", author: "", comment: "", rating: "" };

export function FeedbackForm({ onSaved, resultsHref = "#results" }: { onSaved: () => void; resultsHref?: string }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [failure, setFailure] = useState("");
  const [previewRating, setPreviewRating] = useState(0);
  const pending = useRef(false);
  const form = useRef<HTMLFormElement>(null);

  function focusError(next: Record<string, string>) {
    const name = ["talkId", "author", "comment", "rating"].find((key) => next[key]);
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
        if (next.body || Object.keys(next).length === 0) setFailure("We could not save your feedback. Please try again.");
        return;
      }
      if (response.status !== 201 || !body || !Number.isInteger(body.id) || !feedbackSchema.safeParse(body).success || typeof body.createdAt !== "string") {
        throw new Error("Unexpected creation response");
      }
      setValues(initial); setPreviewRating(0); setStatus("saved"); onSaved();
    } catch {
      setFailure("We could not save your feedback. Your entries are still here. Please try again."); setStatus("idle");
    } finally { pending.current = false; }
  }

  const update = (key: keyof typeof initial, value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    if (key === "rating") setPreviewRating(0);
  };

  const ratingDescription = `rating-hint${errors.rating ? " rating-error" : ""}`;

  return (
    <section id="feedback" className="feedback-panel" aria-labelledby="feedback-title">
      <header className="panel-heading"><h2 id="feedback-title">How was the talk?</h2><p>A useful detail makes the next session better.</p></header>
      <form ref={form} onSubmit={submit} noValidate aria-busy={status === "saving"}>
        <p className="form-note">Talk, your name and a rating are required. Comments are optional.</p>
        {([ ["talkId", "Talk", "The talk you attended"], ["author", "Your name", "How should we call you?"] ] as const).map(([key, label, placeholder]) => (
          <div className="form-field" key={key}>
            <Label htmlFor={key}>{label}</Label>
            <Input id={key} name={key} value={values[key]} placeholder={placeholder} required disabled={status === "saving"} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} onChange={(event) => update(key, event.target.value)} />
            {errors[key] && <p id={`${key}-error`} className="field-error">{errors[key]}</p>}
          </div>
        ))}
        <fieldset className="rating-field" aria-describedby={ratingDescription} aria-invalid={!!errors.rating} disabled={status === "saving"}>
          <legend>Rating</legend><p id="rating-hint">Choose 1 to 5 stars. 1 = needs work · 5 = excellent</p>
          <div className="rating-options" onPointerLeave={() => setPreviewRating(0)} onKeyDown={() => setPreviewRating(0)}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <label className="rating-option" key={rating} data-preview={previewRating >= rating || undefined} onPointerEnter={() => { if (status !== "saving") setPreviewRating(rating); }}>
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  checked={values.rating === String(rating)}
                  required
                  aria-label={rating === 1 ? "1 star" : `${rating} stars`}
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
            {values.rating ? `${values.rating} of 5 stars selected` : "No rating selected"}
          </p>
          {errors.rating && <p id="rating-error" className="field-error">{errors.rating}</p>}
          <p className="rating-preview" aria-hidden="true">{previewRating ? `Preview: ${previewRating} of 5 stars` : "\u00a0"}</p>
        </fieldset>
        <div className="form-field"><Label htmlFor="comment">Comment (optional)</Label><Textarea id="comment" name="comment" rows={4} value={values.comment} placeholder="What clicked? What could be clearer?" disabled={status === "saving"} aria-invalid={!!errors.comment} aria-describedby={`comment-hint${errors.comment ? " comment-error" : ""}`} onChange={(event) => update("comment", event.target.value)} /><p id="comment-hint" className="field-hint">{values.comment.trim().length} / 1000 characters after trimming. Written comments appear in results; names are not shown.</p>{errors.comment && <p id="comment-error" className="field-error">{errors.comment}</p>}</div>
        {failure && <p role="alert" className="save-error">{failure}</p>}
        <Button type="submit" className="submit-button" disabled={status === "saving"}>{status === "saving" ? "Saving…" : failure ? "Try again" : "Send feedback"}<ArrowUpRight aria-hidden="true" /></Button>
        <div aria-live="polite" aria-atomic="true">{status === "saved" && <div className="save-success"><Check aria-hidden="true" size={18} /><div><p>Feedback saved. Thank you for helping the next talk.</p><a href={resultsHref}>View results</a></div></div>}</div>
      </form>
    </section>
  );
}
