"use client";
import {useStudySession} from "./study-context";
import Link from "next/link";
import { Icon } from "./icon";
import { useViewerLanguage } from "./viewer-language";
export function Header({ page = "watch" }: { page?: "watch" | "experiment" | "creator" | "captune" | "methodology" }) {
  const { t } = useViewerLanguage();
  const {session,ready,error}=useStudySession();
  if(!ready||session||error)return <header className="site-header"><div className="header-inner"><span className="brand">scenecaptions.</span></div></header>;
  return <header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label={t("home")}><span className="brand-mark"><Icon name="sound" size={24} /></span><span dir="ltr" lang="en">scene<span className="brand-light">captions</span><span className="brand-period">.</span></span></Link><span className="phase-label">{t("phase")} <span>{t("prototype")}</span></span></div></header>;
}
