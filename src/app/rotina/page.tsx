"use client";

import ProtectedAppShell from "@/components/ProtectedAppShell";
import RotinaWorkspace from "@/components/RotinaWorkspace";

export default function RotinaPage() {
  return <ProtectedAppShell title="Rotina" description="Quadros Kanban para organizar tarefas, fluxo e entregas do dia.">{(session) => <RotinaWorkspace session={session} />}</ProtectedAppShell>;
}

