import { NextResponse } from "next/server";
import { mapBoardPayload, mapBoardRecord } from "@/lib/task-mappers";
import { requireUserId } from "@/lib/require-user";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { BoardPayload, BoardRecord } from "@/lib/task-types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId(request);
    const supabase = getSupabaseAdmin();

    const { data: initialData, error } = await supabase
      .from("boards")
      .select("*")
      .eq("user_id", userId)
      .order("inserted_at", { ascending: true });

    if (error) {
      throw error;
    }

    let data = initialData;

    if (!data || data.length === 0) {
      const created = await supabase
        .from("boards")
        .insert({
          user_id: userId,
          name: "Meu Primeiro Board",
          description: "Quadro criado automaticamente no primeiro acesso.",
        })
        .select("*")
        .single();

      if (created.error) {
        throw created.error;
      }

      data = [created.data as BoardRecord];
    }

    return NextResponse.json((data as BoardRecord[]).map(mapBoardRecord));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar quadros." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);
    const payload = (await request.json()) as BoardPayload;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("boards")
      .insert({ ...mapBoardPayload(payload), user_id: userId })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(mapBoardRecord(data as BoardRecord), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao criar quadro." }, { status: 500 });
  }
}
