import type { Metadata } from "next";
import { ResultsPage } from "@/components/results-page";
export const metadata: Metadata = { title: "Results | Talk Feedback" };
export default function Results() { return <ResultsPage />; }
