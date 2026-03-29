"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type ReviewItem = { id: string; resource: string; subject: string; cadence: string; last_review: string };

const emptyReview = { resource: "", subject: "", cadence: "Semanal" };

export default function ReviewsWorkspace({ session }: { session: Session }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyReview);

  useEffect(() => {
    void loadReviews();
  }, [supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  async function authFetch<T>(input: string, init?: RequestInit): Promise<T> {
    if (!supabase) throw new Error("Supabase não configurado.");
    const activeSession = session ?? (await supabase.auth.getSession()).data.session;
    if (!activeSession?.access_token) throw new Error("Sessão expirada.");

    const response = await fetch(input, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${activeSession.access_token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Falha na requisição.");
    return data as T;
  }

  async function loadReviews() {
    setLoading(true);
    try {
      const data = await authFetch<ReviewItem[]>("/api/reviews");
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const nextReviewDate = useMemo(() => {
    if (!items.length) return "Ainda não há revisões";
    return items[0].last_review ? formatDateLabel(items[0].last_review) : "Pendente";
  }, [items]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.resource.trim()) return;
    const nextDate = new Date().toISOString().slice(0, 10);
    
    try {
      const newItem = await authFetch<ReviewItem>("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resource: form.resource.trim(), 
          subject: form.subject.trim() || "Geral", 
          cadence: form.cadence, 
          last_review: nextDate 
        }),
      });
      setItems((current) => [newItem, ...current]);
      setForm(emptyReview);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[1.4rem] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Revisões</div>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Rotinas</h2>
        <p className="mt-2 text-sm text-slate-600">Defina o ritmo e mantenha o conteúdo que precisa ser revisitado com frequência.</p>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Próxima revisão</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{nextReviewDate}</div>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Material
            <input value={form.resource} onChange={(event) => setForm((current) => ({ ...current, resource: event.target.value }))} placeholder="O que revisitar" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
          </label>
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Matéria
            <input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Tema principal" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
          </label>
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Cadência
            <select value={form.cadence} onChange={(event) => setForm((current) => ({ ...current, cadence: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              <option value="Semanal">Semanal</option>
              <option value="Quinzenal">Quinzenal</option>
              <option value="Mensal">Mensal</option>
            </select>
          </label>
          <button type="submit" className="w-full cursor-pointer rounded-[1rem] border border-slate-300 bg-slate-950 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-slate-400">Registrar revisão</button>
        </form>
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-500">Carregando rotinas...</div>
        ) : items.length ? items.map((item) => (
          <div key={item.id} className="rounded-[1.3rem] border border-slate-200 bg-white/90 p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
              <span>{item.cadence}</span>
              <span>Última: {item.last_review ? formatDateLabel(item.last_review) : "Nunca"}</span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.resource}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.subject}</p>
          </div>
        )) : (
          <div className="rounded-[1.2rem] border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center text-sm text-slate-400">Nenhuma rotina de revisão definida.</div>
        )}
      </div>
    </section>
  );
}

function formatDateLabel(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}
