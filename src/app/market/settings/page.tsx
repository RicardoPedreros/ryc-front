import { SettingsActions } from "@/presentation/components/market/SettingsActions";

export default function SettingsPage() {
  return (
    <>
      <div className="mkt-page-header">
        <div>
          <h1>Ajustes</h1>
          <p>Gestionar productos, tiendas, categorías y unidades</p>
        </div>
      </div>
      <SettingsActions />
    </>
  );
}
