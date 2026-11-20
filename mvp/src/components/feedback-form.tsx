"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toPayload, validateFeedback } from "@/lib/feedback-form";
import { cn } from "@/lib/utils";

const RATINGS = ["1", "2", "3", "4", "5"] as const;
const EMPTY_FORM = { talkId: "", author: "", comment: "", rating: "" };
const SAVED_MESSAGE = "Thanks, your feedback was saved.";
const SUBMIT_ERROR = "Could not submit feedback. Try again.";

type FormState = typeof EMPTY_FORM;

export function FeedbackForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setConfirmation(null);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateFeedback(form);
    const { body, ...fields } = errors;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(fields);
      setFormError(body ?? null);
      setConfirmation(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setConfirmation(null);
    const submitted = form;
    startTransition(async () => {
      try {
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(submitted)),
        });
        if (response.status === 201) {
          setForm(EMPTY_FORM);
          setConfirmation(SAVED_MESSAGE);
          onSubmitted();
          return;
        }
        if (response.status === 400) {
          const map = readErrorMap(await response.json().catch(() => null));
          if (map) {
            const { body: serverBody, ...serverFields } = map;
            setFieldErrors(serverFields);
            setFormError(serverBody ?? null);
            return;
          }
        }
        setFormError(SUBMIT_ERROR);
      } catch {
        setFormError(SUBMIT_ERROR);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send feedback</CardTitle>
        <CardDescription>Talk, author, and a rating from 1 to 5. Comment is optional.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" noValidate onSubmit={onSubmit}>
          {confirmation ? (
            <p role="status" className="text-sm text-foreground">
              {confirmation}
            </p>
          ) : null}
          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}
          <FormField id="talkId" label="Talk" error={fieldErrors.talkId}>
            <Input
              id="talkId"
              name="talkId"
              value={form.talkId}
              onChange={(event) => updateField("talkId", event.target.value)}
              disabled={isPending}
              aria-invalid={fieldErrors.talkId ? true : undefined}
              aria-describedby={fieldErrors.talkId ? "talkId-error" : undefined}
              autoComplete="off"
            />
          </FormField>
          <FormField id="author" label="Author" error={fieldErrors.author}>
            <Input
              id="author"
              name="author"
              value={form.author}
              onChange={(event) => updateField("author", event.target.value)}
              disabled={isPending}
              aria-invalid={fieldErrors.author ? true : undefined}
              aria-describedby={fieldErrors.author ? "author-error" : undefined}
              autoComplete="name"
            />
          </FormField>
          <FormField id="comment" label="Comment" error={fieldErrors.comment}>
            <Textarea
              id="comment"
              name="comment"
              value={form.comment}
              onChange={(event) => updateField("comment", event.target.value)}
              disabled={isPending}
              aria-invalid={fieldErrors.comment ? true : undefined}
              aria-describedby={fieldErrors.comment ? "comment-error" : undefined}
            />
          </FormField>
          <StarRating
            value={form.rating}
            disabled={isPending}
            error={fieldErrors.rating}
            onChange={(rating) => updateField("rating", rating)}
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? "Sending..." : "Send feedback"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function StarRating({
  value,
  disabled,
  error,
  onChange,
}: {
  value: string;
  disabled: boolean;
  error?: string;
  onChange: (rating: string) => void;
}) {
  const describedBy = error ? "rating-error" : undefined;
  const selected = value === "" ? 0 : Number(value);

  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="text-sm font-medium">Rating</legend>
      <div
        role="radiogroup"
        aria-label="Rating"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="flex gap-1"
      >
        {RATINGS.map((rating) => {
          const stars = Number(rating);
          const filled = selected >= stars;
          return (
            <label
              key={rating}
              className="relative flex size-8 cursor-pointer items-center justify-center rounded-md has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
            >
              <input
                type="radio"
                name="rating"
                value={rating}
                checked={value === rating}
                onChange={() => onChange(rating)}
                className="absolute inset-0 z-10 cursor-pointer opacity-0"
                aria-describedby={describedBy}
              />
              <Star
                aria-hidden="true"
                className={cn(
                  "pointer-events-none size-5",
                  filled ? "fill-current text-primary" : "text-muted-foreground",
                )}
              />
              <span className="pointer-events-none sr-only">
                {rating === "1" ? "1 star" : `${rating} stars`}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id="rating-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function readErrorMap(payload: unknown): Record<string, string> | null {
  if (typeof payload !== "object" || payload === null || !("errors" in payload)) return null;
  const errors = payload.errors;
  if (typeof errors !== "object" || errors === null || Array.isArray(errors)) return null;
  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (typeof value === "string") map[key] = value;
  }
  return Object.keys(map).length > 0 ? map : null;
}
