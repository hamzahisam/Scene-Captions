"use client";
import { useId, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { useDialogFocus } from "../hooks/use-dialog-focus";
import { Icon } from "../icon";

/**
 * Shared dialog sheet for caption settings and keyboard shortcuts.
 * Focus is trapped and returned to the trigger on close (useDialogFocus).
 */
export function Sheet({
  open,
  close,
  trigger,
  title,
  id,
  closeLabel,
  status,
  children,
  footer,
  className = "",
}: {
  open: boolean;
  close: () => void;
  trigger: RefObject<HTMLButtonElement | null>;
  title: string;
  id?: string;
  closeLabel: string;
  status?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogFocus(open, panel, trigger, close);
  if (!open) return null;
  const dismiss = () => {
    close();
    trigger.current?.focus();
  };
  return (
    <div
      ref={panel}
      id={id}
      className={`sheet ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="sheet__header">
        <h2 id={titleId}>{title}</h2>
        {status}
        <button type="button" className="icon-btn sheet__close" onClick={dismiss} aria-label={closeLabel}>
          <Icon name="close" size={22} />
        </button>
      </div>
      <div className="sheet__body">{children}</div>
      {footer && <div className="sheet__footer">{footer}</div>}
    </div>
  );
}
