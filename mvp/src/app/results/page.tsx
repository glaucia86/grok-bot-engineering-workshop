import type { Metadata } from "next";
import Link from "next/link";
import { FeedbackDashboard } from "@/components/feedback-dashboard";
export const metadata: Metadata = { title: "Results | Talk Feedback" };
export default function Results() {
  return <><div className="loop-page-intro"><h1>Workshop results</h1><p>What resonated with the room? Explore ratings and response counts for every talk.</p><Link className="loop-secondary" href="/feedback">Leave feedback</Link></div><div className="loop-results-frame"><FeedbackDashboard feedbackHref="/feedback" /></div></>;
}
