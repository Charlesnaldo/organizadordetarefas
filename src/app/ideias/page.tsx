"use client";

import ProtectedAppShell from "@/components/ProtectedAppShell";
import IdeasWorkspace from "@/components/IdeasWorkspace";

export default function IdeiasPage() {
  return (
    <ProtectedAppShell title="Ideias" description="Capture insights e experimente combinações até encontrar o próximo movimento perfeito.">
      {(session) => <IdeasWorkspace session={session} />}
    </ProtectedAppShell>
  );
}
