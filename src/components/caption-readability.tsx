"use client";

import { DEFAULT_PROFILE } from "@/lib/captions";
import type { CaptionProfile } from "@/lib/captions";
import { sizeLabels } from "@/lib/viewer-language";
import { Icon } from "./icon";
import { useViewerLanguage } from "./viewer-language";

export function CaptionReadability({ profile, onApply }: { profile: CaptionProfile; onApply: (profile: CaptionProfile) => void }) {
  const { t, language } = useViewerLanguage();
  const percent = new Intl.NumberFormat(language, { style: "percent" });
  function change<K extends keyof CaptionProfile>(key: K, value: CaptionProfile[K]) {
    onApply({ ...profile, [key]: value });
  }
  return (
    <details className="readability" open>
      <summary>{t("appearance")}</summary>
      <label htmlFor="size">{t("textSize")}</label>
      <select id="size" value={profile.size} onChange={event => change("size", event.target.value as CaptionProfile["size"])}>
        {Object.entries(sizeLabels).map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}
      </select>
      <label htmlFor="position">{t("position")}</label>
      <select id="position" value={profile.position} onChange={event => change("position", event.target.value as CaptionProfile["position"])}>
        {(["bottom", "top"] as const).map(value => <option key={value} value={value}>{t(value)}</option>)}
      </select>
      <label htmlFor="dialogue-position">{language === "ur" ? "مکالمے کی جگہ" : "Dialogue position"}</label>
      <select id="dialogue-position" value={profile.dialoguePosition} onChange={event => change("dialoguePosition", event.target.value as CaptionProfile["dialoguePosition"])}>
        <option value="together">{language === "ur" ? "آوازوں کے ساتھ" : "Together with sounds"}</option>
        <option value="top">{t("top")}</option><option value="bottom">{t("bottom")}</option>
      </select>
      <label htmlFor="urdu-font">{language === "ur" ? "اردو خط" : "Urdu font"}</label>
      <select id="urdu-font" value={profile.urduFont} onChange={event => change("urduFont", event.target.value as CaptionProfile["urduFont"])}>
        <option value="nastaliq">Nastaliq — نستعلیق</option><option value="naskh">Naskh — نسخ</option>
      </select>
      <label><input type="checkbox" checked={profile.speakerLabels} onChange={event => change("speakerLabels", event.target.checked)} />{language === "ur" ? "تصدیق شدہ بولنے والوں کے نام" : "Reviewed speaker names"}</label>
      <label htmlFor="caption-width">{t("width")}</label>
      <select id="caption-width" value={profile.width} aria-describedby="caption-width-help"
        onChange={event => change("width", Number(event.target.value) as CaptionProfile["width"])}>
        {([70, 80, 90, 96] as const).map(width => <option key={width} value={width}>{percent.format(width / 100)}</option>)}
      </select>
      <p className="hint" id="caption-width-help">{t("widthHelp")}</p>
      <label htmlFor="backdrop">{t("backdrop")}</label>
      <select id="backdrop" value={profile.backdrop} onChange={event => change("backdrop", event.target.value as CaptionProfile["backdrop"])}>
        {(["solid", "translucent", "outline"] as const).map(value => <option key={value} value={value}>{t(value)}</option>)}
      </select>
      {profile.backdrop === "outline" && <p>{t("outlineHelp")}</p>}
      <label htmlFor="text-color">{t("textColor")}</label>
      <select id="text-color" value={profile.textColor} onChange={event => change("textColor", event.target.value as CaptionProfile["textColor"])}>
        {(["white", "yellow"] as const).map(value => <option key={value} value={value}>{t(value)}</option>)}
      </select>
      <label><input type="checkbox" checked={profile.italicSound} onChange={event => change("italicSound", event.target.checked)} />{t("italic")}</label>
      <fieldset className="accessibility-options">
        <legend>{t("accessibility")}</legend>
        <label><input type="checkbox" checked={profile.announceCaptions} onChange={event => change("announceCaptions", event.target.checked)} />{t("announce")}</label>
        <label><input type="checkbox" checked={profile.shortcuts} onChange={event => change("shortcuts", event.target.checked)} />{t("shortcuts")}</label>
        <label><input type="checkbox" checked={profile.pageWideShortcuts} onChange={event => change("pageWideShortcuts", event.target.checked)} />{t("pageShortcuts")}</label>
        <p>{t("shortcutHelp")}</p>
      </fieldset>
      <button type="button" className="text-button" onClick={() => {
        const { size, position, width, backdrop, textColor, italicSound } = DEFAULT_PROFILE;
        onApply({ ...profile, size, position, width, backdrop, textColor, italicSound });
      }}><Icon name="reset" size={14} />{t("reset")}</button>
    </details>
  );
}
