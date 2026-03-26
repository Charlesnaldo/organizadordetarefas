import { NextResponse } from "next/server";
import { mapTaskPayload, mapTaskRecord } from "@/lib/task-mappers";
import { requireUserId } from "@/lib/require-user";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { TaskPayload, TaskRecord } from "@/lib/task-types";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const userId = await requireUserId(request);
    const { id } = await context.params;
    const payload = (await request.json()) as TaskPayload;
    const supabase = getSupabaseAdmin();

    const { data: board } = await supabase
      .from("boards")
      .select("id")
      .eq("id", payload.boardId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!board) {
      return NextResponse.json({ error: "Quadro nao encontrado." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(mapTaskPayload(payload))
      .eq("id", Number(id))
      .eq("board_id", payload.boardId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(mapTaskRecord(data as TaskRecord));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao atualizar tarefa." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const userId = await requireUserId(request);
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();

    const { data: task } = await supabase
      .from("tasks")
      .select("board_id")
      .eq("id", Number(id))
      .maybeSingle();

    if (!task) {
      return NextResponse.json({ error: "Tarefa nao encontrada." }, { status: 404 });
    }

    const { data: board } = await supabase
      .from("boards")
      .select("id")
      .eq("id", task.board_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!board) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const { error } = await supabase.from("tasks").delete().eq("id", Number(id));
    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao apagar tarefa." }, { status: 500 });
  }
}
