"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useStudySession } from "./study-context";
import { Icon } from "./icon";

type Page = "watch" | "experiment" | "session" | "creator" | "captune" | "methodology";

const RESEARCH_LINKS: { href: string; label: string; page: Page }[] = [
  { href: "/experiment", label: "Study plan", page: "experiment" },
  { href: "/session", label: "Session setup", page: "session" },
  { href: "/creator", label: "Caption creator", page: "creator" },
  { href: "/captune", label: "CapTune viewer", page: "captune" },
  { href: "/captune/methodology", label: "Methodology", page: "methodology" },
];

/** Abstract soundprint mark: four bars in the four sound hues. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <rect x="2" y="10" width="4.5" height="8" rx="2.25" fill="var(--sound-effect)" />
      <rect x="8.5" y="4" width="4.5" height="20" rx="2.25" fill="var(--sound-music)" />
      <rect x="15" y="7" width="4.5" height="14" rx="2.25" fill="var(--sound-ambience)" />
      <rect x="21.5" y="11" width="4.5" height="6" rx="2.25" fill="var(--sound-voice)" />
    </svg>
  );
}

function Wordmark() {
  return (
    <>
      <BrandMark />
      <span className="wordmark__text">scenecaptions</span>
    </>
  );
}

function ResearchMenu({ page }: { page: Page }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const active = RESEARCH_LINKS.some((l) => l.page === page);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const outside = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) setOpen(false);
    };
    const leave = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      if (next && !menu.current?.contains(next) && !button.current?.contains(next)) setOpen(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    menu.current?.addEventListener("focusout", leave);
    const el = menu.current;
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
      el?.removeEventListener("focusout", leave);
    };
  }, [open]);
  return (
    <div className="research-menu">
      <button
        ref={button}
        type="button"
        className={`nav-link research-menu__button ${active ? "is-active" : ""}`}
        aria-expanded={open}
        aria-controls="research-menu"
        aria-label="Research"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="research" size={20} className="research-menu__icon" />
        <span className="research-menu__label" aria-hidden="true">
          Research
        </span>
        <Icon name="chevronDown" size={18} className="research-menu__chevron" />
      </button>
      <div ref={menu} id="research-menu" className="research-menu__panel" hidden={!open}>
        <ul>
          {RESEARCH_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={page === link.page ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Header({ page = "watch" }: { page?: Page }) {
  const { session, ready, error } = useStudySession();
  // Study mode, loading and errors: wordmark only, same height, nothing shifts.
  if (page === "watch" && (!ready || session || error))
    return (
      <header className="site-header">
        <div className="site-header__inner">
          <span className="wordmark">
            <Wordmark />
          </span>
        </div>
      </header>
    );
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="wordmark" aria-label="SceneCaptions home">
          <Wordmark />
        </Link>
        <nav aria-label="Main navigation" className="site-nav">
          <Link href="/" className="nav-link" aria-current={page === "watch" ? "page" : undefined}>
            Watch
          </Link>
          <ResearchMenu page={page} />
        </nav>
      </div>
    </header>
  );
}
