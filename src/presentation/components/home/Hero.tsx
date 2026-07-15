export function Hero() {
  return (
    <section className="hero">
      <div className="hero-badge">
        <span className="hero-badge-dot" />
        Diseñado para parejas
      </div>
      <h1 className="text-balance">
        Tu hogar,{" "}
        <span className="gradient-text">organizado juntos</span>
      </h1>
      <p>
        Gestionen las compras del mercado, las tareas del hogar y el
        presupuesto familiar desde un solo lugar. Simple, claro, en
        tiempo&nbsp;real.
      </p>
      <div className="hero-actions">
        <button className="btn-primary btn-lg">Comenzar gratis</button>
        <button className="btn-ghost btn-lg">Ver cómo funciona</button>
      </div>
    </section>
  );
}
