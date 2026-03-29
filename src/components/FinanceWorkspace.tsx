"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { 
  PlusCircle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Target, 
  TrendingUp, 
  Wallet, 
  Trash2, 
  Calendar,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend
} from "recharts";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type FinanceCategory = "entrada" | "saida-fixa" | "saida-variavel" | "investimento" | "meta";

type FinanceEntry = {
  id: string;
  title: string;
  amount: number;
  category: FinanceCategory;
  notes: string;
  due_date: string;
  inserted_at: string;
};

const categoryMeta: Record<FinanceCategory, { label: string; tone: string; icon: any; color: string }> = {
  entrada: { label: "Entradas", tone: "from-emerald-50 to-teal-50 border-emerald-100", icon: ArrowUpCircle, color: "text-emerald-600" },
  "saida-fixa": { label: "Saídas Fixas", tone: "from-rose-50 to-orange-50 border-rose-100", icon: ArrowDownCircle, color: "text-rose-600" },
  "saida-variavel": { label: "Saídas Variáveis", tone: "from-amber-50 to-yellow-50 border-amber-100", icon: AlertCircle, color: "text-amber-600" },
  investimento: { label: "Investimentos", tone: "from-sky-50 to-cyan-50 border-sky-100", icon: TrendingUp, color: "text-sky-600" },
  meta: { label: "Metas Financeiras", tone: "from-violet-50 to-fuchsia-50 border-violet-100", icon: Target, color: "text-violet-600" },
};

