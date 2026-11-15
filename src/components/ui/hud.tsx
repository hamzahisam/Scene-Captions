"use client";
import { useEffect, useState } from "react";

/**
 * Transient on-video confirmation for keyboard and quick changes
 * ("Detail: Rich"). Visual twin of the existing live regions, so it is
 * aria-hidden. Never shows caption text. Sits near the top of the picture,
 * away from the bottom caption area.
 */
export function Hud({ message, nonce }: { message: string; nonce: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!nonce || !message) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(t);
  }, [message, nonce]);
  if (!message) return null;
  return (
    <div className="hud" data-visible={visible} aria-hidden="true">
      {message}
    </div>
  );
}
