"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { 
  Play, 
  Plus, 
  Search, 
  Trash2, 
  X
} from "lucide-react";
import AppIcon from "./AppIcon";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type VideoItem = {
  id: string;
  title: string;
  url: string;
  category: string;
  inserted_at: string;
};

export default function VideosWorkspace({ session }: { session: Session }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    url: "",
    category: "Geral",
  });

  useEffect(() => {
    void loadVideos();
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

  async function loadVideos() {
    setLoading(true);
    try {
      const data = await authFetch<VideoItem[]>("/api/videos");
      setVideos(data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar galeria.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.url.trim()) return;
    setIsSaving(true);

    try {
      const newItem = await authFetch<VideoItem>("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      setVideos([newItem, ...videos]);
      setForm({ title: "", url: "", category: "Geral" });
      toast.success("Vídeo adicionado!");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao salvar vídeo.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remover este vídeo da coleção?")) return;
    try {
      await authFetch(`/api/videos?id=${id}`, { method: "DELETE" });
      setVideos(videos.filter(v => v.id !== id));
      toast.success("Vídeo removido.");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao excluir.");
    }
  }

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getThumbnail = (url: string) => {
    const id = getYoutubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  };

  const filteredVideos = useMemo(() => {
    return videos.filter(v => 
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [videos, searchTerm]);

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      {/* Sidebar de Cadastro */}
      <aside>
        <div className="glass-panel sticky top-6 rounded-[2.5rem] border border-white/40 bg-white p-8 shadow-sm">
          <header className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AppIcon name="video" className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Entretenimento</div>
              <h2 className="text-2xl font-bold text-slate-900">Novo Vídeo</h2>
            </div>
          </header>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Título do Vídeo</label>
              <input 
                required
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Ex: Aula de Next.js"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Link do YouTube</label>
              <input 
                required
                value={form.url}
                onChange={e => setForm({...form, url: e.target.value})}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Categoria</label>
              <input 
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                placeholder="Ex: Estudos, Música..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:bg-white transition-all"
              />
            </div>

            <button 
              disabled={isSaving}
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white hover:bg-rose-600 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-black/10"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              {isSaving ? "Salvando..." : "Salvar na Galeria"}
            </button>
          </form>
        </div>
      </aside>

      {/* Grid de Vídeos */}
      <main className="space-y-6">
        <header className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar vídeo ou categoria..."
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
          </div>
        </header>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-video rounded-[2rem] bg-slate-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map(video => {
              const thumb = getThumbnail(video.url);
              return (
                <article 
                  key={video.id} 
                  className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-white/40 bg-white shadow-sm hover:shadow-2xl hover:border-rose-200 transition-all duration-500"
                >
                  {/* Miniatura com Overlay de Play */}
                  <div className="relative aspect-video overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt={video.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                        <AppIcon name="video" className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <button 
                        onClick={() => setActiveVideoUrl(video.url)}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-rose-600 border border-white/30"
                      >
                        <Play className="h-6 w-6 fill-current" />
                      </button>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="rounded-full bg-black/50 backdrop-blur-md px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white border border-white/10">
                        {video.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-md font-bold text-slate-900 leading-tight line-clamp-2">{video.title}</h3>
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {new Date(video.inserted_at).toLocaleDateString("pt-BR")}
                      </div>
                      <button 
                        onClick={() => void handleDelete(video.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredVideos.length === 0 && (
              <div className="col-span-full py-24 flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50/30">
                <div className="p-6 rounded-full bg-white shadow-sm text-slate-200">
                  <AppIcon name="video" className="h-16 w-16" />
                </div>
                <p className="mt-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Sua galeria está vazia</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal do Player (Apple Style) */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={() => setActiveVideoUrl(null)} />
          <div className="relative w-full max-w-5xl aspect-video overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setActiveVideoUrl(null)}
              className="absolute top-6 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-rose-600 transition-all border border-white/10"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe 
              src={`https://www.youtube.com/embed/${getYoutubeId(activeVideoUrl)}?autoplay=1`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
