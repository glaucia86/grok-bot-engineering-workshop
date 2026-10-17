"use client";
import { FeedbackForm } from "./feedback-form";
export function FeedbackPage() {
  return <><div className="loop-page-intro"><h1>Leave feedback</h1><p>A useful review takes less than a minute.</p></div><div className="loop-task-grid"><FeedbackForm onSaved={() => {}} resultsHref="/results" /><aside className="loop-context"><div className="context-mark" aria-hidden="true">↗</div><h2>Small notes make better talks.</h2><p>You noticed what landed, what surprised you, and what could be clearer. That perspective is the useful bit.</p><ol className="loop-checklist"><li>Name the talk.</li><li>Choose a rating.</li><li>Add a thought, if you&apos;d like.</li></ol><p className="context-note">Your name and rating are required. Comments are optional.</p></aside></div></>;
}
