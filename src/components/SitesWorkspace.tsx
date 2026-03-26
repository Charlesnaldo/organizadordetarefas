"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

type SiteItem = { id: string; title: string; url: string; category: string; notes: string };
const emptySite = { title: "", url: "", category: "", notes: "" };

export default function SitesWorkspace({ session }: { session: Session }) {
  const storageKey = `tudlist.sites.${session.user.id}`;
  const [sites, setSites] = useState<SiteItem[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];
    try { return JSON.parse(stored) as SiteItem[]; } catch { return []; }
  });
  const [form, setForm] = useState(emptySite);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(sites));
  }, [sites, storageKey]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.url.trim()) return;
    setSites((current) => [{ id: crypto.randomUUID(), ...form }, ...current]);
    setForm(emptySite);
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="glass-panel rounded-[1.4rem] p-4 sm:p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Coleção</div>
        <h2 className="mt-3 font-[family:var(--font-space-grotesk)] text-2xl font-medium text-slate-900">Sites úteis</h2>
        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Nome do site" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
          <input value={form.url} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://..." className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
          <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Categoria" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
          <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Observacao curta" rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
          <button type="submit" className="w-full cursor-pointer rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Salvar site</button>
        </form>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sites.map((site) => (
          <article key={site.id} className="glass-panel rounded-[1.2rem] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{site.category || "Sem categoria"}</div>
            <h3 className="mt-3 font-[family:var(--font-space-grotesk)] text-lg font-medium text-slate-900">{site.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{site.notes || "Sem observações."}</p>
            <a href={site.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">Abrir link</a>
          </article>
        ))}
        {sites.length === 0 ? <div className="glass-panel rounded-[1.2rem] p-6 text-sm text-slate-500 md:col-span-2 xl:col-span-3">Nenhum site salvo ainda.</div> : null}
      </div>
    </section>
  );
}


