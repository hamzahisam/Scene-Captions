"use client";
import { useEffect } from "react";

/** Short-lived status with one action, e.g. "Appearance reset. Undo". */
export function Toast({
  message,
  actionLabel,
  onAction,
  onDismiss,
  duration = 6000,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration, message]);
  return (
    <div className="toast" role="status">
      <span>{message}</span>
      {actionLabel && onAction && (
        <button type="button" className="btn btn--ghost btn--small" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
