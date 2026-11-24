"use client";

import { useEffect, useState } from "react";
import { profileSchema, type CaptionProfile } from "@/lib/captions";
import { useViewerLanguage } from "./viewer-language";

const storageKey = "scenecaptions.named-profiles.v1";
type SavedProfile = { name: string; profile: CaptionProfile; language: "en" | "ur" };

export function NamedProfiles({ profile, onApply }: { profile: CaptionProfile; onApply: (profile: CaptionProfile) => void }) {
  const { language, setLanguage } = useViewerLanguage();
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const urdu = language === "ur";
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(stored)) setProfiles(stored.filter(item => typeof item?.name === "string" && ["en", "ur"].includes(item.language) && profileSchema.safeParse(item.profile).success).map(item => ({...item, profile: profileSchema.parse(item.profile)})));
    } catch { setMessage("Saved profiles could not be loaded."); }
  }, []);
  function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const stored: SavedProfile[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const next = [...stored.filter(item => item.name !== trimmed), {name: trimmed, profile, language}];
      localStorage.setItem(storageKey, JSON.stringify(next));
      setProfiles(next);
      setMessage(urdu ? "پروفائل محفوظ ہو گیا۔" : "Profile saved on this device.");
    } catch { setMessage(urdu ? "محفوظ نہیں ہو سکا۔" : "Unable to save in this browser."); }
  }
  return <details className="readability"><summary>{urdu ? "محفوظ پروفائل" : "Saved profiles"}</summary>
    <label htmlFor="saved-profile">{urdu ? "پروفائل منتخب کریں" : "Load a profile"}</label>
    <select id="saved-profile" value="" onChange={event => {
      const saved = profiles.find(item => item.name === event.target.value);
      if (saved) { onApply(profileSchema.parse(saved.profile)); setLanguage(saved.language); setName(saved.name); setMessage(saved.name); }
    }}><option value="">{urdu ? "منتخب کریں" : "Choose a profile"}</option>{profiles.map(item => <option key={item.name}>{item.name}</option>)}</select>
    <label htmlFor="profile-name">{urdu ? "پروفائل کا نام" : "Profile name"}</label>
    <input id="profile-name" maxLength={60} value={name} onChange={event => setName(event.target.value)} />
    <button type="button" disabled={!name.trim()} onClick={save}>{urdu ? "موجودہ ترجیحات محفوظ کریں" : "Save current preferences"}</button>
    <p>{urdu ? "اسی نام کو محفوظ کرنے سے پرانی ترجیحات بدل جائیں گی۔" : "Saving an existing name replaces its preferences. Profiles stay on this device."}</p>
    <p role="status">{message}</p>
  </details>;
}
