import { NextResponse } from "next/server";
import { mapBoardPayload, mapBoardRecord } from "@/lib/task-mappers";
import { requireUserId } from "@/lib/require-user";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { BoardPayload, BoardRecord } from "@/lib/task-types";

export const runtime = "nodejs";

// Helper para centralizar respostas de erro
const errorResponse = (message: string, status = 500) => 
  NextResponse.json({ error: message }, { status });

export async function GET(request: Request) {
  try {
    const userId = await requireUserId(request);
    const supabase = getSupabaseAdmin();

    const { data: boards, error } = await supabase
      .from("boards")
      .select("*")
      .eq("user_id", userId)
      .order("inserted_at", { ascending: true });

    if (error) throw error;

    // Se existirem quadros, retorna mapeado
    if (boards && boards.length > 0) {
      return NextResponse.json(boards.map(mapBoardRecord));
    }

    // Criação do quadro inicial caso não exista nenhum
    const { data: newBoard, error: createError } = await supabase
      .from("boards")
      .insert({
        user_id: userId,
        name: "Meu Primeiro Board",
        description: "Quadro criado automaticamente no primeiro acesso.",
      })
      .select("*")
      .single();

    if (createError) throw createError;

    return NextResponse.json([mapBoardRecord(newBoard as BoardRecord)]);
  } catch (error) {
    console.error("[BOARDS_GET]", error);
    return errorResponse(error instanceof Error ? error.message : "Falha ao carregar quadros.");
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);
    const body = await request.json();
    
    // Validação simples de payload
    if (!body.name) {
      return errorResponse("O nome do quadro é obrigatório.", 400);
    }

    const payload = body as BoardPayload;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("boards")
      .insert({ 
        ...mapBoardPayload(payload), 
        user_id: userId 
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json(mapBoardRecord(data as BoardRecord), { status: 201 });
  } catch (error) {
    console.error("[BOARDS_POST]", error);
    return errorResponse(error instanceof Error ? error.message : "Falha ao criar quadro.");
  }
}