"use client";

import { EyeOff, Lightbulb } from "lucide-react";
import { FeedbackForm } from "./feedback-form";

export function FeedbackPage() {
  return (
    <>
      <header className="loop-page-intro">
        <h1>Leave feedback</h1>
        <p>A small reflection can make the next talk better.</p>
      </header>
      <div className="loop-task-grid">
        <FeedbackForm onSaved={() => {}} resultsHref="/results" />
        <aside className="loop-context feedback-guidance" aria-labelledby="feedback-guidance-title">
          <div className="feedback-guidance-icon" aria-hidden="true"><Lightbulb size={21} /></div>
          <h2 id="feedback-guidance-title">Make your feedback count</h2>
          <p>You bring the perspective a speaker can&apos;t see from the stage.</p>
          <ol className="loop-checklist feedback-guidance-list">
            <li><h3>Be specific</h3><p>Mention an example, a topic, or a moment that stood out.</p></li>
            <li><h3>Keep it constructive</h3><p>A suggestion for next time can turn a good talk into a great one.</p></li>
            <li><h3>Share what helped</h3><p>Let the speaker know what you&apos;ll take into your own work.</p></li>
          </ol>
          <div className="feedback-visibility-note">
            <EyeOff size={18} aria-hidden="true" />
            <p>Names are not shown in results. Ratings and written comments help everyone learn.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
