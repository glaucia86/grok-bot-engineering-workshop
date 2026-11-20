"use client";

import { useCallback, useState } from "react";
import { FeedbackDashboard } from "@/components/feedback-dashboard";
import { FeedbackForm } from "@/components/feedback-form";

export function TalkFeedback() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshDashboard = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Talk feedback</h1>
        <p className="text-muted-foreground">Rate a talk and see the room average.</p>
      </header>
      <FeedbackForm onSubmitted={refreshDashboard} />
      <FeedbackDashboard key={refreshKey} />
    </main>
  );
}
