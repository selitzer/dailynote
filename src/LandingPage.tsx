import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import "./LandingPage.css";

type Props = {
  onGetStarted: () => void;
  onLogin: () => void;
};

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("lp-revealed");
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function RevealSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useReveal();

  return (
    <div ref={ref} className={`lp-reveal ${className}`}>
      {children}
    </div>
  );
}

const featureCards = [
  {
    title: "One page for today",
    body: "Daily Diario always opens to the current day, so writing feels simple instead of overwhelming.",
    visual: (
      <div className="lp-feature-visual lp-visual-entry">
        <div className="lp-visual-entry-top">
          <span>Today</span>
          <span>8h 42m left</span>
        </div>
        <div className="lp-visual-lines">
          <span />
          <span />
          <span />
        </div>
        <div className="lp-visual-save">Saved</div>
      </div>
    ),
  },
  {
    title: "Find old moments fast",
    body: "Browse entries by month, day, or most recent when you want to look back.",
    visual: (
      <div className="lp-feature-visual lp-visual-list">
        {["May 15", "May 14", "May 12"].map((date, i) => (
          <div key={date} className={`lp-visual-list-row lp-visual-list-row-${i}`}>
            <span>{date}</span>
            <div>
              <span />
              <span />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "A year you can see",
    body: "Marked calendar days turn your writing habit into a quiet visual streak.",
    visual: (
      <div className="lp-feature-visual lp-visual-calendar">
        {Array.from({ length: 21 }).map((_, i) => (
          <span
            key={i}
            className={
              [1, 2, 5, 7, 8, 12, 15, 18].includes(i)
                ? "lp-calendar-day lp-calendar-day-filled"
                : "lp-calendar-day"
            }
          />
        ))}
      </div>
    ),
  },
  {
    title: "Keep every chapter",
    body: "Each year can become its own journal, so your past entries stay organized without clutter.",
    visual: (
      <div className="lp-feature-visual lp-visual-stack">
        <div className="lp-journal-card lp-journal-card-back"></div>
        <div className="lp-journal-card lp-journal-card-mid"></div>
        <div className="lp-journal-card lp-journal-card-front">2026 Journal</div>
      </div>
    ),
  },
];

export default function LandingPage({ onGetStarted, onLogin }: Props) {
  return (
    <div className="lp">
      <nav className="lp-nav">
        <span className="lp-nav-logo">Daily Diario</span>

        <div className="lp-nav-actions">
          <button onClick={onLogin} className="lp-nav-login">
            Log in
          </button>
          <button onClick={onGetStarted} className="lp-nav-cta">
            Get Started
          </button>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero-text lp-reveal lp-revealed">
          <p className="lp-eyebrow">Your daily writing space</p>
          <h1 className="lp-headline">
            The journal
            <br />
            you'll actually keep.
          </h1>
          <p className="lp-hero-sub">
            One entry. Every day. From wherever you are.
          </p>
          <button onClick={onGetStarted} className="lp-btn-primary">
            Start Journaling
          </button>
        </div>

        <div className="lp-hero-mockup lp-reveal lp-reveal-delay lp-revealed">


          <div className="lp-mockup-shell">
            <div className="lp-mockup-sidebar">
              <div className="lp-mockup-logo">Daily Diario</div>

              <div className="lp-mockup-nav-item lp-mockup-nav-active">
                <span className="lp-mockup-dot" /> Today
              </div>
              <div className="lp-mockup-nav-item">
                <span className="lp-mockup-dot lp-mockup-dot-dim" /> Past Entries
              </div>
              <div className="lp-mockup-nav-item">
                <span className="lp-mockup-dot lp-mockup-dot-dim" /> Calendar
              </div>

              <div className="lp-mockup-sidebar-bottom">
                <div className="lp-mockup-avatar">J</div>
              </div>
            </div>

            <div className="lp-mockup-editor">
              <div className="lp-mockup-date">Thursday, May 15, 2025</div>
              <div className="lp-mockup-journal-name">My 2025 Journal</div>

              <div className="lp-mockup-textarea">
                <div className="lp-mockup-line lp-mockup-line-full" />
                <div className="lp-mockup-line lp-mockup-line-3q" />
                <div className="lp-mockup-line lp-mockup-line-full" />
                <div className="lp-mockup-line lp-mockup-line-half" />
                <div className="lp-mockup-cursor" />
              </div>

              <div className="lp-mockup-footer">
                <span className="lp-mockup-time">8h 42m left today</span>
                <button className="lp-mockup-save">Save</button>
              </div>
            </div>
          </div>

          <div className="lp-mockup-pill">
            <span className="lp-mockup-pill-dot" />
            47 entries this year
          </div>
        </div>
      </section>

      <section className="lp-problem">
        <RevealSection className="lp-problem-inner">
          <div className="lp-problem-copy">
            <p className="lp-section-label">Why it helps</p>
            <h2 className="lp-problem-quote">
              Most journals fail because they ask for too much.
            </h2>
            <p className="lp-problem-body">
              Traditional journaling can feel like another task to manage. Daily Diario
              keeps the experience focused: one page for today, a simple place to write,
              and a clean way to look back when you want to.
            </p>
          </div>

   <div className="lp-memory-board" aria-hidden="true">
  <div className="lp-memory-card lp-memory-card-main">
    <span className="lp-memory-date">Morning</span>
    <p>A quick thought to start the day.</p>
  </div>
  <div className="lp-memory-card lp-memory-card-muted">
    <span className="lp-memory-date">Afternoon</span>
    <p>A moment worth remembering.</p>
  </div>
  <div className="lp-memory-card lp-memory-card-active">
    <span className="lp-memory-date">Tonight</span>
    <p>One entry saved for the future.</p>
  </div>
</div>
        </RevealSection>
      </section>

      <section className="lp-features">
        <RevealSection>
          <p className="lp-section-label">Features</p>
          <h2 className="lp-section-heading">
            Simple tools, shown visually.
          </h2>
        </RevealSection>

        <div className="lp-features-grid">
          {featureCards.map((feature, i) => (
            <RevealSection
              key={feature.title}
              className={`lp-feature-card lp-reveal-delay-${i}`}
            >
              {feature.visual}
              <h3 className="lp-feature-title">{feature.title}</h3>
              <p className="lp-feature-body">{feature.body}</p>
            </RevealSection>
          ))}
        </div>
      </section>

      <section className="lp-how">
        <RevealSection>
          <p className="lp-section-label">How it works</p>
          <h2 className="lp-section-heading">Up and writing in three steps.</h2>
        </RevealSection>

        <div className="lp-how-grid">
          <div className="lp-phone-preview" aria-hidden="true">
            <div className="lp-phone-speaker" />
            <div className="lp-phone-screen">
              <div className="lp-phone-date">Today</div>
              <div className="lp-phone-title">My 2026 Journal</div>
              <div className="lp-phone-lines">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="lp-phone-bottom">
                <span>23h left</span>
                <span>Save</span>
              </div>
            </div>
          </div>

          <div className="lp-steps">
            {[
              {
                num: "01",
                title: "Create your account",
                body: "Sign up with email or Google. Takes about 30 seconds.",
              },
              {
                num: "02",
                title: "Name your journal",
                body: "Give your year a title and make the space feel yours.",
              },
              {
                num: "03",
                title: "Write your first entry",
                body: "Today's page is already open. Just start typing.",
              },
            ].map((step, i) => (
              <RevealSection key={step.num} className={`lp-step lp-reveal-delay-${i}`}>
                <span className="lp-step-num">{step.num}</span>
                <div className="lp-step-content">
                  <h3 className="lp-step-title">{step.title}</h3>
                  <p className="lp-step-body">{step.body}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-cta">
        <RevealSection className="lp-cta-inner">
          <div className="lp-cta-card">
            <p className="lp-cta-tag">Start today</p>
            <h2 className="lp-cta-heading">
              This year deserves
              <br />
              to be remembered.
            </h2>
            <p className="lp-cta-body">
              You don't need to write perfectly. You just need to write
              something. Daily Diario makes that easy.
            </p>
            <button onClick={onGetStarted} className="lp-btn-primary">
              Create Your Journal
            </button>
          </div>
        </RevealSection>
      </section>

      <footer className="lp-footer">
        <span className="lp-footer-logo">Daily Diario</span>
        <span className="lp-footer-tagline">Write something today.</span>

        <div className="lp-footer-links">
          <button onClick={onLogin} className="lp-footer-link">
            Log in
          </button>
          <span className="lp-footer-sep">·</span>
          <button onClick={onGetStarted} className="lp-footer-link">
            Sign up
          </button>
        </div>
      </footer>
    </div>
  );
}
