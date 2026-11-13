"use client";
import { DEFAULT_PROFILE } from "@/lib/captions";
import type { CaptionProfile } from "@/lib/captions";
import { Icon } from "./icon";

export function CaptionReadability({ profile, onApply }: { profile: CaptionProfile; onApply: (profile: CaptionProfile) => void }) {
  return (
    <details className="readability"><summary>Appearance</summary><label htmlFor="size">Text size</label><select id="size" value={profile.size} onChange={(e) => onApply({ ...profile, size: e.target.value as CaptionProfile["size"] })}><option value="standard">Standard</option><option value="large">Large</option><option value="extra-large">Extra large</option></select><label htmlFor="position">Position on the video</label><select id="position" value={profile.position} onChange={(e) => onApply({ ...profile, position: e.target.value as CaptionProfile["position"] })}><option value="bottom">Bottom</option><option value="top">Top</option></select><label htmlFor="backdrop">Backdrop</label><select id="backdrop" value={profile.backdrop} onChange={e=>onApply({...profile,backdrop:e.target.value as CaptionProfile["backdrop"]})}><option value="solid">Solid</option><option value="translucent">Translucent</option><option value="outline">None, with text outline</option></select>{profile.backdrop==="outline"&&<p>Text outlines cannot guarantee contrast against every picture.</p>}<label htmlFor="text-color">Text colour</label><select id="text-color" value={profile.textColor} onChange={e=>onApply({...profile,textColor:e.target.value as CaptionProfile["textColor"]})}><option value="white">White</option><option value="yellow">Yellow</option></select><p>Font: system sans-serif. Your device chooses its installed font.</p><button className="text-button" onClick={() => onApply({ ...profile, size: DEFAULT_PROFILE.size, position: DEFAULT_PROFILE.position,backdrop:DEFAULT_PROFILE.backdrop,textColor:DEFAULT_PROFILE.textColor })}><Icon name="reset" size={14} />Reset readability</button></details>
  );
}
