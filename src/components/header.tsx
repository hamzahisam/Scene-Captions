"use client";
import {useStudySession} from "./study-context";
import Link from "next/link";
import { Icon } from "./icon";
export function Header({ page = "watch" }: { page?: "watch" | "experiment" | "creator" | "captune" | "methodology" }) {
  const {session,ready,error}=useStudySession();
  if(!ready||session||error)return <header className="site-header"><div className="header-inner"><span className="brand">scenecaptions.</span></div></header>;
  return <header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="SceneCaptions home"><span className="brand-mark"><Icon name="sound" size={24} /></span><span>scene<span className="brand-light">captions</span><span className="brand-period">.</span></span></Link><span className="phase-label">PHASE 01 <span>Research prototype</span></span></div></header>;
}
