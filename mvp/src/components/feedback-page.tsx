"use client";
import { FeedbackForm } from "./feedback-form";
export function FeedbackPage() {
  return <><div className="loop-page-intro"><h1>Leave feedback</h1><p>A small reflection can make the next talk better.</p></div><div className="loop-task-grid"><FeedbackForm onSaved={() => {}} resultsHref="/results" /><aside className="loop-context"><h2>Every review moves us forward.</h2><p>You bring the perspective that a speaker can&apos;t see from the stage.</p><ol className="loop-checklist"><li>Name the talk you attended.</li><li>Choose a rating from 1 to 5.</li><li>Add a thought, if you&apos;d like.</li></ol><p>Your name and rating are required. Comments are optional.</p></aside></div></>;
}
