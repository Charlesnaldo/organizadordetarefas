"use client";

import ProtectedAppShell from "@/components/ProtectedAppShell";
import ObjectivesWorkspace from "@/components/ObjectivesWorkspace";

export default function ObjetivosPage() {
  return (
    <ProtectedAppShell title="Objetivos" description="Desenhe metas chave, acompanhe o progresso e mantenha um horizonte claro para o próximo período.">
      {(session) => <ObjectivesWorkspace session={session} />}
    </ProtectedAppShell>
  );
}
