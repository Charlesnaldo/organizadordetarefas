"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

type FinanceCategory = "entrada" | "saida-fixa" | "saida-variavel" | "investimento" | "meta";

type FinanceEntry = {
  id: string;
  title: string;
  amount: string;
  category: FinanceCategory;
  notes: string;
  dueDate: string;
};

const emptyForm = {
  title: "",
  amount: "",
  category: "entrada" as FinanceCategory,
  notes: "",
  dueDate: "",
};

const categoryMeta: Record<FinanceCategory, { label: string; tone: string }> = {
  entrada: { label: "Entradas", tone: "from-emerald-50 to-teal-50 border-emerald-100" },
  "saida-fixa": { label: "Saídas Fixas", tone: "from-rose-50 to-orange-50 border-rose-100" },
  "saida-variavel": { label: "Saídas Variáveis", tone: "from-amber-50 to-yellow-50 border-amber-100" },
  investimento: { label: "Investimentos", tone: "from-sky-50 to-cyan-50 border-sky-100" },
  meta: { label: "Metas Financeiras", tone: "from-violet-50 to-fuchsia-50 border-violet-100" },
};

export default function FinanceWorkspace({ session }: { session: Session }) {
  const storageKey = `tudlist.finance.${session.user.id}`;
  const [entries, setEntries] = useState<FinanceEntry[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return [];
    }
    try {
      return JSON.parse(stored) as FinanceEntry[];
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries, storageKey]);

  const summary = useMemo(() => {
    const totals = {
      entrada: 0,
      "saida-fixa": 0,
      "saida-variavel": 0,
      investimento: 0,
      meta: 0,
    } satisfies Record<FinanceCategory, number>;

    for (const entry of entries) {
      totals[entry.category] += parseCurrencyInput(entry.amount);
    }

    const totalSaidas = totals["saida-fixa"] + totals["saida-variavel"];
    const saldo = totals.entrada - totalSaidas - totals.investimento;

    return { totals, totalSaidas, saldo };
  }, [entries]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.amount.trim()) {
      return;
    }

    setEntries((current) => [
      {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        amount: form.amount.trim(),
        category: form.category,
        notes: form.notes.trim(),
        dueDate: form.dueDate,
      },
      ...current,
    ]);
    setForm(emptyForm);
  }

  function removeEntry(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
      <div className="glass-panel rounded-[1.4rem] p-4 sm:p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Planejamento</div>
        <h2 className="mt-3 font-[family:var(--font-space-grotesk)] text-2xl font-medium text-slate-900">Controle financeiro</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">Registre salário, renda extra, despesas fixas, gastos variáveis, investimentos e metas em um só painel.</p>
        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Título do lançamento" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Valor" inputMode="decimal" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as FinanceCategory }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
              <option value="entrada">Entradas</option>
              <option value="saida-fixa">Saídas Fixas</option>
              <option value="saida-variavel">Saídas Variáveis</option>
              <option value="investimento">Investimentos</option>
              <option value="meta">Metas Financeiras</option>
            </select>
          </div>
          <input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
          <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={4} placeholder="Observações" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
          <button type="submit" className="w-full cursor-pointer rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Salvar lançamento</button>
        </form>
      </div>

      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FinanceStatCard label="Entradas" value={formatCurrency(summary.totals.entrada)} tone="from-emerald-50 to-teal-50 border-emerald-100" />
          <FinanceStatCard label="Saídas" value={formatCurrency(summary.totalSaidas)} tone="from-rose-50 to-orange-50 border-rose-100" />
          <FinanceStatCard label="Investimentos" value={formatCurrency(summary.totals.investimento)} tone="from-sky-50 to-cyan-50 border-sky-100" />
          <FinanceStatCard label="Saldo Livre" value={formatCurrency(summary.saldo)} tone="from-slate-50 to-white border-slate-200" />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {(Object.keys(categoryMeta) as FinanceCategory[]).map((category) => {
            const items = entries.filter((entry) => entry.category === category);
            return (
              <section key={category} className={`rounded-[1.2rem] border bg-linear-to-b p-4 ${categoryMeta[category].tone}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{categoryMeta[category].label}</div>
                    <div className="mt-2 text-xl font-medium text-slate-900">{formatCurrency(summary.totals[category])}</div>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">{items.length} itens</span>
                </div>
                <div className="mt-4 space-y-3">
                  {items.map((entry) => (
                    <article key={entry.id} className="rounded-[1rem] border border-slate-200 bg-white/90 p-3 shadow-[0_10px_20px_rgba(15,23,42,0.04)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{entry.title}</div>
                          {entry.dueDate ? <div className="mt-1 text-xs text-slate-500">{formatDateLabel(entry.dueDate)}</div> : null}
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{formatCurrency(parseCurrencyInput(entry.amount))}</div>
                      </div>
                      {entry.notes ? <p className="mt-2 text-sm leading-6 text-slate-600">{entry.notes}</p> : null}
                      <button type="button" onClick={() => removeEntry(entry.id)} className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-600">Remover</button>
                    </article>
                  ))}
                  {items.length === 0 ? <div className="rounded-[1rem] border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center text-sm text-slate-400">Nenhum item nessa seção.</div> : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function parseCurrencyInput(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(value);
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}/${month}/${year}`;
}

function FinanceStatCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-[1rem] border bg-linear-to-b ${tone} p-4`}>
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-3 font-[family:var(--font-space-grotesk)] text-2xl font-medium text-slate-900">{value}</div>
    </div>
  );
}

