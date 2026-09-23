"use client";

import type { ReactNode } from "react";

interface ModalShellProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

export function ModalShell({ open, onClose, children }: ModalShellProps) {
  return (
    <div
      className={`mkt-modal-overlay ${open ? "visible" : ""}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="mkt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mkt-modal-handle" />
        {children}
      </div>
    </div>
  );
}