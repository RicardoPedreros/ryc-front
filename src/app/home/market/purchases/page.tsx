"use client";

import { useState } from "react";
import { PurchasesActions } from "@/presentation/components/market/PurchasesActions";
import { PurchaseHistory } from "@/presentation/components/market/PurchaseHistory";

export default function PurchasesPage() {
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <>
      <div className="mkt-page-header">
        <div>
          <h1>Compras</h1>
          <p>Historial, lista de compras y registro de nuevas compras</p>
        </div>
      </div>
      <PurchasesActions onRecorded={() => setRefreshSignal((s) => s + 1)} />
      <PurchaseHistory refreshSignal={refreshSignal} />
    </>
  );
}