"use client";

import type { FormEvent, ReactNode } from "react";

export interface EntityModalProps {
  readonly title: string;
  readonly onClose: () => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly children: ReactNode;
}

export function EntityModal({ title, onClose, onSubmit, children }: EntityModalProps) {
  return (
    <div className="mkt-modal-overlay visible" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mkt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mkt-modal-handle" />
        <h2>{title}</h2>
        <form onSubmit={onSubmit}>
          {children}
          <div className="mkt-modal-actions">
            <button type="button" className="mkt-btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="mkt-btn-submit">Guardar cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}