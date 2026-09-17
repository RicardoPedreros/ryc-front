import { AssistantChat } from "@/presentation/components/market/AssistantChat";

export default function AssistantPage() {
  return (
    <>
      <div className="mkt-page-header">
        <div>
          <h1>Asistente</h1>
          <p>
            Recetas armadas con lo que ya tenés en el inventario.
            <span className="asst-status-pill">
              <span className="asst-dot" />
              conectado al inventario
            </span>
          </p>
        </div>
      </div>
      <AssistantChat />
    </>
  );
}
