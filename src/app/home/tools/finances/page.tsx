import { requireSession } from "@/infrastructure/auth/session";
import { Icon } from "@/presentation/components/ui/Icon";

const ADMIN_USERNAME = "admin";

export default async function FinancesPage() {
  const session = await requireSession();
  const isAdmin = session.username === ADMIN_USERNAME;
  const sheetsUrl =
    process.env.FINANCES_SHEETS_URL ??
    "https://docs.google.com/spreadsheets/d/1osoLP4ugNCqfRn2S_ySlMvrFgNQOUgEC/edit?usp=sharing&ouid=107181747303897470022&rtpof=true&sd=true";
  const sheetsUr2 =
    process.env.FINANCES_SHEETS_URL ??
    "https://docs.google.com/spreadsheets/d/1koeJPE8GXrhD3FprCq82jCNLoMeK4Irg/edit?usp=sharing&ouid=107181747303897470022&rtpof=true&sd=true";

  return (
    <>
      <div className="mkt-page-header">
        <div>
          <h1>Finanzas</h1>
          <p>Libro de finanzas del hogar en Google Sheets</p>
        </div>
      </div>
      {isAdmin ? (
        <>
          <a
            href={sheetsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mkt-btn-primary"
          >
            <Icon name="wallet" size={18} />
            Abrir libro de finanzas
          </a>
          <a
            href={sheetsUr2}
            target="_blank"
            rel="noopener noreferrer"
            className="mkt-btn-primary"
          >
            <Icon name="wallet" size={18} />
            Abrir libro de SSPP
          </a>
        </>
      ) : (
        <p className="mkt-section-meta">Solo el usuario admin puede acceder al libro de finanzas.</p>
      )}
    </>
  );
}