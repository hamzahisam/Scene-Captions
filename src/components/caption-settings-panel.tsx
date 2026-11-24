"use client";

import { NamedProfiles } from "./named-profiles";
import { useRef } from "react";
import type { RefObject } from "react";
import type { CaptionProfile, CaptionVideo, Condition } from "@/lib/captions";
import { readViewerLanguage } from "@/lib/viewer-language";
import { CaptionStyleControls } from "./caption-style-controls";
import { CaptionReadability } from "./caption-readability";
import { useDialogFocus } from "./hooks/use-dialog-focus";
import { useViewerLanguage } from "./viewer-language";

export function CaptionSettingsPanel({ open, close, trigger, profile, onApply, data, condition, docked,
  soundSettingsAllowed, defaultReadingSpeed, languageLocked, canSample, sampleEnabled, onToggleSample, study, trackNotice }: {
  open: boolean;
  close: () => void;
  trigger: RefObject<HTMLButtonElement | null>;
  profile: CaptionProfile;
  onApply: (p: CaptionProfile) => void;
  data: CaptionVideo | null;
  condition: Condition;
  docked: boolean;
  soundSettingsAllowed: boolean;
  defaultReadingSpeed?: 15 | 17 | 20;
  languageLocked: boolean;
  canSample: boolean;
  sampleEnabled: boolean;
  onToggleSample: () => void;
  study: boolean;
  trackNotice?: "translationDraft" | "translationMissing";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const { t, language, setLanguage } = useViewerLanguage();
  useDialogFocus(open && !docked, panel, trigger, close, false);
  if (!open && !docked) return null;

  const fixed = !soundSettingsAllowed || condition === "baseline";
  const noSounds = !!data && !data.cues.length;
  function dismiss() {
    close();
    requestAnimationFrame(() => trigger.current?.focus());
  }

  return (
    <div ref={panel} id="caption-settings" className={`caption-settings${docked ? " docked" : ""}`}
      role={docked ? "region" : "dialog"} aria-labelledby="caption-settings-title" aria-modal={docked ? undefined : true}>
      <div className={docked ? "dock-head" : "settings-heading"}>
        <h2 id="caption-settings-title">{t("captionSettings")}</h2>
        {!docked && <button type="button" onClick={dismiss} aria-label={t("closeSettings")}>×</button>}
      </div>
      <p className="settings-save-note">{t("settingsSaved")}</p>
      <div className="caption-language-settings">
        <label htmlFor="settings-interface-language">{t("interfaceLanguage")}</label>
        <select id="settings-interface-language" data-dialog-initial disabled={study} value={language} aria-describedby="language-help"
          onChange={event => setLanguage(readViewerLanguage(event.target.value))}>
          <option value="en" lang="en">English</option><option value="ur" lang="ur">اردو</option>
        </select>
        <label htmlFor="settings-caption-language">{t("captionLanguage")}</label>
        <select id="settings-caption-language" value={languageLocked ? "en" : profile.captionLanguage}
          disabled={languageLocked} aria-describedby={languageLocked ? "locked-language" : "language-help"}
          onChange={event => onApply({ ...profile, captionLanguage: readViewerLanguage(event.target.value) })}>
          <option value="en" lang="en">English</option><option value="ur" lang="ur">اردو</option>
        </select>
        <p id="language-help" className="hint">{t("languageHelp")}</p>
        {languageLocked && <p id="locked-language" className="hint">{t("fixedLanguage")}</p>}
        {trackNotice && <p className="hint" role={trackNotice === "translationMissing" ? "status" : undefined}>{t(trackNotice)}</p>}
      </div>
      <section className="settings-preview">
        <h3>{t("preview")}</h3>
        <p>{t(study ? "previewStudy" : "previewHelp")}</p>
        {!study && <><button type="button" disabled={!canSample && !sampleEnabled} aria-pressed={sampleEnabled} onClick={onToggleSample}>
          {t(sampleEnabled ? "hideSample" : "showSample")}
        </button>{!canSample && !sampleEnabled && <p className="hint">{t("noSample")}</p>}</>}
      </section>
      {fixed && <p className="dock-note">{t("fixedSound")}</p>}
      {noSounds && <p className="dock-note">{t("noSounds")}</p>}
      {!fixed && !noSounds && <fieldset className="dock-sound">
        <legend className="dock-legend">{t("soundCaptions")}</legend>
        <CaptionStyleControls profile={profile} onChange={onApply} defaultReadingSpeed={defaultReadingSpeed}
          conservative={data?.generated_with.expressiveness === "conservative"} />
      </fieldset>}
      {!study && <NamedProfiles profile={profile} onApply={onApply} />}
      <CaptionReadability profile={profile} onApply={onApply} />
      {!docked && <div className="settings-done"><button type="button" className="done-button" onClick={dismiss}>{t("done")}</button></div>}
    </div>
  );
}
