import type { Metadata } from "next";
import { FeedbackPage } from "@/components/feedback-page";
export const metadata: Metadata = { title: "Leave feedback | Talk Feedback" };
export default function Page() { return <FeedbackPage />; }
