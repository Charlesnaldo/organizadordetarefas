import { NextResponse } from "next/server";
import { mapTaskPayload, mapTaskRecord } from "@/lib/task-mappers";
import { requireUserId } from "@/lib/require-user";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { TaskPayload, TaskRecord } from "@/lib/task-types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId(request);
    const { searchParams } = new URL(request.url);
    const boardId = Number(searchParams.get("boardId"));

    if (!boardId) {
      return NextResponse.json([], { status: 200 });
    }

    const supabase = getSupabaseAdmin();
    const { data: board } = await supabase
      .from("boards")
      .select("id")
      .eq("id", boardId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!board) {
      return NextResponse.json({ error: "Quadro não encontrado." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("board_id", boardId)
      .order("position", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json((data as TaskRecord[]).map(mapTaskRecord));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar tarefas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);
    const payload = (await request.json()) as TaskPayload;
    const supabase = getSupabaseAdmin();

    const { data: board } = await supabase
      .from("boards")
      .select("id")
      .eq("id", payload.boardId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!board) {
      return NextResponse.json({ error: "Quadro não encontrado." }, { status: 404 });
    }

    const { data: lastTask } = await supabase
      .from("tasks")
      .select("position")
      .eq("board_id", payload.boardId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        ...mapTaskPayload(payload),
        position: (lastTask?.position ?? -1) + 1,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(mapTaskRecord(data as TaskRecord), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao criar tarefa." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId(request);
    const body = (await request.json()) as {
      boardId: number;
      tasks: Array<{ id: number; column: string; position: number }>;
    };
    const supabase = getSupabaseAdmin();

    const { data: board } = await supabase
      .from("boards")
      .select("id")
      .eq("id", body.boardId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!board) {
      return NextResponse.json({ error: "Quadro não encontrado." }, { status: 404 });
    }

    for (const task of body.tasks) {
      const { error } = await supabase
        .from("tasks")
        .update({ column_id: task.column, position: task.position })
        .eq("id", task.id)
        .eq("board_id", body.boardId);

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao reordenar tarefas." }, { status: 500 });
  }
}
