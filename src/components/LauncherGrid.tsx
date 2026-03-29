"use client";

import Link from "next/link";
import { DragEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import AppIcon from "@/components/AppIcon";
import { launcherItems as defaultItems, LauncherItem } from "@/lib/launcher-items";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LauncherGrid({ session }: { session: Session }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<LauncherItem[]>(defaultItems);
  const [loading, setLoading] = useState(true);
  const [draggingHref, setDraggingHref] = useState<string | null>(null);
  const [dropTargetHref, setDropTargetHref] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!supabase) return;
      const activeSession = session ?? (await supabase.auth.getSession()).data.session;
      if (!activeSession?.access_token) return;

      try {
        const response = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${activeSession.access_token}` },
        });
        if (response.ok) {
          const profile = await response.json();
          if (profile.launcher_order && profile.launcher_order.length > 0) {
            const order = profile.launcher_order as string[];
            const sortedItems = [...defaultItems].sort((a, b) => {
              const indexA = order.indexOf(a.href);
              const indexB = order.indexOf(b.href);
              if (indexA === -1 && indexB === -1) return 0;
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              return indexA - indexB;
            });
            setItems(sortedItems);
          }
        }
      } catch (err) {
        console.error("Falha ao carregar ordem do grid:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadOrder();
  }, [supabase, session]);

  async function saveOrder(newItems: LauncherItem[]) {
    if (!supabase) return;
    const activeSession = session ?? (await supabase.auth.getSession()).data.session;
    if (!activeSession?.access_token) return;

    const order = newItems.map(item => item.href);

    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeSession.access_token}`,
        },
        body: JSON.stringify({ launcher_order: order }),
      });
    } catch (err) {
      console.error("Falha ao salvar ordem do grid:", err);
      toast.error("Erro ao salvar ordem.");
    }
  }

  function handleDragStart(event: DragEvent<HTMLElement>, href: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/launcher-href", href);
    setDraggingHref(href);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, href: string) {
    event.preventDefault();
    if (draggingHref !== href) {
      setDropTargetHref(href);
    }
  }

  async function handleDrop(event: DragEvent<HTMLElement>, targetHref: string) {
    event.preventDefault();
    const draggedHref = event.dataTransfer.getData("text/launcher-href") || draggingHref;
    
    if (!draggedHref || draggedHref === targetHref) {
      setDraggingHref(null);
      setDropTargetHref(null);
      return;
    }

    const draggedItem = items.find(i => i.href === draggedHref);
    if (!draggedItem) return;

    const remaining = items.filter(i => i.href !== draggedHref);
    const targetIndex = remaining.findIndex(i => i.href === targetHref);
    
    const newItems = [...remaining.slice(0, targetIndex), draggedItem, ...remaining.slice(targetIndex)];
    setItems(newItems);
    setDraggingHref(null);
    setDropTargetHref(null);
    
    await saveOrder(newItems);
    toast.success("Ordem atualizada!");
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 opacity-50">
        {items.map((_, i) => (
          <div key={i} className="h-64 rounded-[2rem] bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const isDragging = draggingHref === item.href;
        const isDropTarget = dropTargetHref === item.href;

        return (
          <div
            key={item.href}
            draggable
            onDragStart={(e) => handleDragStart(e, item.href)}
            onDragOver={(e) => handleDragOver(e, item.href)}
            onDrop={(e) => handleDrop(e, item.href)}
            onDragEnd={() => {
              setDraggingHref(null);
              setDropTargetHref(null);
            }}
            className={`transition-all duration-300 ${isDragging ? "opacity-40 scale-95" : ""} ${isDropTarget ? "ring-2 ring-sky-500 ring-offset-4" : ""} ${index === 0 ? "md:col-span-2 xl:col-span-2" : ""}`}
          >
            <Link
              href={item.href}
              className={`group relative block h-full overflow-hidden rounded-[2rem] border border-white/70 bg-linear-to-br ${item.accent} p-6 shadow-[0_22px_50px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_34px_70px_rgba(15,23,42,0.14)]`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" />
              <div className="absolute right-5 top-5 h-20 w-20 rounded-full bg-white/60 blur-2xl transition duration-300 group-hover:scale-125" />
              <div className="relative flex min-h-52 flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
                    <AppIcon name={item.icon} className="h-3.5 w-3.5" />
                    <span>{item.eyebrow}</span>
                  </div>
                  <div className="mt-6 flex items-center gap-3 text-slate-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white/80 shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
                      <AppIcon name={item.icon} className="h-6 w-6" />
                    </div>
                    <h2 className="font-[family:var(--font-space-grotesk)] text-3xl font-medium">{item.title}</h2>
                  </div>
                  <p className="mt-3 max-w-sm text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
                <div className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
                  <span>Abrir módulo</span>
                  <AppIcon name="arrow" className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </section>
  );
}
