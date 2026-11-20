import type { Metadata } from "next";
import { TalkFeedback } from "@/components/talk-feedback";

export const metadata: Metadata = {
  title: "Talk feedback",
  description: "Rate a talk and see the room average.",
};

export default function Home() {
  return <TalkFeedback />;
}