export default function FinanceWorkspace({ session }: { session: Session }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "entrada" as FinanceCategory,
    notes: "",
    dueDate: "",
  });

  useEffect(() => {
    void loadEntries();
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

  async function loadEntries() {
    setLoading(true);
    try {
      const data = await authFetch<FinanceEntry[]>("/api/finance");
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    const totals = entries.reduce((acc, entry) => {
      acc[entry.category] += Number(entry.amount);
      return acc;
    }, { entrada: 0, "saida-fixa": 0, "saida-variavel": 0, investimento: 0, meta: 0 });

    const totalSaidas = totals["saida-fixa"] + totals["saida-variavel"];
    const saldo = totals.entrada - totalSaidas - totals.investimento;

    return { totals, totalSaidas, saldo };
  }, [entries]);

  // Processamento de dados para o gráfico
  const chartData = useMemo(() => {
    const months: Record<string, { month: string; entradas: number; saidas: number }> = {};
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Pegar os últimos 6 meses
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months[key] = { month: `${monthNames[d.getMonth()]}`, entradas: 0, saidas: 0 };
    }

    entries.forEach(entry => {
      const date = new Date(entry.due_date || entry.inserted_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (months[key]) {
        if (entry.category === "entrada") {
          months[key].entradas += Number(entry.amount);
        } else if (entry.category === "saida-fixa" || entry.category === "saida-variavel") {
          months[key].saidas += Number(entry.amount);
        }
      }
    });

    return Object.values(months);
  }, [entries]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const numericAmount = parseCurrencyInput(form.amount);
    if (!form.title.trim() || numericAmount <= 0) return;

    try {
      const newEntry = await authFetch<FinanceEntry>("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          amount: numericAmount,
          category: form.category,
          notes: form.notes.trim(),
          due_date: form.dueDate || null,
        }),
      });

      setEntries([newEntry, ...entries]);
      setForm({ title: "", amount: "", category: "entrada", notes: "", dueDate: "" });
      toast.success("Lançamento adicionado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao salvar lançamento.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este lançamento?")) return;

    try {
      await authFetch(`/api/finance?id=${id}`, { method: "DELETE" });
      setEntries(entries.filter((e) => e.id !== id));
      toast.success("Lançamento removido.");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao remover lançamento.");
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[400px_1fr]">
      <aside className="space-y-6">
        {/* Formulário */}
        <div className="glass-panel rounded-[2.5rem] border border-white/40 bg-white p-8 shadow-sm">
          <header className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gestão de Capital</div>
              <h2 className="text-2xl font-bold text-slate-900">Novo Registro</h2>
            </div>
          </header>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Descrição</label>
              <input 
                required
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Ex: Salário Mensal" 
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all focus:border-slate-950 focus:bg-white outline-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Valor (R$)</label>
                <input 
                  required
                  value={form.amount}
                  onChange={e => setForm({...form, amount: e.target.value})}
                  placeholder="0,00"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-slate-950 focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Categoria</label>
                <select 
                  value={form.category} 
                  onChange={e => setForm({...form, category: e.target.value as FinanceCategory})}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-slate-950 focus:bg-white outline-none appearance-none"
                >
                  {Object.entries(categoryMeta).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
               <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Data</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="date" 
                    value={form.dueDate}
                    onChange={e => setForm({...form, dueDate: e.target.value})}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm focus:border-slate-950 focus:bg-white outline-none" 
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white transition-all hover:bg-black active:scale-[0.98] shadow-lg shadow-black/10">
              <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90" />
              Adicionar Lançamento
            </button>
          </form>
        </div>
      </aside>

      <main className="space-y-6">
        {/* Gráfico Mensal */}
        <div className="glass-panel rounded-[2.5rem] border border-white/40 bg-white p-8 shadow-sm">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Visão Analítica</div>
                <h2 className="text-xl font-bold text-slate-900">Performance Mensal</h2>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Entradas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Saídas</span>
              </div>
            </div>
          </header>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '1.5rem', 
                    border: 'none', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    padding: '1rem'
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Bar dataKey="entradas" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="saidas" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Entradas" value={summary.totals.entrada} icon={ArrowUpCircle} color="text-emerald-600" />
          <StatCard label="Total Saídas" value={summary.totalSaidas} icon={ArrowDownCircle} color="text-rose-600" />
          <StatCard label="Investido" value={summary.totals.investimento} icon={TrendingUp} color="text-sky-600" />
          <StatCard label="Saldo Atual" value={summary.saldo} icon={Wallet} color={summary.saldo >= 0 ? "text-slate-900" : "text-rose-600"} highlight />
        </div>

        {/* Categorias */}
        <div className="grid gap-6 md:grid-cols-2">
          {(Object.keys(categoryMeta) as FinanceCategory[]).map((catKey) => {
            const meta = categoryMeta[catKey];
            const items = entries.filter(e => e.category === catKey);
            const Icon = meta.icon;

            return (
              <div key={catKey} className={`flex flex-col rounded-[2.5rem] border bg-gradient-to-br p-6 ${meta.tone} shadow-sm transition-all hover:shadow-md`}>
                <header className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-2xl bg-white p-2.5 shadow-sm ${meta.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{meta.label}</h3>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{formatCurrency(summary.totals[catKey])}</span>
                </header>

                <div className="flex-1 space-y-3">
                  {items.map(entry => (
                    <div key={entry.id} className="group relative rounded-2xl border border-white/50 bg-white/60 p-4 transition-all hover:bg-white hover:shadow-md backdrop-blur-sm">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{entry.title}</h4>
                          {(entry.due_date || entry.inserted_at) && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                              <Calendar className="h-3 w-3" />
                              {formatDateLabel(entry.due_date || entry.inserted_at)}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-black text-slate-900">{formatCurrency(entry.amount)}</span>
                      </div>
                      
                      {entry.notes && <p className="mt-2 text-[11px] italic text-slate-500 line-clamp-2 leading-relaxed">"{entry.notes}"</p>}
                      
                      <button 
                        onClick={() => void handleDelete(entry.id)}
                        className="absolute -right-2 -top-2 hidden rounded-full bg-slate-900 p-1.5 text-white shadow-lg group-hover:block transition-all hover:bg-rose-600 scale-90"
                        aria-label="Excluir lançamento"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {loading ? "Sincronizando..." : `Vazio`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </section>
  );
}

function StatCard({ label, value, icon: Icon, color, highlight = false }: any) {
  return (
    <div className={`rounded-[2rem] border border-white/40 bg-white p-6 shadow-sm transition-all hover:shadow-md ${highlight ? 'ring-2 ring-slate-900 ring-offset-4' : ''}`}>
      <div className="flex items-center justify-between">
        <div className={`rounded-xl bg-slate-50 p-2 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <div className={`mt-4 text-xl font-black tracking-tight ${color}`}>{formatCurrency(value)}</div>
    </div>
  );
}

function parseCurrencyInput(value: string | number): number {
  if (typeof value === 'number') return value;
  const cleanValue = value.replace(/\D/g, "");
  return Number(cleanValue) / 100;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { 
    style: "currency", 
    currency: "BRL" 
  }).format(value);
}

function formatDateLabel(value: string) {
  if (!value) return "";
  const date = new Date(value.includes('T') ? value : value + "T00:00:00");
  return date.toLocaleDateString("pt-BR");
}
