"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const;
type Day = (typeof days)[number];

type PlanEntry = { id: string; day: Day; task: string; energy: "Alta" | "Média" | "Leve"; completed: boolean };

const emptyForm = { day: "Segunda" as Day, task: "", energy: "Alta" as PlanEntry["energy"] };

export default function WeeklyPlanWorkspace({ session }: { session: Session }) {
  const storageKey = `tudlist.weekly.${session.user.id}`;
  const [entries, setEntries] = useState<PlanEntry[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];
    try { return JSON.parse(stored) as PlanEntry[]; } catch { return []; }
  });
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries, storageKey]);

  const grouped = useMemo(() => {
    return days.reduce<Record<Day, PlanEntry[]>>((acc, day) => {
      acc[day] = entries.filter((entry) => entry.day === day);
      return acc;
    }, {} as Record<Day, PlanEntry[]>);
  }, [entries]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.task.trim()) return;
    setEntries((current) => [{ id: crypto.randomUUID(), day: form.day, task: form.task.trim(), energy: form.energy, completed: false }, ...current]);
    setForm(emptyForm);
  }

  function toggle(id: string) {
    setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, completed: !entry.completed } : entry));
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[1.4rem] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Planejamento</div>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Semanal</h2>
        <p className="mt-2 text-sm text-slate-600">Organize as próximas trocas e mantenha o foco nas tarefas que importam.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Dia
            <select value={form.day} onChange={(event) => setForm((current) => ({ ...current, day: event.target.value as Day }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              {days.map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Tarefa
            <input value={form.task} onChange={(event) => setForm((current) => ({ ...current, task: event.target.value }))} placeholder="Descreva a prioridade" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
          </label>
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Energia
            <select value={form.energy} onChange={(event) => setForm((current) => ({ ...current, energy: event.target.value as PlanEntry["energy"] }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              {"Alta" as const}
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Leve">Leve</option>
            </select>
          </label>
          <button type="submit" className="w-full cursor-pointer rounded-[1rem] border border-slate-300 bg-slate-950 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-slate-400">Adicionar tarefa</button>
        </form>
      </div>
      <div className="space-y-4">
        {days.map((day) => {
          const bucket = grouped[day];
          return (
            <div key={day} className="rounded-[1.4rem] border border-slate-200 bg-white/90 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                <span>{day}</span>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{bucket.length} itens</span>
              </div>
              <div className="mt-4 space-y-3">
                {bucket.length ? bucket.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <label className="flex-1 cursor-pointer rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 hover:border-slate-300">
                      <input type="checkbox" checked={entry.completed} onChange={() => toggle(entry.id)} className="mr-2 scale-90" />
                      <strong className="font-semibold text-slate-900">{entry.task}</strong>
                      <span className="mt-1 block text-xs uppercase tracking-[0.3em] text-slate-400">Energia {entry.energy}</span>
                    </label>
                  </div>
                )) : (
                  <div className="text-sm text-slate-400">Sem registros para este dia.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

