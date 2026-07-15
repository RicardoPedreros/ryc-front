interface Step {
  readonly number: string;
  readonly title: string;
  readonly description: string;
}

const STEPS: readonly Step[] = [
  {
    number: "01",
    title: "Crean su hogar",
    description:
      "Se registran, crean un hogar y comparten el código con su pareja. Listo.",
  },
  {
    number: "02",
    title: "Organizan juntos",
    description:
      "Agregan productos, categorías y tareas. Todo se actualiza en tiempo real para ambos.",
  },
  {
    number: "03",
    title: "Viven tranquilos",
    description:
      "Saben exactamente qué falta, qué cuesta y qué necesita atención. Sin sorpresas.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="section-block">
      <div className="container-md">
        <p className="section-label secondary">Cómo funciona</p>
        <h2 className="section-title">Tres pasos, sin fricción</h2>
        <div className="steps-grid">
          {STEPS.map((step) => (
            <div key={step.number}>
              <span className="step-number">{step.number}</span>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
