"use client";

import ProtectedAppShell from "@/components/ProtectedAppShell";
import WishlistWorkspace from "@/components/WishlistWorkspace";

export default function DesejosPage() {
  return <ProtectedAppShell title="Desejos" description="Sua wishlist financeira com foto, metas e reordenação visual.">{(session) => <WishlistWorkspace session={session} />}</ProtectedAppShell>;
}

