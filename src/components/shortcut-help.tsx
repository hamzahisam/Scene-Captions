"use client";

import { useRef } from "react";
import type { RefObject } from "react";
import type { CaptionProfile } from "@/lib/captions";
import type { ViewerMessage } from "@/lib/viewer-language";
import { useDialogFocus } from "./hooks/use-dialog-focus";
import { useViewerLanguage } from "./viewer-language";

const shortcutRows: [string, ViewerMessage][] = [
  ["Space / K", "playPause"], ["J / ←", "back"], ["L / →", "forward"], ["C", "captionSettings"],
  ["[ / ]", "changeDetail"], ["− / =", "changeSize"], ["F", "fullscreen"], ["P / N", "navigateSound"],
  ["?", "thisHelp"], ["Esc", "closePanel"],
];

export function ShortcutHelp({open, close, trigger, profile, onChange, soundControls = true}: {
  soundControls?: boolean;
  open: boolean;
  close: () => void;
  trigger: RefObject<HTMLButtonElement | null>;
  profile: CaptionProfile;
  onChange: (p: CaptionProfile) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useViewerLanguage();
  useDialogFocus(open, ref, trigger, close, false);
  if (!open) return null;
  return <div className="caption-settings shortcut-help" role="dialog" aria-labelledby="shortcut-heading" aria-modal="true" ref={ref}>
    <h2 id="shortcut-heading">{t("keyboard")}</h2>
    <button type="button" onClick={() => { close(); requestAnimationFrame(() => trigger.current?.focus()); }}>{t("closeHelp")}</button>
    <dl>{shortcutRows.filter(([, name]) => name !== "changeDetail" || soundControls).map(([key, name]) =>
      <div key={key}><dt><kbd dir="ltr" lang="en">{key}</kbd></dt><dd>{t(name)}</dd></div>)}</dl>
    <label><input type="checkbox" checked={profile.shortcuts}
      onChange={event => onChange({...profile, shortcuts: event.target.checked})} /> {t("shortcuts")}</label>
    <label><input type="checkbox" checked={profile.pageWideShortcuts}
      onChange={event => onChange({...profile, pageWideShortcuts: event.target.checked})} /> {t("pageShortcuts")}</label>
    <p>{t("shortcutHelp")}</p>
  </div>;
}
