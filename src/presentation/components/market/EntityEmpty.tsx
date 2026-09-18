export interface EntityEmptyProps {
  readonly title: string;
  readonly subtitle?: string;
}

export function EntityEmpty({ title, subtitle }: EntityEmptyProps) {
  return (
    <div className="mkt-empty-state">
      <p>{title}</p>
      {subtitle && <p className="mkt-empty-sub">{subtitle}</p>}
    </div>
  );
}