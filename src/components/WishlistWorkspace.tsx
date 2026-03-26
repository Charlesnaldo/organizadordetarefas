"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

type WishItem = {
  id: number;
  title: string;
  targetValue: string;
  currentValue: string;
  imageUrl: string;
};

const emptyWishList: WishItem[] = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  title: "",
  targetValue: "",
  currentValue: "",
  imageUrl: "",
}));

export default function WishlistWorkspace({ session }: { session: Session }) {
  const storageKey = buildWishlistStorageKey(session.user.id);
  const [wishlist, setWishlist] = useState<WishItem[]>(() => {
    if (typeof window === "undefined") {
      return emptyWishList;
    }
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return emptyWishList;
    }
    try {
      return normalizeWishlist(JSON.parse(stored) as WishItem[]);
    } catch {
      return emptyWishList;
    }
  });
  const [draggingWishId, setDraggingWishId] = useState<number | null>(null);
  const [wishDropTargetId, setWishDropTargetId] = useState<number | null>(null);
  const [photoWishId, setPhotoWishId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(wishlist));
  }, [storageKey, wishlist]);

  const totals = useMemo(() => wishlist.reduce((acc, item) => {
    const target = parseCurrencyInput(item.targetValue);
    const current = parseCurrencyInput(item.currentValue);
    const remaining = Math.max(target - current, 0);
    return { target: acc.target + target, current: acc.current + current, remaining: acc.remaining + remaining };
  }, { target: 0, current: 0, remaining: 0 }), [wishlist]);

  function updateWishItem(id: number, key: keyof Omit<WishItem, "id">, value: string) {
    setWishlist((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));
  }

  function handleWishImageChange(id: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateWishItem(id, "imageUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleWishDragStart(event: DragEvent<HTMLElement>, wishId: number) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/wish", String(wishId));
    setDraggingWishId(wishId);
    setWishDropTargetId(wishId);
  }

  function handleWishDragOver(event: DragEvent<HTMLElement>, targetWishId: number) {
    event.preventDefault();
    const draggedWishId = Number(event.dataTransfer.getData("text/wish")) || draggingWishId;
    if (!draggedWishId || draggedWishId === targetWishId) {
      return;
    }
    setWishDropTargetId(targetWishId);
    setWishlist((current) => reorderWishItems(current, draggedWishId, targetWishId));
  }

  function handleWishDrop(event: DragEvent<HTMLElement>, targetWishId: number) {
    event.preventDefault();
    const draggedWishId = Number(event.dataTransfer.getData("text/wish")) || draggingWishId;
    if (draggedWishId && draggedWishId !== targetWishId) {
      setWishlist((current) => reorderWishItems(current, draggedWishId, targetWishId));
    }
    setDraggingWishId(null);
    setWishDropTargetId(null);
  }

  return (
    <section className="glass-panel rounded-[1.4rem] p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Objetivos Financeiros</div>
          <h2 className="mt-3 font-[family:var(--font-space-grotesk)] text-2xl font-medium text-slate-900">Desejos</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Home dedicada para sua wishlist. Arraste para reorganizar e abra o modal para trocar a foto.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Valor total" value={formatCompactCurrency(totals.target)} detail={formatCurrency(totals.target)} />
          <StatCard label="Já tenho" value={formatCompactCurrency(totals.current)} detail={formatCurrency(totals.current)} />
          <StatCard label="Falta" value={formatCompactCurrency(totals.remaining)} detail={formatCurrency(totals.remaining)} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-3">
        {wishlist.map((wish, index) => {
          const target = parseCurrencyInput(wish.targetValue);
          const current = parseCurrencyInput(wish.currentValue);
          const remaining = Math.max(target - current, 0);
          const completion = target > 0 ? Math.min((current / target) * 100, 100) : 0;
          const isWishDragging = draggingWishId === wish.id;
          const isWishDropTarget = wishDropTargetId === wish.id && draggingWishId !== wish.id;

          return (
            <article key={wish.id} draggable onDragStart={(event) => handleWishDragStart(event, wish.id)} onDragEnd={() => { setDraggingWishId(null); setWishDropTargetId(null); }} onDragOver={(event) => handleWishDragOver(event, wish.id)} onDrop={(event) => handleWishDrop(event, wish.id)} className={`wish-card rounded-[1rem] border border-slate-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)] ${isWishDragging ? "wish-card--dragging" : ""} ${isWishDropTarget ? "wish-card--target" : ""}`}>
              <div className="mb-3 flex justify-center">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                  {wish.imageUrl ? <Image src={wish.imageUrl} alt={wish.title || `Desejo ${index + 1}`} width={240} height={240} className="h-full w-full object-cover" unoptimized /> : <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Sem foto</div>}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-medium text-slate-900">{wish.title.trim() || `Desejo ${index + 1}`}</div>
                <button type="button" onClick={() => setPhotoWishId(wish.id)} className="widget-handle inline-flex cursor-pointer items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600">
                  <DragDotsIcon />
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <MetricPill label="Meta" value={formatCurrency(target)} />
                <MetricPill label="Tenho" value={formatCurrency(current)} />
                <MetricPill label="Falta" value={formatCurrency(remaining)} />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-linear-to-r from-sky-500 to-blue-600" style={{ width: `${completion}%` }} /></div>
              <div className="mt-3 grid gap-2">
                <input value={wish.title} onChange={(event) => updateWishItem(wish.id, "title", event.target.value)} placeholder="Desejo" className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={wish.targetValue} onChange={(event) => updateWishItem(wish.id, "targetValue", event.target.value)} placeholder="Meta" className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none" />
                  <input value={wish.currentValue} onChange={(event) => updateWishItem(wish.id, "currentValue", event.target.value)} placeholder="Tenho" className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none" />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {photoWishId !== null ? <WishPhotoModal wish={wishlist.find((item) => item.id === photoWishId) ?? null} onClose={() => setPhotoWishId(null)} onChange={handleWishImageChange} onRemove={() => updateWishItem(photoWishId, "imageUrl", "")} /> : null}
    </section>
  );
}

function buildWishlistStorageKey(userId: string) {
  return `tudlist.wishlist.${userId}`;
}

function normalizeWishlist(candidate: WishItem[]) {
  return emptyWishList.map((defaultItem) => {
    const current = candidate.find((item) => item.id === defaultItem.id);
    return { ...defaultItem, ...current };
  });
}

function reorderWishItems(current: WishItem[], draggedId: number, targetId: number) {
  const draggedItem = current.find((item) => item.id === draggedId);
  if (!draggedItem) return current;
  const next = current.filter((item) => item.id !== draggedId);
  const targetIndex = next.findIndex((item) => item.id === targetId);
  if (targetIndex === -1) return [...next, draggedItem];
  return [...next.slice(0, targetIndex), draggedItem, ...next.slice(targetIndex)];
}

function parseCurrencyInput(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(value);
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: value >= 10000 ? 1 : 0 }).format(value);
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-[1rem] border border-slate-200 bg-linear-to-b from-slate-50 to-white p-4"><div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</div><div className="mt-3 font-[family:var(--font-space-grotesk)] text-3xl font-medium text-slate-900">{value}</div><div className="mt-1 text-sm text-slate-600">{detail}</div></div>;
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div><div className="mt-1 text-sm font-medium text-slate-900">{value}</div></div>;
}

function WishPhotoModal({ wish, onClose, onChange, onRemove }: { wish: WishItem | null; onClose: () => void; onChange: (position: number, event: ChangeEvent<HTMLInputElement>) => void; onRemove: () => void; }) {
  if (!wish) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 px-4 py-8 backdrop-blur-[2px]"><div className="glass-panel w-full max-w-md rounded-[1rem] p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Foto do desejo</div><h2 className="mt-3 font-[family:var(--font-space-grotesk)] text-xl font-medium text-slate-900">{wish.title.trim() || `Desejo ${wish.id}`}</h2></div><button type="button" onClick={onClose} className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50">Fechar</button></div><div className="mt-5"><div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">{wish.imageUrl ? <Image src={wish.imageUrl} alt={wish.title || `Desejo ${wish.id}`} width={256} height={256} className="h-full w-full object-cover" unoptimized /> : <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sem foto</span>}</div><label className="mt-4 block"><span className="mb-2 block text-sm text-slate-600">Escolher foto</span><input type="file" accept="image/*" onChange={(event) => onChange(wish.id, event)} className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600 outline-none file:mr-2 file:cursor-pointer file:rounded-xl file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700" /></label>{wish.imageUrl ? <button type="button" onClick={onRemove} className="mt-4 cursor-pointer rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100">Remover foto</button> : null}</div></div></div>;
}

function DragDotsIcon() {
  return <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><circle cx="5" cy="4" r="1.1" /><circle cx="11" cy="4" r="1.1" /><circle cx="5" cy="8" r="1.1" /><circle cx="11" cy="8" r="1.1" /><circle cx="5" cy="12" r="1.1" /><circle cx="11" cy="12" r="1.1" /></svg>;
}


