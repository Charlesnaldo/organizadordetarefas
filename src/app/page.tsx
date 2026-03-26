"use client";

import ProtectedAppShell from "@/components/ProtectedAppShell";
import LauncherGrid from "@/components/LauncherGrid";

export default function HomePage() {
  return (
    <ProtectedAppShell title="Início" description="Escolha um módulo para abrir seu sistema pessoal. A proposta aqui é funcionar como uma home visual, mais próxima de um launcher elegante no estilo Apple.">
      {() => <LauncherGrid />}
    </ProtectedAppShell>
  );
}

