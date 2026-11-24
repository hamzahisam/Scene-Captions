"use client";

import type { CaptionProfile, Level } from "@/lib/captions";
import { detailLabels } from "@/lib/viewer-language";
import { useViewerLanguage } from "./viewer-language";

export function CaptionStyleControls({ profile, onChange, conservative, defaultReadingSpeed }: {
  profile: CaptionProfile;
  onChange: (profile: CaptionProfile) => void;
  conservative: boolean;
  defaultReadingSpeed?: 15 | 17 | 20;
}) {
  const { t, language } = useViewerLanguage();
  const number = new Intl.NumberFormat(language);
  return <>
    <label className="keep-up">
      <input type="checkbox" role="switch" aria-describedby="keep-up-help" checked={profile.adaptive}
        onChange={event => onChange({ ...profile, adaptive: event.target.checked })} />
      {t("adapt")}
    </label>
    <p id="keep-up-help" className="hint">{t("adaptHelp")}</p>
    <fieldset className="amount-options" aria-describedby="detail-mode">
      <legend>{t("detail")}</legend>
      {detailLabels.map((label, index) => {
        const level = (index + 1) as Level;
        return <label key={label}>
          <input type="radio" name="amount" value={level} checked={profile.detail === level}
            onChange={() => onChange({ ...profile, detail: level })} />
          <span>{t(label)}<small>{t((["essentialHelp", "balancedHelp", "richHelp"] as const)[index])}</small></span>
        </label>;
      })}
    </fieldset>
    <p id="detail-mode" className="hint">{t(profile.adaptive ? "maxDetail" : "fixedDetail")}</p>
    {profile.adaptive && <p className="hint">{t("shortenedLegend")}</p>}
    <details className="more-sound-options">
      <summary>{t("moreSound")}</summary>
      <fieldset className="seg pace-options" aria-describedby="pace-help">
        <legend>{t("readingPace")}</legend>
        {([15, 17, 20] as const).map((pace, index) => <label key={pace}>
          <input type="radio" name="reading-pace" value={pace} checked={profile.readingSpeed === pace}
            onChange={() => onChange({ ...profile, readingSpeed: pace })} />
          <span>{number.format(pace)} · {t((["slower", "standard", "faster"] as const)[index])}
            {defaultReadingSpeed === pace && ` (${t("paceDefault")})`}</span>
        </label>)}
      </fieldset>
      <p id="pace-help" className="hint">{t("paceHelp")}</p>
      <fieldset disabled={conservative}>
        <legend>{t("punctuation")}</legend>
        {(["none", "fullStop", "exclamation"] as const).map((label, index) => {
          const expression = (index + 1) as Level;
          return <label key={label}>
            <input type="radio" name="punctuation" checked={profile.expression === expression}
              onChange={() => onChange({ ...profile, expression })} />{t(label)}
          </label>;
        })}
      </fieldset>
      <p>{t(conservative ? "punctuationUnavailable" : "punctuationHelp")}</p>
      <label><input type="checkbox" checked={profile.markShortened}
        onChange={event => onChange({ ...profile, markShortened: event.target.checked })} />{t("markShortened")}</label>
      <label><input type="checkbox" role="switch" checked={profile.typeStyling}
        onChange={event => onChange({ ...profile, typeStyling: event.target.checked })} />{t("typeStyling")}</label>
      <p>{t("typeHelp")}</p>
      <label htmlFor="music-wording">{language === "ur" ? "موسیقی کی عبارت" : "Music wording"}</label>
      <select id="music-wording" value={profile.musicWording} onChange={event => onChange({...profile, musicWording: event.target.value as CaptionProfile["musicWording"]})}>
        <option value="source">{language === "ur" ? "اصل تفصیل" : "Original description"}</option>
        <option value="descriptive">{language === "ur" ? "ساز کی تفصیل" : "Instruments and sound"}</option>
        <option value="mood">{language === "ur" ? "کیفیت" : "Mood"}</option>
      </select>
      <p>{language === "ur" ? "متبادل عبارت دستیاب ہونے پر لاگو ہوتی ہے۔" : "Uses prepared alternatives where available. Other music captions retain their source description."}</p>
      <label htmlFor="representation">{t("representation")}</label>
      <select id="representation" value={profile.representation}
        onChange={event => onChange({ ...profile, representation: event.target.value as CaptionProfile["representation"] })}>
        {(["descriptive", "plain", "onomatopoeic"] as const).map(value => <option key={value} value={value}>{t(value)}</option>)}
      </select>
      <p>{t("representationHelp")}</p>
    </details>
  </>;
}
