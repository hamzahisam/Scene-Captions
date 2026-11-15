"use client";
import { useEffect, useState } from "react";

/**
 * Sticky table of contents for long reading pages. Marks the section in view
 * (aria-current="location") and shows reading progress through the article.
 */
export function ReadingToc({
  items,
  numbered = false,
  label,
}: {
  items: { id: string; title: string }[];
  numbered?: boolean;
  label: string;
}) {
  const [active, setActive] = useState(items[0]?.id);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const sections = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const update = () => {
      const offset = 140;
      let current = sections[0]?.id;
      for (const s of sections) if (s.getBoundingClientRect().top - offset <= 0) current = s.id;
      setActive(current);
      const article = sections[0]?.parentElement;
      if (article) {
        const r = article.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        setProgress(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1);
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);
  return (
    <nav className="toc" aria-label={label}>
      <p className="toc__title">On this page</p>
      <span className="toc__progress" aria-hidden="true">
        <span style={{ transform: `scaleY(${progress})` }} />
      </span>
      <ol className={numbered ? "toc__list toc__list--numbered" : "toc__list"}>
        {items.map((item, i) => (
          <li key={item.id}>
            <a href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined}>
              {numbered && <span className="toc__n">{i + 1}</span>}
              <span>{item.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
