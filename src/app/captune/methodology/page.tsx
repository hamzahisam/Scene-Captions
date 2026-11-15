import Link from "next/link";
import { Header } from "@/components/header";
import { Icon } from "@/components/icon";
import { ReadingToc } from "@/components/reading-toc";
import { methodology } from "@/lib/captune/methodology";

export const metadata = { title: "CapTune methodology — SceneCaptions" };

export default function Page() {
  const toc = [
    ...methodology.map((s, i) => ({ id: `method-${i}`, title: s.title.split(" · ")[0] })),
    { id: "method-sources", title: "Primary sources" },
  ];
  return (
    <div className="app-shell theme-paper">
      <Header page="methodology" />
      <main className="research-page experiment-page" id="main">
        <header className="page-hero">
          <p className="page-hero__kicker">CapTune method and reproduction status</p>
          <h1>Follow the method.</h1>
          <p className="page-hero__lede">What the paper describes, what is implemented, and what still requires research.</p>
          <div className="page-hero__actions">
            <Link className="btn btn--secondary" href="/creator">
              Open caption creator
            </Link>
          </div>
        </header>
        <p className="callout reading-banner">
          <Icon name="info" size={20} />
          <span>
            No participant study has been conducted. Model and runtime differences are intentional under the
            NVIDIA-only, precomputed-playback decision.
          </span>
        </p>
        <div className="reading-layout">
          <ReadingToc items={toc} label="Methodology sections" />
          <article className="reading">
            {methodology.map((s, i) => {
              const [title, ...rest] = s.title.split(" · ");
              return (
                <section key={s.title} id={`method-${i}`}>
                  <h2>
                    {title}
                    {rest.length > 0 && <span className="reading__aside">{rest.join(", ")}</span>}
                  </h2>
                  <p>{s.body}</p>
                </section>
              );
            })}
            <section id="method-sources">
              <h2>Primary sources</h2>
              <p>
                <a href="https://arxiv.org/abs/2508.19971">Huang et al. (2025), CapTune, §§3–7 and Appendix A</a>. The
                local 18-page PDF is the implementation reference. The authors’ current repository README mentions
                GPT‑5, which differs from the paper’s GPT‑4o; we follow the paper when describing its methodology.
              </p>
              <ul className="link-list">
                <li>
                  <a href="https://github.com/SoundabilityLab/CapTune">Authors’ repository</a>
                </li>
                <li>
                  <Link href="/experiment">Earlier SceneCaptions long-form proposal</Link>
                </li>
              </ul>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
}
