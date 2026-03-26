"use client";

import ProtectedAppShell from "@/components/ProtectedAppShell";
import StudiesWorkspace from "@/components/StudiesWorkspace";

export default function EstudosPage() {
  return <ProtectedAppShell title="Estudos" description="Organize matérias, tópicos e revisões em um painel dedicado.">{(session) => <StudiesWorkspace session={session} />}</ProtectedAppShell>;
}

