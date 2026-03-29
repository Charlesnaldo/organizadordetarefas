"use client";

import ProtectedAppShell from "@/components/ProtectedAppShell";
import VideosWorkspace from "@/components/VideosWorkspace";

export default function CinemaPage() {
  return (
    <ProtectedAppShell 
      title="Cinema" 
      description="Sua videoteca pessoal. Salve links do YouTube para assistir mais tarde ou organizar por categorias, sem sair do seu sistema."
    >
      {(session) => <VideosWorkspace session={session} />}
    </ProtectedAppShell>
  );
}
