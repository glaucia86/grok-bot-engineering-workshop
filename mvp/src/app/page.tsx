import Link from "next/link";
import { ArrowRight, ArrowUpRight, BarChart3, Check, MessageSquare, MessageSquareText, Star, Target } from "lucide-react";
import { BotBackdrop } from "@/components/bot-backdrop";
import { WorkshopMascot } from "@/components/workshop-mascot";

export default function Home() {
  return (
    <article className="company-home">
      <section className="company-hero" aria-labelledby="home-heading">
        <div className="company-hero-copy">
          <p className="company-kicker"><MessageSquareText size={17} aria-hidden="true" />Packt workshop</p>
          <h1 id="home-heading">Better talks.<br /><span>Built together.</span></h1>
          <p className="company-hero-description">Share what worked, help speakers improve, and discover what resonated across the workshop.</p>
          <div className="loop-actions">
            <Link className="loop-primary" href="/feedback">Leave feedback <ArrowRight aria-hidden="true" size={18} /></Link>
            <Link className="loop-secondary" href="/results">Explore results <ArrowUpRight aria-hidden="true" size={18} /></Link>
          </div>
        </div>
        <div className="company-hero-visual">
          <div className="company-art-plane" aria-hidden="true" />
          <div className="company-orbit company-orbit-outer" aria-hidden="true" />
          <div className="company-orbit company-orbit-inner" aria-hidden="true" />
          <div className="loop-diagram company-parallax-art" role="img" aria-label="Five original workshop characters bringing different perspectives together">
            <BotBackdrop><WorkshopMascot /></BotBackdrop>
          </div>
          <span className="company-art-symbol company-art-message" aria-hidden="true"><MessageSquareText size={26} strokeWidth={1.7} /></span>
          <span className="company-art-symbol company-art-star" aria-hidden="true"><Star size={24} strokeWidth={1.7} /></span>
        </div>
      </section>

      <section className="company-benefits" aria-labelledby="how-heading">
        <div className="company-benefits-copy">
          <h2 id="how-heading">Good feedback<br />goes further.</h2>
          <p>A clear place for participants to reflect and for speakers to understand the room.</p>
        </div>
        <ol className="loop-steps company-benefit-list">
          <li><MessageSquare size={23} aria-hidden="true" /><div><h3>Make your experience heard</h3><p>Rate the talk you attended. Add a specific thought when you have something more to share.</p></div></li>
          <li><BarChart3 size={23} aria-hidden="true" /><div><h3>See the room&apos;s perspective</h3><p>Compare ratings across talks and explore each session&apos;s responses and written comments.</p></div></li>
          <li><Target size={23} aria-hidden="true" /><div><h3>Make the next session stronger</h3><p>Help speakers understand what clicked and where a clearer explanation could make a difference.</p></div></li>
        </ol>
      </section>

      <section className="company-showcase" aria-labelledby="showcase-heading">
        <div className="company-showcase-heading">
          <h2 id="showcase-heading">One place to share.<br />A clearer way to learn.</h2>
          <p>A focused form for your perspective. A dedicated view for the feedback behind every talk.</p>
        </div>
        <figure className="company-preview" aria-label="An illustration of the feedback experience">
          <div className="company-preview-bar"><span className="company-preview-brand"><MessageSquareText size={17} aria-hidden="true" />Talk Feedback</span><span>Interface overview</span></div>
          <div className="company-preview-panels">
            <div className="company-preview-form">
              <div className="company-preview-title"><MessageSquare size={19} aria-hidden="true" /><h3>Leave feedback</h3></div>
              <p>How was the talk?</p>
              <dl className="company-preview-fields">
                <div><dt>Talk</dt><dd>The session you attended</dd></div>
                <div><dt>Your name</dt><dd>Your name is required</dd></div>
                <div className="company-preview-rating"><dt>Rating</dt><dd><span aria-label="Five-star rating scale">{[1, 2, 3, 4, 5].map(star => <Star key={star} size={22} aria-hidden="true" />)}</span><span>Choose your rating</span></dd></div>
                <div><dt>Comment <span>(optional)</span></dt><dd>What clicked? What could be clearer?</dd></div>
              </dl>
            </div>
            <div className="company-preview-results">
              <div className="company-preview-title"><BarChart3 size={19} aria-hidden="true" /><h3>Workshop results</h3></div>
              <p>Understand the feedback behind each talk.</p>
              <ul>
                <li><span className="company-preview-result-icon"><Star size={22} aria-hidden="true" /></span><div><strong>Ratings at a glance</strong><span>Average scores and response counts</span></div><Check size={17} aria-hidden="true" /></li>
                <li><span className="company-preview-result-icon"><BarChart3 size={22} aria-hidden="true" /></span><div><strong>A closer look at each talk</strong><span>Rating distribution, from one to five stars</span></div><Check size={17} aria-hidden="true" /></li>
                <li><span className="company-preview-result-icon"><MessageSquareText size={22} aria-hidden="true" /></span><div><strong>The words behind the ratings</strong><span>Written comments, with names hidden</span></div><Check size={17} aria-hidden="true" /></li>
              </ul>
              <p className="company-preview-note">Your perspective becomes part of the conversation.</p>
            </div>
          </div>
          <figcaption>Illustrative preview. No live workshop data.</figcaption>
        </figure>
      </section>
    </article>
  );
}
