"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import AppIcon from "./AppIcon";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Idea = { id: string; title: string; category: string; inserted_at: string };
const emptyIdea = { title: "", category: "" };

export default function IdeasWorkspace({ session }: { session: Session }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyIdea);

  useEffect(() => {
    void loadIdeas();
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

  async function loadIdeas() {
    setLoading(true);
    try {
      const data = await authFetch<Idea[]>("/api/ideas");
      setIdeas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    return ideas.reduce<Record<string, Idea[]>>((acc, idea) => {
      const cat = idea.category?.trim() || "Geral";
      acc[cat] = [...(acc[cat] ?? []), idea];
      return acc;
    }, {});
  }, [ideas]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;

    try {
      const newItem = await authFetch<Idea>("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category.trim() || "Geral",
        }),
      });

      setIdeas((current) => [newItem, ...current]);
      setForm(emptyIdea);
      toast.success("Ideia capturada!");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao capturar ideia.");
    }
  }

  async function deleteIdea(id: string) {
    if (!window.confirm("Apagar esta ideia?")) return;
    try {
      await authFetch(`/api/ideas?id=${id}`, { method: "DELETE" });
      setIdeas(prev => prev.filter(i => i.id !== id));
      toast.success("Ideia removida.");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao remover ideia.");
    }
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <aside>
        <div className="sticky top-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <header className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <AppIcon name="lightbulb" className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Brainstorm</div>
              <h2 className="text-2xl font-bold text-slate-900">Novas Ideias</h2>
            </div>
          </header>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">O que você pensou?</label>
              <textarea
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Descreva seu insight..."
                className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-slate-950 focus:bg-white resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Onde isso se encaixa?</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <AppIcon name="bookmark" className="h-4 w-4" />
                </div>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex: Trabalho, Viagem..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-slate-950 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
            >
              <AppIcon name="plus" className="h-4 w-4 transition-transform group-hover:rotate-90" />
              Capturar Ideia
            </button>
          </form>
        </div>
      </aside>

      <main className="space-y-8">
        {loading ? (
          <div className="py-20 text-center text-slate-500">Buscando insights...</div>
        ) : Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <div className="mb-4 flex items-center gap-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">{category}</h3>
                <div className="h-px flex-1 bg-slate-100" />
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                  {items.length}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="group relative flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-amber-200 hover:shadow-md"
                  >
                    <div>
                      <div className="flex justify-between gap-2">
                        <p className="text-sm leading-relaxed font-medium text-slate-800">{item.title}</p>
                        <button 
                          onClick={() => void deleteIdea(item.id)}
                          className="opacity-0 transition-opacity group-hover:opacity-100 text-slate-300 hover:text-rose-500"
                        >
                          <AppIcon name="trash" className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <footer className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                        <AppIcon name="calendar" className="h-3 w-3" />
                        {new Date(item.inserted_at).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500">
                        #{category.toLowerCase()}
                      </div>
                    </footer>
                  </article>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-slate-50/30 py-20">
            <div className="rounded-full bg-white p-4 shadow-sm text-slate-300">
              <AppIcon name="lightbulb" className="h-10 w-10" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-400">Nenhum insight capturado ainda.</p>
          </div>
        )}
      </main>
    </section>
  );
}
