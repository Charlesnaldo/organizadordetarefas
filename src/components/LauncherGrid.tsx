"use client";

import Link from "next/link";
import AppIcon from "@/components/AppIcon";
import { launcherItems } from "@/lib/launcher-items";

export default function LauncherGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {launcherItems.map((item, index) => (
        <Link
          key={item.href}
          href={item.href}
          className={`group relative overflow-hidden rounded-[2rem] border border-white/70 bg-linear-to-br ${item.accent} p-6 shadow-[0_22px_50px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_34px_70px_rgba(15,23,42,0.14)] ${index === 0 ? "md:col-span-2 xl:col-span-2" : ""}`}
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
      ))}
    </section>
  );
}
