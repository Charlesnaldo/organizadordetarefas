"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

type StudyStatus = "Planejar" | "Estudando" | "Revisar" | "Concluído";
type StudyItem = { id: string; title: string; subject: string; deadline: string; notes: string; status: StudyStatus };
const statuses: StudyStatus[] = ["Planejar", "Estudando", "Revisar", "Concluído"];
const emptyStudy = { title: "", subject: "", deadline: "", notes: "", status: "Planejar" as StudyStatus };

const statusPalette: Record<StudyStatus, string> = {
  Planejar: "#f59e0b",
  Estudando: "#06b6d4",
  Revisar: "#a855f7",
  "Concluído": "#10b981",
};

export default function StudiesWorkspace({ session }: { session: Session }) {
  const storageKey = `tudlist.studies.${session.user.id}`;
  const [items, setItems] = useState<StudyItem[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];
    try { return JSON.parse(stored) as StudyItem[]; } catch { return []; }
  });
  const [form, setForm] = useState(emptyStudy);

  const statusCounts = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status] = items.filter((item) => item.status === status).length;
      return acc;
    }, {} as Record<StudyStatus, number>);
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.subject.trim()) return;
    setItems((current) => [{ id: crypto.randomUUID(), ...form }, ...current]);
    setForm(emptyStudy);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.75fr_1.1fr]">
      <div className="rounded-[1.6rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white/80 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Biblioteca</div>
        <h2 className="mt-3 font-[family:var(--font-space-grotesk)] text-3xl font-semibold text-slate-900">Estudos</h2>
        <p className="mt-2 text-sm text-slate-600">Organize matérias e capítulos como se fossem prateleiras de uma biblioteca minimalista.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {statuses.map((status) => (
            <div key={status} className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{status}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{statusCounts[status] ?? 0}</p>
            </div>
          ))}
        </div>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <FormField label="Tópico" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} placeholder="Digite o capítulo" />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Matéria" value={form.subject} onChange={(value) => setForm((current) => ({ ...current, subject: value }))} placeholder="Ex: História" />
            <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Prazo
              <input type="date" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} className="w-full border-b border-slate-300 bg-transparent pb-1 text-sm text-slate-900 outline-none" />
            </label>
          </div>
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Status
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as StudyStatus }))} className="w-full border-b border-slate-300 bg-transparent pb-1 text-sm text-slate-900 outline-none">
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Observações
            <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} placeholder="Notas do capítulo" className="w-full border-b border-slate-300 bg-transparent pb-1 text-sm text-slate-900 outline-none" />
          </label>
          <button type="submit" className="w-full cursor-pointer rounded-[1rem] border border-slate-300 bg-white/90 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-700 transition hover:border-slate-400">Registrar</button>
        </form>
      </div>
      <div className="space-y-4">
        {statuses.map((status) => {
          const shelfItems = items.filter((item) => item.status === status);
          return (
            <div key={status} className="rounded-[1.4rem] border border-slate-200 bg-white/90 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: statusPalette[status] }} />
                  <span>{status}</span>
                </div>
                <span className="text-xs text-slate-400">{shelfItems.length} itens</span>
              </div>
              <div className="mt-4 space-y-3">
                {shelfItems.length ? shelfItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 border-b border-slate-200/70 pb-3 last:border-b-0 last:pb-0">
                    <div className="h-10 w-1.5 rounded-full" style={{ backgroundColor: statusPalette[status] }} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{item.subject}</div>
                      {item.deadline ? <p className="text-xs text-slate-500">Prazo {formatDateLabel(item.deadline)}</p> : null}
                      {item.notes ? <p className="mt-1 text-sm text-slate-500">{item.notes}</p> : null}
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-slate-400">Sem itens nesta estante.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FormField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full border-b border-slate-300 bg-transparent pb-1 text-sm text-slate-900 outline-none" />
    </label>
  );
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}
