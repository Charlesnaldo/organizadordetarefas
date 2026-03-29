"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { 
  BookOpen, 
  FileText, 
  Image as ImageIcon, 
  Paperclip, 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink,
  Calendar,
  Clock
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type StudyStatus = "Planejar" | "Estudando" | "Revisar" | "Concluído";

type StudyItem = { 
  id: string; 
  title: string; 
  subject: string; 
  deadline: string; 
  notes: string; 
  content: string; // Resumo detalhado
  attachment_name?: string;
  attachment_url?: string;
  status: StudyStatus;
  inserted_at: string;
};

const statuses: StudyStatus[] = ["Planejar", "Estudando", "Revisar", "Concluído"];

const statusPalette: Record<StudyStatus, { color: string; bg: string; border: string }> = {
  Planejar: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" },
  Estudando: { color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-100" },
  Revisar: { color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-100" },
  Concluído: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
};

export default function StudiesWorkspace({ session }: { session: Session }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<StudyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    deadline: "",
    notes: "",
    content: "",
    status: "Planejar" as StudyStatus,
  });

  useEffect(() => {
    void loadStudies();
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

  async function loadStudies() {
    setLoading(true);
    try {
      const data = await authFetch<StudyItem[]>("/api/studies");
      setItems(data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar estante.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(file: File) {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/uploads", { method: "POST", body });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Falha no upload.");
    return data as { name: string; url: string };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setIsSaving(true);

    try {
      let attachment_name = undefined;
      let attachment_url = undefined;

      if (selectedFile) {
        const upload = await uploadFile(selectedFile);
        attachment_name = upload.name;
        attachment_url = upload.url;
      }

      const newItem = await authFetch<StudyItem>("/api/studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, attachment_name, attachment_url }),
      });

      setItems([newItem, ...items]);
      setForm({ title: "", subject: "", deadline: "", notes: "", content: "", status: "Planejar" });
      setSelectedFile(null);
      toast.success("Estudo registrado!");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao salvar.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remover este item da estante?")) return;
    try {
      await authFetch(`/api/studies?id=${id}`, { method: "DELETE" });
      setItems(items.filter(i => i.id !== id));
      toast.success("Item removido.");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao excluir.");
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  return (
    <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
      {/* Sidebar de Cadastro */}
      <aside className="space-y-6">
        <div className="glass-panel rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Biblioteca</div>
              <h2 className="text-2xl font-bold text-slate-900">Novo Estudo</h2>
            </div>
          </header>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Título do Tópico</label>
              <input 
                required
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Ex: Revolução Industrial"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Matéria</label>
                <input 
                  required
                  value={form.subject}
                  onChange={e => setForm({...form, subject: e.target.value})}
                  placeholder="Ex: História"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Status</label>
                <select 
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value as StudyStatus})}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none"
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Resumo / Notas Rápidas</label>
              <textarea 
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Uma breve descrição do que será estudado..."
                className="w-full min-h-[80px] rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Conteúdo Detalhado (Resumo)</label>
              <textarea 
                value={form.content}
                onChange={e => setForm({...form, content: e.target.value})}
                placeholder="Escreva aqui seu resumo completo, fórmulas ou insights..."
                className="w-full min-h-[150px] rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Anexar Material (PDF/Foto)</label>
              <div className="relative group">
                <input 
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex items-center gap-2 w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 group-hover:border-indigo-400 group-hover:bg-indigo-50/30 transition-all">
                  <Paperclip className="h-4 w-4" />
                  <span className="truncate">{selectedFile ? selectedFile.name : "Escolher arquivo..."}</span>
                </div>
              </div>
            </div>

            <button 
              disabled={isSaving}
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isSaving ? "Salvando..." : "Adicionar à Estante"}
            </button>
          </form>
        </div>
      </aside>

      {/* Grid de Conteúdo */}
      <main className="space-y-6">
        <header className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar matéria ou tópico..."
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {statuses.map(s => (
              <div key={s} className="px-3 py-1 rounded-full border border-slate-200 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {s}: {items.filter(i => i.status === s).length}
              </div>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="h-64 rounded-3xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map(item => {
              const palette = statusPalette[item.status];
              const isPdf = item.attachment_url?.endsWith(".pdf");

              return (
                <article key={item.id} className="group flex flex-col rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                  <header className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${palette.bg} ${palette.color} ${palette.border} border`}>
                      {item.status}
                    </span>
                    <button 
                      onClick={() => void handleDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </header>

                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{item.subject}</div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-3">{item.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">{item.notes}</p>
                    
                    {item.content && (
                      <div className="mb-4 rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mb-2">
                          <FileText className="h-3 w-3" />
                          Fragmento do Resumo
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 italic italic">"{item.content}"</p>
                      </div>
                    )}
                  </div>

                  <footer className="mt-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.inserted_at).toLocaleDateString("pt-BR")}
                        </div>
                      </div>

                      {item.attachment_url && (
                        <a 
                          href={item.attachment_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-[11px] font-bold text-indigo-600 hover:bg-indigo-100 transition-all"
                        >
                          {isPdf ? <FileText className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                          Abrir Material
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </footer>
                </article>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-slate-100 bg-slate-50/30">
                <div className="p-4 rounded-full bg-white shadow-sm text-slate-300">
                  <BookOpen className="h-12 w-12" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-400">Nenhum estudo encontrado na estante.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
