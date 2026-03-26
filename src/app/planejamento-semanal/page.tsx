"use client";

import ProtectedAppShell from "@/components/ProtectedAppShell";
import WeeklyPlanWorkspace from "@/components/WeeklyPlanWorkspace";

export default function PlanejamentoSemanalPage() {
  return (
    <ProtectedAppShell title="Planejamento semanal" description="Distribua prioridades e mantenha o foco nas próximas entregas e compromissos.">
      {(session) => <WeeklyPlanWorkspace session={session} />}
    </ProtectedAppShell>
  );
}
