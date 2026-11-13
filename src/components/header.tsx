"use client";
import {useStudySession} from "./study-context";
import Link from "next/link";
import { Icon } from "./icon";
export function Header({ page = "watch" }: { page?: "watch" | "experiment" | "creator" | "captune" | "methodology" }) {
  const {session,ready,error}=useStudySession();
  if(!ready||session||error)return <header className="site-header"><div className="header-inner"><span className="brand">scenecaptions.</span></div></header>;
  const paper = page === "creator" || page === "captune" || page === "methodology";
  return <header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="SceneCaptions home"><span className="brand-mark"><Icon name="sound" size={24} /></span><span>scene<span className="brand-light">captions</span><span className="brand-period">.</span></span></Link><nav aria-label="Main navigation"><Link href="/" aria-current={page === "watch" ? "page" : undefined}>Watch</Link><details className="lab-nav"><summary>Lab</summary><div><Link href="/session">Session setup</Link><Link href="/creator" aria-current={page === "creator" ? "page" : undefined}>Creator</Link><Link href="/captune" aria-current={page === "captune" ? "page" : undefined}>Anchored viewer</Link></div></details><Link href={paper ? "/captune/methodology" : "/experiment"} aria-current={page === "experiment" || page === "methodology" ? "page" : undefined}>{paper ? "Methodology" : "Experimental plan"}</Link></nav><span className="phase-label">PHASE 01 <span>Research prototype</span></span></div></header>;
}
