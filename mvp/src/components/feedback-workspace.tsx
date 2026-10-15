"use client";
import { useState } from "react";
import { FeedbackForm } from "./feedback-form";
import { FeedbackDashboard } from "./feedback-dashboard";

export function FeedbackWorkspace() {
  const [revision, setRevision] = useState(0);
  return <div className="feedback-workspace"><FeedbackForm onSaved={() => setRevision((previous) => previous + 1)} /><FeedbackDashboard revision={revision} /></div>;
}
