"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type SiteItem = { id: string; title: string; url: string; category: string; notes: string };
const emptySite = { title: "", url: "", category: "", notes: "" };

export default function SitesWorkspace({ session }: { session: Session }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptySite);

  useEffect(() => {
    void loadSites();
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

  async function loadSites() {
    setLoading(true);
    try {
      const data = await authFetch<SiteItem[]>("/api/sites");
      setSites(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.url.trim()) return;

    try {
      const newItem = await authFetch<SiteItem>("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSites((current) => [newItem, ...current]);
      setForm(emptySite);
    } catch (err) {
      console.error(err);
    }
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
        {loading ? (
          <div className="col-span-full py-10 text-center text-slate-500">Buscando links...</div>
        ) : sites.map((site) => (
          <article key={site.id} className="glass-panel rounded-[1.2rem] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{site.category || "Sem categoria"}</div>
            <h3 className="mt-3 font-[family:var(--font-space-grotesk)] text-lg font-medium text-slate-900">{site.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{site.notes || "Sem observações."}</p>
            <a href={site.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">Abrir link</a>
          </article>
        ))}
        {!loading && sites.length === 0 ? <div className="glass-panel rounded-[1.2rem] p-6 text-sm text-slate-500 md:col-span-2 xl:col-span-3">Nenhum site salvo ainda.</div> : null}
      </div>
    </section>
  );
}
