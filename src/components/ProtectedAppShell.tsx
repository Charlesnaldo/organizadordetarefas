"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import AppIcon, { IconName } from "@/components/AppIcon";
import { launcherItems } from "@/lib/launcher-items";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type ProtectedAppShellProps = {
  title: string;
  description: string;
  children: (session: Session) => ReactNode;
};

type AccentOption = {
  id: string;
  panel: string;
  swatch: string;
};

const sessionAccentOptions: AccentOption[] = [
  { id: "light", panel: "border-slate-200 bg-white/90 text-slate-900", swatch: "#ffffff" },
  { id: "night", panel: "border-slate-200 bg-slate-950 text-white", swatch: "#0f172a" },
  {
    id: "aurora",
    panel: "border-slate-200 bg-gradient-to-br from-sky-50 via-blue-50 to-white text-slate-900",
    swatch: "linear-gradient(135deg, #bae6fd, #e0f2fe)",
  },
];

export default function ProtectedAppShell({ title, description, children }: ProtectedAppShellProps) {
  const pathname = usePathname();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const [authError, setAuthError] = useState("");
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);

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

    const operation =
      authMode === "signin"
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
        <section
          className="relative mx-auto flex min-h-screen items-center"
          style={{ width: "90vw", maxWidth: "1600px" }}
        >
          <div className="glass-panel w-full rounded-[1rem] p-4 sm:p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Configurar Supabase</div>
            <h1 className="mt-4 font-[family:var(--font-space-grotesk)] text-xl font-medium text-slate-900">
              Faltam variáveis públicas do Supabase.
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local para habilitar login e dados.
            </p>
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
        <section
          className="relative mx-auto flex min-h-screen items-center"
          style={{ width: "90vw", maxWidth: "1600px" }}
        >
          <div className="glass-panel w-full max-w-md rounded-[1rem] p-4 sm:p-5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
              <AppIcon name="home" className="h-4 w-4" />
              <span>Tudlist</span>
            </div>
            <h1 className="mt-4 font-[family:var(--font-space-grotesk)] text-4xl font-medium text-slate-900">
              Entre para abrir seu sistema pessoal.
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Acesse desejos, rotina, sites úteis e estudos em um único lugar.
            </p>
            <form className="mt-6 space-y-4" onSubmit={(event) => void handleAuthSubmit(event)}>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                <AppIcon name="email" className="h-4 w-4 shrink-0" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none"
                />
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                <AppIcon name="lock" className="h-4 w-4 shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Senha"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none"
                />
              </label>
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(15,23,42,0.12)] hover:bg-slate-800"
              >
                <AppIcon name="arrow" className="h-4 w-4" />
                <span>{loading ? "Processando..." : authMode === "signin" ? "Entrar" : "Criar conta"}</span>
              </button>
            </form>
            <button
              type="button"
              onClick={() => setAuthMode((current) => (current === "signin" ? "signup" : "signin"))}
              className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600 underline-offset-4 hover:underline"
            >
              <AppIcon name="user" className="h-4 w-4" />
              <span>{authMode === "signin" ? "Criar nova conta" : "Já tenho conta"}</span>
            </button>
            {authError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</div>
            ) : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-900 sm:px-8 lg:px-10">
      {/* Elementos decorativos de fundo sutis */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-white/20 blur-[120px]" />
        <div className="absolute right-[-5%] bottom-[-5%] h-[30%] w-[30%] rounded-full bg-slate-300/20 blur-[100px]" />
      </div>

      <section
        className="relative mx-auto flex flex-col gap-6"
        style={{ width: "90vw", maxWidth: "1600px" }}
      >
        <header className={`glass-panel rounded-[2.5rem] transition-all duration-500 ease-in-out ${isHeaderMinimized ? 'p-4 sm:px-8 sm:py-4' : 'p-6 sm:px-10 sm:py-8'}`}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className={`overflow-hidden transition-all duration-500 ${isHeaderMinimized ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'}`}>
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                  <span>Sistema Pessoal</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-2">
                <h1 className={`font-[family:var(--font-space-grotesk)] font-bold tracking-tight text-slate-900 transition-all duration-500 ${isHeaderMinimized ? 'text-xl' : 'text-3xl sm:text-4xl mt-2'}`}>
                  {title}
                </h1>
                <button
                  onClick={() => setIsHeaderMinimized(!isHeaderMinimized)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all border border-white/50 shadow-sm"
                  aria-label={isHeaderMinimized ? "Expandir cabeçalho" : "Minimizar cabeçalho"}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className={`h-4 w-4 transition-transform duration-500 ${isHeaderMinimized ? 'rotate-180' : ''}`}
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
              </div>

              <div className={`overflow-hidden transition-all duration-500 ${isHeaderMinimized ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100 mt-3'}`}>
                <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-500/80">{description}</p>
              </div>
            </div>
            
            <SessionBadge session={session} onSignOut={handleSignOut} />
          </div>
          
          <nav className={`flex flex-wrap gap-2 transition-all duration-500 ${isHeaderMinimized ? 'mt-4' : 'mt-10'}`}>
            <NavLink 
              href="/" 
              label="Início" 
              active={pathname === "/"} 
              icon="home" 
              accent="from-slate-200 to-slate-300"
            />
            {launcherItems.map((item) => (
              <NavLink 
                key={item.href} 
                href={item.href} 
                label={item.title} 
                active={pathname === item.href} 
                icon={item.icon} 
                accent={item.accent}
              />
            ))}
          </nav>
        </header>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
          {children(session)}
        </div>
      </section>
    </main>
  );
}

