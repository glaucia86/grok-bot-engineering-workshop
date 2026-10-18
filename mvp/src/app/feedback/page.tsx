import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedbackPage } from "@/components/feedback-page";
import { FeedbackLoading } from "@/components/feedback-loading";
export const metadata: Metadata = { title: "Leave feedback | Talk Feedback" };
type Props = { searchParams: Promise<{ rating?: string | string[] }> };
async function FeedbackWithRating({ searchParams }: Props) {
  const params = await searchParams;
  const raw = typeof params.rating === "string" ? params.rating : "";
  const rating = /^[1-5]$/.test(raw) ? Number(raw) : undefined;
  return <FeedbackPage initialRating={rating} />;
}
export default function Page(props: Props) { return <Suspense fallback={<FeedbackLoading />}><FeedbackWithRating {...props} /></Suspense>; }
