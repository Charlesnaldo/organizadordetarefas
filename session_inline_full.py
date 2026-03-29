# -*- coding: utf-8 -*-
from pathlib import Path
path = Path('src/components/ProtectedAppShell.tsx')
text = path.read_text()
start = text.index('function SessionBadge')
end = text.index('function NavLink', start)
new = '''function SessionBadge({ session, onSignOut, inline = false }: { session: Session; onSignOut: () => Promise<void>; inline?: boolean }) {
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

  if (inline) {
    return (
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        <button type="button" onClick={() => inputRef.current?.click()} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-500">
          {avatarUrl ? (
            <span className="relative block h-full w-full">
              <Image src={avatarUrl} alt="Avatar" fill sizes="40px" className="object-cover" unoptimized />
            </span>
          ) : initials}
        </button>
        <div className="text-left">
          <div className="text-[10px] text-slate-400">Sessão</div>
          <div className="text-sm font-medium text-slate-900">{session.user.email}</div>
        </div>
        <button type="button" onClick={() => void onSignOut()} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Sair
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
      </div>
    );
  }

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
        {avatarUrl ? (
          <button type="button" onClick={() => setAvatarUrl("")} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:bg-white">
            <AppIcon name="trash" className="h-3.5 w-3.5" />
            <span>Remover</span>
          </button>
        ) : null}
        <button type="button" onClick={() => void onSignOut()} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300">
          <AppIcon name="logout" className="h-3.5 w-3.5" />
          <span>Sair</span>
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
    </div>
  );
}
'''
text = text[:start] + new + text[end:]
path.write_text(text, encoding='utf-8')
