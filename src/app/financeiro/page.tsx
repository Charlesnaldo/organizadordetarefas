"use client";

import ProtectedAppShell from "@/components/ProtectedAppShell";
import FinanceWorkspace from "@/components/FinanceWorkspace";

export default function FinanceiroPage() {
  return <ProtectedAppShell title="Financeiro" description="Controle financeiro mais detalhado, com entradas, saídas, investimentos e metas financeiras.">{(session) => <FinanceWorkspace session={session} />}</ProtectedAppShell>;
}

