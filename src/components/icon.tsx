import type { CSSProperties } from "react";

/* 24px grid, 1.65 stroke, round caps and joins. No Unicode glyphs as chrome icons. */
const paths = {
  play: "m9 5 11 7-11 7Z",
  pause: "M8 5v14M16 5v14",
  volume: "m11 5-6 4H2v6h3l6 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14",
  mute: "m11 5-6 4H2v6h3l6 4ZM17 9l5 6M22 9l-5 6",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  collapse: "M3 8h5V3m8 0v5h5M8 21v-5H3m13 5v-5h5",
  settings: "M4 7h16M4 17h16M9 3v8m6 2v8",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  back: "M19 12H5m5-5-5 5 5 5",
  check: "m5 12 4 4L19 6",
  chevron: "m9 5 7 7-7 7",
  chevronDown: "m6 9 6 6 6-6",
  book: "M12 5C8 2 3 3 2 4v16c4-2 7-2 10 0 3-2 6-2 10 0V4c-3-1-6-2-10 1Zm0 0v15",
  sound: "M3 10v4m4-7v10m5-14v18m5-14v10m4-7v4",
  info: "M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  warning: "M12 3 2 20h20ZM12 10v4m0 3v.1",
  download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
  folder: "M3 7V4h6l2 3h10v13H3Z",
  film: "M3 3h18v18H3ZM7 3v18m10-18v18M3 8h4m-4 8h4M17 8h4m-4 8h4",
  close: "m6 6 12 12M6 18 18 6",
  reset: "M3 10a9 9 0 1 1 2 9M3 3v7h7",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  shield: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6ZM8 12l3 3 5-6",
  captions: "M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM7 15h4m2 0h4M7 11h6m2 0h2",
  previousSound: "M11 7 6 12l5 5M14 10v4m3.5-7v10M21 9.5v5",
  nextSound: "m13 7 5 5-5 5M10 10v4M6.5 7v10M3 9.5v5",
  compare: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 3v18M12 8h3.5M12 12h5M12 16h3.5",
  help: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M9.5 9.2a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6v.5M12 17v.1",
  speed: "M4.5 18a9 9 0 1 1 15 0M12 14l4.5-5",
  keyboard: "M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM7 10h.1M10.5 10h.1M14 10h.1M17 10h.1M8 14h8",
  research: "M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7.5 15h9",
  menu: "M4 7h16M4 12h16M4 17h16",
  record: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z",
  undo: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  top: "M5 4h14M12 20V9m-5 5 5-5 5 5",
  bottom: "M5 20h14M12 4v11m-5-5 5 5 5-5",
};

export type IconName = keyof typeof paths;

export function Icon({
  name,
  size = 20,
  style,
  className,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
