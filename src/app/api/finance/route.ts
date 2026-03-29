import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/require-user";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId(request);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("finance_entries")
      .select("*")
      .eq("user_id", userId)
      .order("inserted_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao carregar financeiro." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);
    const payload = await request.json();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("finance_entries")
      .insert({ ...payload, user_id: userId })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao criar lançamento financeiro." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId(request);
    const { id, ...updates } = await request.json();
    if (!id) throw new Error("ID não informado.");

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("finance_entries")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao atualizar lançamento." }, { status: 500 });
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
      .from("finance_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao deletar lançamento." }, { status: 500 });
  }
}
