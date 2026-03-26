"use client";

import ProtectedAppShell from "@/components/ProtectedAppShell";
import ReviewsWorkspace from "@/components/ReviewsWorkspace";

export default function RevisoesPage() {
  return (
    <ProtectedAppShell title="Revisões" description="Padronize o ritmo de revisões e facilite a revisão constante de hábitos e tópicos.">
      {(session) => <ReviewsWorkspace session={session} />}
    </ProtectedAppShell>
  );
}
