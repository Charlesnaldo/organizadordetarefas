"use client";

import ProtectedAppShell from "@/components/ProtectedAppShell";
import SitesWorkspace from "@/components/SitesWorkspace";

export default function SitesPage() {
  return <ProtectedAppShell title="Sites Úteis" description="Guarde os links que você mais usa em um painel simples e rápido.">{(session) => <SitesWorkspace session={session} />}</ProtectedAppShell>;
}

