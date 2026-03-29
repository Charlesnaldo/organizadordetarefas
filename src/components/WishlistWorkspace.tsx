"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type WishItem = {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  image_url: string;
  position: number;
};

// Estrutura para os campos do formulário (que são strings com máscara)
type WishItemForm = {
  id: string;
  title: string;
  targetValue: string;
  currentValue: string;
  imageUrl: string;
};

export default function WishlistWorkspace({ session }: { session: Session }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [wishlist, setWishlist] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingWishId, setDraggingWishId] = useState<string | null>(null);
  const [wishDropTargetId, setWishDropTargetId] = useState<string | null>(null);
  const [photoWishId, setPhotoWishId] = useState<string | null>(null);

  useEffect(() => {
    void loadWishlist();
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

  async function loadWishlist() {
    setLoading(true);
    try {
      const data = await authFetch<WishItem[]>("/api/wishlist");
      // Se estiver vazio, criar itens padrão se necessário, ou apenas deixar vazio
      setWishlist(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(
    () =>
      wishlist.reduce(
        (acc, item) => {
          const target = item.target_value;
          const current = item.current_value;
          const remaining = Math.max(target - current, 0);
          return {
            target: acc.target + target,
            current: acc.current + current,
            remaining: acc.remaining + remaining,
          };
        },
        { target: 0, current: 0, remaining: 0 },
      ),
    [wishlist],
  );

  async function updateWishItem(id: string, updates: Partial<WishItem>) {
    // Atualização otimista
    setWishlist((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));

    try {
      await authFetch("/api/wishlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ id, ...updates }] }),
      });
    } catch (err) {
      console.error(err);
      void loadWishlist(); // Reverter em caso de erro
    }
  }

  async function handleCreateWish() {
    try {
      const newItem = await authFetch<WishItem>("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: "Novo Desejo", 
          position: wishlist.length 
        }),
      });
      setWishlist([...wishlist, newItem]);
    } catch (err) {
      console.error(err);
    }
  }

  function handleWishImageChange(id: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        void updateWishItem(id, { image_url: reader.result });
      }
    };
    reader.readAsDataURL(file);
  }

  function handleWishDragStart(event: DragEvent<HTMLElement>, wishId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/wish", wishId);
    setDraggingWishId(wishId);
    setWishDropTargetId(wishId);
  }

  async function handleWishDrop(event: DragEvent<HTMLElement>, targetWishId: string) {
    event.preventDefault();
    const draggedWishId = event.dataTransfer.getData("text/wish") || draggingWishId;
    if (!draggedWishId || draggedWishId === targetWishId) {
      setDraggingWishId(null);
      setWishDropTargetId(null);
      return;
    }

    const nextWishlist = reorderWishItems(wishlist, draggedWishId, targetWishId).map((item, index) => ({ ...item, position: index }));
    setWishlist(nextWishlist);
    setDraggingWishId(null);
    setWishDropTargetId(null);

    try {
      await authFetch("/api/wishlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: nextWishlist }),
      });
    } catch (err) {
      console.error(err);
      void loadWishlist();
    }
  }

  return (
    <section className="glass-panel rounded-[1.4rem] p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Objetivos Financeiros</div>
          <h2 className="mt-3 font-[family:var(--font-space-grotesk)] text-2xl font-medium text-slate-900">Desejos</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Home dedicada para a wishlist. Arraste para reorganizar e use o ícone de engrenagem para trocar a foto.
          </p>
          <button 
            onClick={handleCreateWish}
            className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Adicionar novo desejo
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Valor total" value={formatCompactCurrency(totals.target)} detail={formatCurrency(totals.target)} />
          <StatCard label="Já tenho" value={formatCompactCurrency(totals.current)} detail={formatCurrency(totals.current)} />
          <StatCard label="Falta" value={formatCompactCurrency(totals.remaining)} detail={formatCurrency(totals.remaining)} />
        </div>
      </div>

      <div
        className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 wish-grid"
        data-dragging={draggingWishId ? "true" : undefined}
      >
        {wishlist.map((wish, index) => {
          const target = wish.target_value;
          const current = wish.current_value;
          const remaining = Math.max(target - current, 0);
          const completion = target > 0 ? Math.min((current / target) * 100, 100) : 0;
          const isWishDragging = draggingWishId === wish.id;
          const isWishDropTarget = wishDropTargetId === wish.id && draggingWishId !== wish.id;

          return (
            <article
              key={wish.id}
              draggable
              onDragStart={(event) => handleWishDragStart(event, wish.id)}
              onDragEnd={() => {
                setDraggingWishId(null);
                setWishDropTargetId(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setWishDropTargetId(wish.id);
              }}
              onDrop={(event) => handleWishDrop(event, wish.id)}
              className={`wish-card relative flex flex-col gap-3 rounded-[1.2rem] border border-slate-200 bg-white/80 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)] transition ${
                isWishDragging ? "wish-card--dragging" : ""
              } ${isWishDropTarget ? "wish-card--target" : ""}`}
            >
              <div className="flex justify-center">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
                  {wish.image_url ? (
                    <Image
                      src={wish.image_url}
                      alt={wish.title || `Desejo ${index + 1}`}
                      width={256}
                      height={256}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Sem foto</div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {wish.title.trim() || "Objetivo"}
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoWishId(wish.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300"
                  aria-label="Abrir modal de foto"
                >
                  <DragDotsIcon />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                <div className="flex-1 text-center">Meta<br/>{formatCurrency(target)}</div>
                <div className="flex-1 text-center">Tenho<br/>{formatCurrency(current)}</div>
                <div className="flex-1 text-center">Falta<br/>{formatCurrency(remaining)}</div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <div className="grid gap-2">
                <input
                  defaultValue={wish.title}
                  onBlur={(event) => {
                    if (event.target.value !== wish.title) {
                      void updateWishItem(wish.id, { title: event.target.value });
                    }
                  }}
                  placeholder="Nome" 
                  className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none"
                />
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <input
                    defaultValue={wish.target_value || ""}
                    onBlur={(event) => {
                      const val = parseCurrencyInput(event.target.value);
                      if (val !== wish.target_value) {
                        void updateWishItem(wish.id, { target_value: val });
                      }
                    }}
                    placeholder="Meta"
                    className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none"
                  />
                  <input
                    defaultValue={wish.current_value || ""}
                    onBlur={(event) => {
                      const val = parseCurrencyInput(event.target.value);
                      if (val !== wish.current_value) {
                        void updateWishItem(wish.id, { current_value: val });
                      }
                    }}
                    placeholder="Tenho"
                    className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>
            </article>
          );
        })}
        {loading && <div className="col-span-full py-20 text-center text-slate-500">Carregando desejos...</div>}
        {!loading && wishlist.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-[1.4rem]">
            Sua wishlist está vazia. Comece adicionando um novo desejo!
          </div>
        )}
      </div>

      {photoWishId !== null ? (
        <WishPhotoModal
          wish={wishlist.find((item) => item.id === photoWishId) ?? null}
          onClose={() => setPhotoWishId(null)}
          onChange={handleWishImageChange}
          onRemove={() => void updateWishItem(photoWishId, { image_url: "" })}
        />
      ) : null}
    </section>
  );
}

function reorderWishItems(current: WishItem[], draggedId: string, targetId: string) {
  const draggedItem = current.find((item) => item.id === draggedId);
  if (!draggedItem) return current;
  const next = current.filter((item) => item.id !== draggedId);
  const targetIndex = next.findIndex((item) => item.id === targetId);
  if (targetIndex === -1) return [...next, draggedItem];
  return [...next.slice(0, targetIndex), draggedItem, ...next.slice(targetIndex)];
}

function parseCurrencyInput(value: string) {
  if (!value) return 0;
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10000 ? 1 : 0,
  }).format(value);
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-linear-to-b from-slate-50 to-white p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-3 font-[family:var(--font-space-grotesk)] text-3xl font-medium text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{detail}</div>
    </div>
  );
}

