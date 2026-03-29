import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/require-user";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId(request);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("study_items")
      .select("*")
      .eq("user_id", userId)
      .order("inserted_at", { ascending: false });

    if (error) {
      console.error("Erro Supabase (GET studies):", error);
      throw error;
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar estudos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);
    const payload = await request.json();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("study_items")
      .insert({ 
        ...payload, 
        user_id: userId,
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (error) {
      console.error("Erro Supabase (POST studies):", error);
      throw error;
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao criar item de estudo." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId(request);
    const { id, ...updates } = await request.json();
    if (!id) throw new Error("ID não informado.");

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("study_items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao atualizar estudo." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await requireUserId(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) throw new Error("ID não informado.");

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("study_items")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao deletar estudo." }, { status: 500 });
  }
}
