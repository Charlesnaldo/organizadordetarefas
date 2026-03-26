"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

type Objective = { id: string; title: string; focus: string; progress: number };

const emptyForm = { title: "", focus: "", progress: "25" };

export default function ObjectivesWorkspace({ session }: { session: Session }) {
  const storageKey = `tudlist.objectives.${session.user.id}`;
  const [items, setItems] = useState<Objective[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];
    try { return JSON.parse(stored) as Objective[]; } catch { return []; }
  });
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const completion = useMemo(() => {
    if (!items.length) return 0;
    const total = items.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(total / items.length);
  }, [items]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return;
    const progressValue = Math.min(100, Math.max(0, Number(form.progress.replace(/[^0-9]/g, ""))));
    setItems((current) => [{ id: crypto.randomUUID(), title: form.title.trim(), focus: form.focus.trim(), progress: progressValue }, ...current]);
    setForm(emptyForm);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-[1.6rem] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Objetivos</div>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Horizonte</h2>
        <p className="mt-2 text-sm text-slate-600">Acompanhe as principais metas estratégicas com foco e números claros.</p>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Conclusão geral</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="text-3xl font-semibold text-slate-900">{completion}%</div>
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Objetivo
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Defina o foco" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
          </label>
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Foco
            <input value={form.focus} onChange={(event) => setForm((current) => ({ ...current, focus: event.target.value }))} placeholder="Por que isso importa" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
          </label>
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Progresso (%)
            <input type="number" min={0} max={100} value={form.progress} onChange={(event) => setForm((current) => ({ ...current, progress: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
          </label>
          <button type="submit" className="w-full cursor-pointer rounded-[1rem] border border-slate-300 bg-slate-950 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-slate-400">Registrar objetivo</button>
        </form>
      </div>
      <div className="space-y-4">
        {items.length ? items.map((objective) => (
          <article key={objective.id} className="rounded-[1.2rem] border border-slate-200 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
              <span>{objective.focus || "Impacto"}</span>
              <span>{objective.progress}%</span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">{objective.title}</h3>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500" style={{ width: `${objective.progress}%` }} />
            </div>
          </article>
        )) : (
          <div className="rounded-[1.2rem] border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">Nenhum objetivo cadastrado ainda.</div>
        )}
      </div>
    </section>
  );
}
