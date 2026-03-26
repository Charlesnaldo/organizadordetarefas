import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function requireUserId(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.replace("Bearer ", "").trim();

  if (!token) {
    throw new Error("Nao autenticado.");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("Sessao invalida.");
  }

  return data.user.id;
}
