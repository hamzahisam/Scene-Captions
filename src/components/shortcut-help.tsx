"use client";
import type { RefObject } from "react";
import type { CaptionProfile } from "@/lib/captions";
import { Sheet } from "./ui/sheet";
import { Switch } from "./ui/switch";

const GROUPS: { title: string; items: [string[], string][] }[] = [
  {
    title: "Playback",
    items: [
      [["Space", "K"], "Play or pause"],
      [["J", "←"], "Back 5 seconds"],
      [["L", "→"], "Forward 5 seconds"],
      [["F"], "Fullscreen"],
    ],
  },
  {
    title: "Captions",
    items: [
      [["C"], "Caption settings"],
      [["[", "]"], "Less or more detail"],
      [["−", "="], "Smaller or larger text"],
    ],
  },
  {
    title: "Navigation",
    items: [
      [["P", "N"], "Previous or next sound"],
      [["?"], "This help"],
      [["Esc"], "Close a panel"],
    ],
  },
];

export function ShortcutHelp({
  open,
  close,
  trigger,
  profile,
  onChange,
}: {
  open: boolean;
  close: () => void;
  trigger: RefObject<HTMLButtonElement | null>;
  profile: CaptionProfile;
  onChange: (p: CaptionProfile) => void;
}) {
  return (
    <Sheet
      open={open}
      close={close}
      trigger={trigger}
      title="Keyboard shortcuts"
      closeLabel="Close"
      className="shortcut-help"
      footer={
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => {
            close();
            trigger.current?.focus();
          }}
        >
          Done
        </button>
      }
    >
      {GROUPS.map((group) => (
        <section key={group.title} className="shortcut-group" aria-labelledby={`keys-${group.title}`}>
          <h3 id={`keys-${group.title}`}>{group.title}</h3>
          <dl>
            {group.items.map(([keys, action]) => (
              <div key={action}>
                <dt>
                  {keys.map((k, i) => (
                    <span key={k}>
                      {i > 0 && <span className="keycap-sep"> or </span>}
                      <kbd className="keycap">{k}</kbd>
                    </span>
                  ))}
                </dt>
                <dd>{action}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <div className="settings-group">
        <Switch
          label="Use single-key shortcuts"
          helper="Space and the arrow keys still work in the focused player."
          checked={profile.shortcuts}
          onChange={(shortcuts) => onChange({ ...profile, shortcuts })}
        />
        <Switch
          label="Use shortcuts across this page"
          helper="Typing fields keep their own keys."
          checked={profile.pageWideShortcuts}
          onChange={(pageWideShortcuts) => onChange({ ...profile, pageWideShortcuts })}
        />
      </div>
    </Sheet>
  );
}