function WishPhotoModal({ wish, onClose, onChange, onRemove }: { wish: WishItem | null; onClose: () => void; onChange: (id: string, event: ChangeEvent<HTMLInputElement>) => void; onRemove: () => void; }) {
  if (!wish) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 px-4 py-8 backdrop-blur-[2px]">
      <div className="glass-panel w-full max-w-md rounded-[1rem] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Foto do desejo</div>
            <h2 className="mt-3 font-[family:var(--font-space-grotesk)] text-xl font-medium text-slate-900">
              {wish.title.trim() || "Objetivo"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
        <div className="mt-5 space-y-4 text-center">
          <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            {wish.image_url ? (
              <Image src={wish.image_url} alt={wish.title || "Desejo"} width={256} height={256} className="h-full w-full object-cover" unoptimized />
            ) : (
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sem foto</span>
            )}
          </div>
          <label className="block text-sm text-slate-600">
            Escolher foto
            <input
              type="file"
              accept="image/*"
              onChange={(event) => onChange(wish.id, event)}
              className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600 outline-none file:mr-2 file:cursor-pointer file:rounded-xl file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700"
            />
          </label>
          {wish.image_url ? (
            <button
              type="button"
              onClick={onRemove}
              className="w-full cursor-pointer rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
            >
              Remover foto
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DragDotsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <circle cx="5" cy="4" r="1.1" />
      <circle cx="11" cy="4" r="1.1" />
      <circle cx="5" cy="8" r="1.1" />
      <circle cx="11" cy="8" r="1.1" />
      <circle cx="5" cy="12" r="1.1" />
      <circle cx="11" cy="12" r="1.1" />
    </svg>
  );
}
