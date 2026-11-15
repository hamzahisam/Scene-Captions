"use client";
import { useEffect } from "react";
import type { RefObject } from "react";

// Publishes --fold-h on the watch column: the viewport height from the player's real top edge to the
// bottom of the window, less the credit line under the player. Measured rather than assumed, so the
// study resume banner, zoomed or resized windows and header changes are all included. CSS derives the
// 16:9 player width from it on desktop only (globals.css, B5 block).
export function useFoldHeight(column: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = column.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      const player = el.querySelector<HTMLElement>(".video-frame");
      if (!player) return;
      const documentTop = player.getBoundingClientRect().top + window.scrollY;
      const below = el.querySelector<HTMLElement>(".film-footnote")?.getBoundingClientRect().height ?? 0;
      el.style.setProperty("--fold-h", `${Math.max(0, Math.floor(window.innerHeight - documentTop - below))}px`);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    observer.observe(el);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [column]);
}
