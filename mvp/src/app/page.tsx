import Link from "next/link";
import { ArrowRight, ArrowUpRight, Code2, MessageSquare, RefreshCw } from "lucide-react";
import { BotBackdrop } from "@/components/bot-backdrop";
import { WorkshopMascot } from "@/components/workshop-mascot";

export default function Home() {
  return (
    <div className="loop-home">
      <section className="loop-hero" aria-labelledby="home-heading">
        <div className="loop-hero-copy">
          <p className="loop-kicker"><RefreshCw size={16} aria-hidden="true" />Loop Engineering workshop</p>
          <h1 id="home-heading">Build a better<br /><span>feedback loop.</span></h1>
          <p className="loop-hero-description">Great engineering grows through feedback. Share what you learned, see what resonated, and help shape the next session.</p>
          <div className="loop-actions">
            <Link className="loop-primary" href="/feedback">Leave feedback <ArrowRight aria-hidden="true" size={18} /></Link>
            <Link className="loop-secondary" href="/results">Explore results <ArrowUpRight aria-hidden="true" size={18} /></Link>
          </div>
        </div>
        <div className="loop-hero-art">
          <div className="loop-diagram" role="img" aria-label="Loop Engineering: build, listen to feedback, improve, and repeat">
            <BotBackdrop><WorkshopMascot /></BotBackdrop>
            <svg viewBox="0 0 440 360" aria-hidden="true" focusable="false">
              <defs><marker id="loop-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1 6 4 1 7" fill="none" stroke="currentColor" strokeWidth="1.5" /></marker></defs>
              <g fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#loop-arrow)"><path d="M220 70C320 70 355 123 335 192" /><path d="M320 235C260 315 155 302 116 250" /><path d="M100 205C55 130 110 65 165 65" /></g>
              <text x="200" y="40" textAnchor="middle" className="loop-diagram-label">Build</text><text x="355" y="258" textAnchor="middle" className="loop-diagram-label">Listen</text><text x="80" y="268" textAnchor="middle" className="loop-diagram-label">Improve</text>
            </svg>
          </div>
          <p className="loop-art-caption">Different perspectives. One stronger team.</p>
        </div>
      </section>
      <section className="loop-how" aria-labelledby="how-heading">
        <div className="loop-how-heading"><h2 id="how-heading">Make every session count.</h2><p>One workshop. A useful feedback loop.</p></div>
        <ol className="loop-steps">
          <li><div className="loop-step-icon"><Code2 size={21} aria-hidden="true" /></div><span className="loop-step-number" aria-hidden="true">01</span><h3>Take something in.</h3><p>Join a talk. Notice the ideas, examples, and questions that stay with you.</p></li>
          <li><div className="loop-step-icon"><MessageSquare size={21} aria-hidden="true" /></div><span className="loop-step-number" aria-hidden="true">02</span><h3>Leave something useful.</h3><p>Choose your rating and share a thought. A comment is always optional.</p></li>
          <li><div className="loop-step-icon"><RefreshCw size={21} aria-hidden="true" /></div><span className="loop-step-number" aria-hidden="true">03</span><h3>See the bigger picture.</h3><p>Explore the room&apos;s ratings and response counts, one talk at a time.</p></li>
        </ol>
      </section>
    </div>
  );
}
