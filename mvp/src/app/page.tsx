import { FeedbackWorkspace } from "@/components/feedback-workspace";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#feedback">Skip to feedback</a>
      <header className="site-header"><Link href="/" className="wordmark">Talk<span>Feedback</span><span className="wordmark-square" aria-hidden="true" /></Link><nav aria-label="Main navigation"><a href="#feedback">Leave feedback</a><a href="#results">See results ↗</a></nav></header>
      <main className="site-main">
        <div className="workshop-intro"><p className="workshop-label">PACKT WORKSHOP / ENGINEERING BOTS</p><h1>Workshop feedback</h1><p className="intro-copy">Leave feedback on a talk and explore the room&apos;s results.</p></div>
        <FeedbackWorkspace />
      </main>
      <footer className="site-footer"><span>Talk Feedback</span><p>Built to learn. Improved together.</p></footer>
    </>
  );
}
