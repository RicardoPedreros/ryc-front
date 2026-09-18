"use client";

import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/presentation/components/ui/Icon";
import type { IconName } from "@/presentation/components/ui/Icon";

export interface EntityRowProps {
  readonly icon: IconName;
  readonly iconStyle: CSSProperties;
  readonly name: string;
  readonly meta?: ReactNode;
  readonly badge?: ReactNode;
  readonly onOpen: () => void;
  readonly style?: CSSProperties;
}

export function EntityRow({ icon, iconStyle, name, meta, badge, onOpen, style }: EntityRowProps) {
  return (
    <div
      className="mkt-entity-item"
      style={style}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
    >
      <div className="mkt-entity-icon" style={iconStyle}>
        <Icon name={icon} size={18} />
      </div>
      <div className="mkt-entity-body">
        <span className="mkt-entity-name">{name}</span>
        {meta && <span className="mkt-entity-meta">{meta}</span>}
      </div>
      {badge}
    </div>
  );
}