function NavLink({ 
  href, 
  label, 
  active, 
  icon, 
  accent 
}: { 
  href: string; 
  label: string; 
  active: boolean; 
  icon: IconName;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-500 border border-white/40 shadow-sm ${
        active
          ? `bg-linear-to-br ${accent} text-slate-950 brightness-90 saturate-150 shadow-inner ring-1 ring-black/10 scale-[0.98]`
          : `bg-linear-to-br ${accent} text-slate-700/80 opacity-40 saturate-50 hover:opacity-100 hover:saturate-100 hover:shadow-md hover:scale-105`
      }`}
    >
      <div className={`absolute inset-0 rounded-2xl bg-white/20 opacity-0 transition-opacity ${active ? "opacity-0" : "group-hover:opacity-100"}`} />
      <AppIcon 
        name={icon} 
        className={`h-4 w-4 transition-transform duration-500 ${
          active ? "opacity-100 scale-110" : "opacity-60 group-hover:opacity-100 group-hover:rotate-12"
        }`} 
      />
      <span className="relative z-10">{label}</span>
    </Link>
  );
}

function SessionBadge({
  session,
  onSignOut,
}: {
  session: Session;
  onSignOut: () => Promise<void>;
}) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [accentIndex, setAccentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!supabase) return;
      const activeSession = session ?? (await supabase.auth.getSession()).data.session;
      if (!activeSession?.access_token) return;

      try {
        const response = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${activeSession.access_token}` },
        });
        if (response.ok) {
          const profile = await response.json();
          setAvatarUrl(profile.avatar_url ?? "");
          setAccentIndex(profile.theme_index ?? 0);
        }
      } catch (err) {
        console.error("Falha ao carregar perfil:", err);
      }
    }
    void loadProfile();
  }, [supabase, session]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function updateProfile(updates: { avatar_url?: string; theme_index?: number }) {
    if (!supabase) return;
    const activeSession = session ?? (await supabase.auth.getSession()).data.session;
    if (!activeSession?.access_token) return;

    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeSession.access_token}`,
        },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Falha ao atualizar perfil:", err);
    }
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === "string") {
        const url = reader.result;
        setAvatarUrl(url);
        await updateProfile({ avatar_url: url });
      }
    };
    reader.readAsDataURL(file);
  }

  const initials = session.user.email?.slice(0, 2).toUpperCase() || "TU";
  const accent = sessionAccentOptions[accentIndex] ?? sessionAccentOptions[0];

  return (
    <div className="relative" ref={menuRef}>
      {/* Botão de Perfil Compacto (Google Style) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-lg transition-all hover:scale-110 active:scale-95 ring-2 ring-transparent hover:ring-indigo-200"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Perfil" fill sizes="48px" className="object-cover" unoptimized />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-linear-to-br ${accent.panel.includes('bg-slate-950') ? 'from-slate-800 to-slate-950 text-white' : 'from-slate-100 to-slate-200 text-slate-600'} text-sm font-bold`}>
            {initials}
          </div>
        )}
      </button>

      {/* Menu Dropdown Expansível */}
      {isOpen && (
        <div className="absolute right-0 mt-4 z-50 w-80 origin-top-right animate-in fade-in zoom-in-95 duration-200">
          <div className="overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/90 p-2 shadow-2xl shadow-black/10 backdrop-blur-3xl">
            <div className={`rounded-[2rem] p-6 ${accent.panel} transition-colors duration-500`}>
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-xl">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xl font-bold text-slate-400">
                        {initials}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition-transform hover:scale-110"
                  >
                    <AppIcon name="upload" className="h-3.5 w-3.5" />
                  </button>
                </div>
                
                <div className="mt-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sua Conta</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{session.user.email}</div>
                </div>

                <div className="mt-6 w-full border-t border-black/[0.05] pt-6">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Aparência</span>
                    <div className="flex gap-2">
                      {sessionAccentOptions.map((option, index) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={async () => {
                            setAccentIndex(index);
                            await updateProfile({ theme_index: index });
                          }}
                          className={`h-5 w-5 rounded-full border-2 transition-all hover:scale-110 ${
                            accentIndex === index ? "border-slate-900 scale-110 shadow-md" : "border-transparent"
                          }`}
                          style={{ background: option.swatch }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid w-full grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      setAvatarUrl("");
                      await updateProfile({ avatar_url: "" });
                    }}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-white/50 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-white hover:text-rose-600 transition-all border border-white/20"
                  >
                    <AppIcon name="trash" className="h-3.5 w-3.5" />
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => void onSignOut()}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-rose-600 transition-all shadow-lg shadow-black/10"
                  >
                    <AppIcon name="logout" className="h-3.5 w-3.5" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
    </div>
  );
}
