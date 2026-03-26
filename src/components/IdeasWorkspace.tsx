"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

type Idea = { id: string; title: string; category: string; date: string };
const emptyIdea = { title: "", category: "" };

export default function IdeasWorkspace({ session }: { session: Session }) {
  const storageKey = `tudlist.ideas.${session.user.id}`;
  const [ideas, setIdeas] = useState<Idea[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];
    try { return JSON.parse(stored) as Idea[]; } catch { return []; }
  });
  const [form, setForm] = useState(emptyIdea);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(ideas));
  }, [ideas, storageKey]);

  const grouped = useMemo(() => {
    return ideas.reduce<Record<string, Idea[]>>((acc, idea) => {
      acc[idea.category] = [...(acc[idea.category] ?? []), idea];
      return acc;
    }, {} as Record<string, Idea[]>);
  }, [ideas]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return;
    const idea: Idea = { id: crypto.randomUUID(), title: form.title.trim(), category: form.category.trim() || "Geral", date: new Date().toISOString().slice(0, 10) };
    setIdeas((current) => [idea, ...current]);
    setForm(emptyIdea);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[1.4rem] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Ideias</div>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Criação</h2>
        <p className="mt-2 text-sm text-slate-600">Guarde insights, hipóteses e mapeie o próximo experimento.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Ideia
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Torne o pensamento memorável" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
          </label>
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Categoria
            <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Categoria ou referência" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
          </label>
          <button type="submit" className="w-full cursor-pointer rounded-[1rem] border border-slate-300 bg-slate-950 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-slate-400">Salvar ideia</button>
        </form>
      </div>
      <div className="space-y-4">
        {Object.keys(grouped).length ? Object.entries(grouped).map(([category, bucket]) => (
          <div key={category} className="rounded-[1.4rem] border border-slate-200 bg-white/90 p-4">
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{category}</div>
            <div className="mt-3 space-y-3">
              {bucket.map((item) => (
                <article key={item.id} className="rounded-[1rem] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.date}</div>
                </article>
              ))}
            </div>
          </div>
        )) : (
          <div className="rounded-[1.2rem] border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center text-sm text-slate-400">Você ainda não salvou ideias.</div>
        )}
      </div>
    </section>
  );
}

