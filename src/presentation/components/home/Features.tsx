import { Icon } from "@/presentation/components/ui/Icon";

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
  const name = type === "clipboard" ? "list-checks" : type === "flag" ? "layout-grid" : "wallet";
  return <Icon name={name} size={24} />;
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
