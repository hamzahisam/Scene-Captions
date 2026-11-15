import Link from "next/link";
import { Header } from "@/components/header";
import { Icon } from "@/components/icon";
import { ReadingToc } from "@/components/reading-toc";
import { experimentSections } from "@/lib/experiment";

export const metadata = { title: "Study plan — SceneCaptions" };

export default function ExperimentPage() {
  const toc = [
    ...experimentSections.map((section, i) => ({ id: `plan-${i}`, title: section.title.split(" · ")[0] })),
    { id: "plan-grounding", title: "Research grounding" },
  ];
  return (
    <div className="app-shell theme-paper">
      <Header page="experiment" />
      <main id="main" className="research-page experiment-page">
        <header className="page-hero">
          <p className="page-hero__kicker">Proposed protocol</p>
          <h1>How we’ll study it.</h1>
          <p className="page-hero__lede">A clear plan for testing the experience with DHH viewers.</p>
          <div className="page-hero__actions">
            <a className="btn btn--secondary" href="/research/experimental-plan.md" download>
              <Icon name="download" size={18} />
              Download full plan
            </a>
          </div>
        </header>
        <p className="callout reading-banner">
          <Icon name="info" size={20} />
          <span>
            <strong>Planning, not findings.</strong> No participants have been recruited or tested. The protocol,
            sample size and ethics process require instructor approval.
          </span>
        </p>
        <div className="reading-layout">
          <ReadingToc items={toc} numbered label="Plan sections" />
          <article className="reading">
            {experimentSections.map((section, i) => {
              const [title, ...rest] = section.title.split(" · ");
              return (
                <section key={section.title} id={`plan-${i}`}>
                  <h2>
                    <span className="reading__n" aria-hidden="true">
                      {i + 1}
                    </span>
                    {title}
                    {rest.length > 0 && <span className="reading__aside">{rest.join(", ")}</span>}
                  </h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              );
            })}
            <section id="plan-grounding">
              <h2>Research grounding</h2>
              <p>
                CapTune motivates the customization approach and identifies long-form viewing as an open direction. Our
                proposed experiment is a new protocol; its sample size and hypotheses are our team’s proposal.
              </p>
              <p>
                <a href="https://arxiv.org/abs/2508.19971" target="_blank" rel="noreferrer">
                  Huang et al. (2025). CapTune: Adapting Non-Speech Captions With Anchored Generative Models.
                </a>
              </p>
              <p>
                <Link href="/">Return to the working prototype</Link>
              </p>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}
