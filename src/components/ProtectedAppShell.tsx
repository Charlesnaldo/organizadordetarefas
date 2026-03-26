"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import AppIcon, { IconName } from "@/components/AppIcon";
import { launcherItems } from "@/lib/launcher-items";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type ProtectedAppShellProps = {
  title: string;
  description: string;
  children: (session: Session) => ReactNode;
};

export default function ProtectedAppShell({ title, description, children }: ProtectedAppShellProps) {
  const pathname = usePathname();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setAuthError("");

    if (!supabase) {
      setLoading(false);
      return;
    }

    const operation = authMode === "signin"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { error } = await operation;
    if (error) {
      setAuthError(error.message);
    }
    setLoading(false);
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
  }

  if (!supabase) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-900 sm:px-8 lg:px-10">
        <section className="relative mx-auto flex min-h-screen items-center" style={{ width: "90vw", maxWidth: "1600px" }}>
          <div className="glass-panel w-full rounded-[1rem] p-4 sm:p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">Configurar Supabase</div>
            <h1 className="mt-4 font-[family:var(--font-space-grotesk)] text-xl font-medium text-slate-900">Faltam variáveis públicas do Supabase.</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local para habilitar login e dados.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-900 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[8%] top-10 h-40 w-40 rounded-full bg-sky-300/18 blur-3xl" />
          <div className="absolute right-[10%] top-32 h-52 w-52 rounded-full bg-indigo-300/16 blur-3xl" />
        </div>
        <section className="relative mx-auto flex min-h-screen items-center" style={{ width: "90vw", maxWidth: "1600px" }}>
          <div className="glass-panel w-full max-w-md rounded-[1rem] p-4 sm:p-5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
              <AppIcon name="home" className="h-4 w-4" />
              <span>Tudlist</span>
            </div>
            <h1 className="mt-4 font-[family:var(--font-space-grotesk)] text-4xl font-medium text-slate-900">Entre para abrir seu sistema pessoal.</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">Acesse desejos, rotina, sites úteis e estudos em um único lugar.</p>
            <form className="mt-6 space-y-4" onSubmit={(event) => void handleAuthSubmit(event)}>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                <AppIcon name="email" className="h-4 w-4 shrink-0" />
                <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="w-full bg-transparent text-sm text-slate-900 outline-none" />
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                <AppIcon name="lock" className="h-4 w-4 shrink-0" />
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" className="w-full bg-transparent text-sm text-slate-900 outline-none" />
              </label>
              <button type="submit" className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(15,23,42,0.12)] hover:bg-slate-800">
                <AppIcon name="arrow" className="h-4 w-4" />
                <span>{loading ? "Processando..." : authMode === "signin" ? "Entrar" : "Criar conta"}</span>
              </button>
            </form>
            <button type="button" onClick={() => setAuthMode((current) => current === "signin" ? "signup" : "signin")} className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600 underline-offset-4 hover:underline">
              <AppIcon name="user" className="h-4 w-4" />
              <span>{authMode === "signin" ? "Criar nova conta" : "Já tenho conta"}</span>
            </button>
            {authError ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</div> : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-900 sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-10 h-40 w-40 rounded-full bg-sky-300/18 blur-3xl" />
        <div className="absolute right-[10%] top-32 h-52 w-52 rounded-full bg-indigo-300/16 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-sky-200/16 blur-3xl" />
      </div>
      <section className="relative mx-auto flex flex-col gap-6" style={{ width: "90vw", maxWidth: "1600px" }}>
        <header className="glass-panel rounded-[1.4rem] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                <AppIcon name="home" className="h-4 w-4" />
                <span>Sistema Pessoal</span>
              </div>
              <h1 className="mt-3 font-[family:var(--font-space-grotesk)] text-2xl font-medium text-slate-900 sm:text-3xl">{title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
            </div>
            <SessionBadge session={session} onSignOut={handleSignOut} />
          </div>
          <nav className="mt-6 flex flex-wrap gap-2">
            <NavLink href="/" label="Início" active={pathname === "/"} icon="home" />
            {launcherItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.title} active={pathname === item.href} icon={item.icon} />
            ))}
          </nav>
        </header>
        {children(session)}
      </section>
    </main>
  );
}

function NavLink({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: IconName }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${active ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
      <AppIcon name={icon} className="h-3.5 w-3.5" />
      <span>{label}</span>
    </Link>
  );
}

function SessionBadge({ session, onSignOut }: { session: Session; onSignOut: () => Promise<void> }) {
  const storageKey = `tudlist.avatar.${session.user.id}`;
  const [avatarUrl, setAvatarUrl] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window.localStorage.getItem(storageKey) ?? "";
  });
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (avatarUrl) {
      window.localStorage.setItem(storageKey, avatarUrl);
      return;
    }
    window.localStorage.removeItem(storageKey);
  }, [avatarUrl, storageKey]);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  const initials = session.user.email?.slice(0, 2).toUpperCase() || "TU";

  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-white/75 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => inputRef.current?.click()} className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:border-slate-300 hover:bg-slate-50">
          {avatarUrl ? (
            <span className="relative block h-full w-full">
              <Image src={avatarUrl} alt="Avatar" fill sizes="48px" className="object-cover" unoptimized />
            </span>
          ) : initials}
        </button>
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            <AppIcon name="user" className="h-3.5 w-3.5" />
            <span>Sessão</span>
          </div>
          <div className="truncate text-sm font-medium text-slate-900">{session.user.email}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:bg-white">
          <AppIcon name="upload" className="h-3.5 w-3.5" />
          <span>Avatar</span>
        </button>
        {avatarUrl ? <button type="button" onClick={() => setAvatarUrl("")} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:bg-white"><AppIcon name="trash" className="h-3.5 w-3.5" /><span>Remover</span></button> : null}
        <button type="button" onClick={() => void onSignOut()} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300">
          <AppIcon name="logout" className="h-3.5 w-3.5" />
          <span>Sair</span>
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
    </div>
  );
}
