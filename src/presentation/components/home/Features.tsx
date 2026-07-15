interface Feature {
  readonly icon: "clipboard" | "flag" | "sun";
  readonly title: string;
  readonly description: string;
}

const FEATURES: readonly Feature[] = [
  {
    icon: "clipboard",
    title: "Listas compartidas",
    description:
      "Crean y editan la lista del mercado juntos. Los cambios se sincronizan al instante en ambos dispositivos.",
  },
  {
    icon: "flag",
    title: "Por categoría",
    description:
      "Organizada automáticamente por sección del supermercado. Encuentran lo que necesitan en segundos.",
  },
  {
    icon: "sun",
    title: "Presupuesto del hogar",
    description:
      "Lleven un registro claro de los gastos mensuales. Próximamente: categorías, metas y reportes.",
  },
];

function FeatureIcon({ type }: { readonly type: Feature["icon"] }) {
  switch (type) {
    case "clipboard":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      );
    case "flag":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      );
    case "sun":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      );
  }
}

export function Features() {
  return (
    <section id="caracteristicas" className="section-block">
      <div className="container-md">
        <p className="section-label accent">Características</p>
        <h2 className="section-title">Todo lo que necesitan, nada que no</h2>
        <div className="features-grid">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="feature-card">
              <div className="feature-icon">
                <FeatureIcon type={feature.icon} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
