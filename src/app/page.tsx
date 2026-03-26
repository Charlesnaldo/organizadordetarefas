"use client";

import Image from "next/image";
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  Board,
  BoardPayload,
  ChecklistItem,
  ColumnId,
  CommentItem,
  Priority,
  Task,
  TaskPayload,
} from "@/lib/task-types";

type Column = {
  id: ColumnId;
  title: string;
  accent: string;
  surface: string;
};

type DragState = {
  taskId: number;
  columnId: ColumnId;
} | null;

type FormState = {
  title: string;
  details: string;
  createdDate: string;
  dueDate: string;
  attachmentName: string;
  attachmentUrl: string;
  imagePreview: string;
  priority: Priority;
  assignee: string;
  checklist: ChecklistItem[];
  comments: CommentItem[];
};

const columns: Column[] = [
  { id: "backlog", title: "Começar", accent: "from-sky-400 to-blue-500", surface: "from-white to-slate-50/96" },
  { id: "doing", title: "Em Progresso", accent: "from-violet-400 to-indigo-500", surface: "from-white to-indigo-50/70" },
  { id: "review", title: "Revisao", accent: "from-amber-400 to-orange-400", surface: "from-white to-amber-50/70" },
  { id: "done", title: "Concluido", accent: "from-emerald-400 to-teal-500", surface: "from-white to-emerald-50/70" },
];

const emptyFormState: FormState = {
  title: "",
  details: "",
  createdDate: "",
  dueDate: "",
  attachmentName: "",
  attachmentUrl: "",
  imagePreview: "",
  priority: "Media",
  assignee: "",
  checklist: [],
  comments: [],
};

const priorityTone: Record<Priority, string> = {
  Alta: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  Media: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Baixa: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

export default function Home() {  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [boardName, setBoardName] = useState("");
  const [boardDescription, setBoardDescription] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formState, setFormState] = useState<FormState>(emptyFormState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draggingTask, setDraggingTask] = useState<DragState>(null);
  const [dropTarget, setDropTarget] = useState<{ columnId: ColumnId; taskId: number | null } | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        void refreshBoards(data.session);
      } else {
        setLoading(false);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setTasks([]);
      setBoards([]);
      setSelectedBoardId(null);
      if (nextSession) {
        void refreshBoards(nextSession);
      } else {
        setLoading(false);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (session && selectedBoardId) {
      void refreshTasks(selectedBoardId, session);
    }
  }, [selectedBoardId, session]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalDone = useMemo(() => tasks.filter((task) => task.column === "done").length, [tasks]);
  const totalDoing = useMemo(() => tasks.filter((task) => task.column === "doing").length, [tasks]);
  const totalReview = useMemo(() => tasks.filter((task) => task.column === "review").length, [tasks]);

  async function authFetch<T>(input: string, init?: RequestInit): Promise<T> {
    if (!supabase) {
      throw new Error("Supabase nao configurado.");
    }

    const activeSession = session ?? (await supabase.auth.getSession()).data.session;
    if (!activeSession?.access_token) {
      throw new Error("Sessao expirada.");
    }

    const response = await fetch(input, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${activeSession.access_token}`,
      },
    });
    const data = (await response.json()) as { error?: string } & T;

    if (!response.ok) {
      throw new Error(data.error ?? "Falha na requisicao.");
    }

    return data as T;
  }

  async function refreshBoards(activeSession = session) {
    if (!activeSession) {
      return;
    }

    setLoading(true);
    try {
      const data = await authFetch<Board[]>("/api/boards");
      setBoards(data);
      setSelectedBoardId((current) => current ?? data[0]?.id ?? null);
      setError("");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Falha ao carregar quadros.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshTasks(boardId: number, activeSession = session) {
    if (!activeSession) {
      return;
    }

    setLoading(true);
    try {
      const data = await authFetch<Task[]>(`/api/tasks?boardId=${boardId}`);
      setTasks(data);
      setError("");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Falha ao carregar tarefas.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!supabase) {
      setError("Supabase nao configurado.");
      setLoading(false);
      return;
    }

    const operation = authMode === "signin"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { error: authError } = await operation;
    if (authError) {
      setError(authError.message);
    }
    setLoading(false);
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
  }

  async function handleCreateBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!boardName.trim()) {
      return;
    }

    try {
      const createdBoard = await authFetch<Board>("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: boardName.trim(), description: boardDescription.trim() } satisfies BoardPayload),
      });
      const nextBoards = [...boards, createdBoard];
      setBoards(nextBoards);
      setSelectedBoardId(createdBoard.id);
      setBoardName("");
      setBoardDescription("");
      setError("");
    } catch (boardError) {
      setError(boardError instanceof Error ? boardError.message : "Falha ao criar quadro.");
    }
  }

  function openCreateModal() {
    setEditingTaskId(null);
    setSelectedFile(null);
    setFormState(emptyFormState);
    setNewChecklistItem("");
    setNewComment("");
    setIsModalOpen(true);
  }

  function openEditModal(task: Task) {
    setEditingTaskId(task.id);
    setSelectedFile(null);
    setFormState({
      title: task.title,
      details: task.description,
      createdDate: task.createdDate,
      dueDate: task.dueDate,
      attachmentName: task.attachmentName ?? "",
      attachmentUrl: task.attachmentUrl ?? "",
      imagePreview: task.imageUrl ?? "",
      priority: task.priority,
      assignee: task.assignee,
      checklist: task.checklist,
      comments: task.comments,
    });
    setNewChecklistItem("");
    setNewComment("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setFormState(emptyFormState);
    setSelectedFile(null);
    setEditingTaskId(null);
    setIsSaving(false);
    setNewChecklistItem("");
    setNewComment("");
    setIsModalOpen(false);
  }

  function handleInputChange(key: keyof FormState, value: string | ChecklistItem[] | CommentItem[]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function addChecklistItem() {
    const text = newChecklistItem.trim();
    if (!text) {
      return;
    }
    handleInputChange("checklist", [...formState.checklist, { id: crypto.randomUUID(), text, done: false }]);
    setNewChecklistItem("");
  }

  function toggleChecklistItem(itemId: string) {
    handleInputChange("checklist", formState.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)));
  }

  function removeChecklistItem(itemId: string) {
    handleInputChange("checklist", formState.checklist.filter((item) => item.id !== itemId));
  }

  function addComment() {
    const text = newComment.trim();
    if (!text) {
      return;
    }
    handleInputChange("comments", [...formState.comments, { id: crypto.randomUUID(), text, createdAt: new Date().toISOString(), author: formState.assignee.trim().toUpperCase() || "VOCE" }]);
    setNewComment("");
  }

  function removeComment(commentId: string) {
    handleInputChange("comments", formState.comments.filter((comment) => comment.id !== commentId));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);

    if (!file) {
      setFormState((current) => ({ ...current, attachmentName: "", attachmentUrl: "", imagePreview: "" }));
      return;
    }

    setFormState((current) => ({ ...current, attachmentName: file.name, attachmentUrl: "" }));
    if (!file.type.startsWith("image/")) {
      setFormState((current) => ({ ...current, imagePreview: "" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormState((current) => ({ ...current, imagePreview: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBoardId) {
      setError("Crie ou selecione um quadro.");
      return;
    }

    const title = formState.title.trim();
    const details = formState.details.trim();
    const assignee = formState.assignee.trim().toUpperCase();
    if (!title || !formState.createdDate || !formState.dueDate || !assignee) {
      setError("Preencha nome, data, prazo e responsavel.");
      return;
    }

    setIsSaving(true);

    try {
      let attachmentName = formState.attachmentName;
      let attachmentUrl = formState.attachmentUrl;
      let imageUrl = formState.imagePreview;

      if (selectedFile) {
        const uploadedFile = await uploadFile(selectedFile);
        attachmentName = uploadedFile.name;
        attachmentUrl = uploadedFile.url;
        imageUrl = uploadedFile.isImage ? uploadedFile.url : "";
      }

      const currentTask = editingTaskId !== null ? tasks.find((task) => task.id === editingTaskId) : null;
      const payload: TaskPayload = {
        boardId: selectedBoardId,
        title,
        description: details || "Nova tarefa criada pelo modal da board.",
        priority: formState.priority,
        createdDate: formState.createdDate,
        dueDate: formState.dueDate,
        assignee,
        tags: currentTask?.tags ?? ["Nova"],
        column: currentTask?.column ?? "backlog",
        effort: currentTask?.effort ?? "45m",
        attachmentName: attachmentName || undefined,
        attachmentUrl: attachmentUrl || undefined,
        imageUrl: imageUrl || undefined,
        checklist: formState.checklist,
        comments: formState.comments,
      };

      if (editingTaskId === null) {
        const createdTask = await authFetch<Task>("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const nextTasks = [{ ...createdTask, position: 0 }, ...tasks].map((task, index) => ({ ...task, position: index }));
        setTasks(nextTasks);
        await persistBoardOrder(nextTasks, selectedBoardId, authFetch);
      } else {
        const updatedTask = await authFetch<Task>(`/api/tasks/${editingTaskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setTasks((current) => current.map((task) => (task.id === editingTaskId ? updatedTask : task)));
      }

      closeModal();
      setError("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar tarefa.");
      setIsSaving(false);
    }
  }

  async function handleDeleteTask(taskId: number) {
    if (!window.confirm("Apagar este card?")) {
      return;
    }
    const previousTasks = tasks;
    const nextTasks = tasks.filter((task) => task.id !== taskId).map((task, index) => ({ ...task, position: index }));
    setTasks(nextTasks);

    try {
      await authFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (selectedBoardId) {
        await persistBoardOrder(nextTasks, selectedBoardId, authFetch);
      }
      setError("");
    } catch (deleteError) {
      setTasks(previousTasks);
      setError(deleteError instanceof Error ? deleteError.message : "Falha ao apagar tarefa.");
    }
  }

  function handleDragStart(event: DragEvent<HTMLElement>, taskId: number, columnId: ColumnId) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(taskId));
    setDraggingTask({ taskId, columnId });
    setDropTarget({ columnId, taskId });
  }

  function handleDragEnd() {
    setDraggingTask(null);
    setDropTarget(null);
  }

  function handleColumnDragOver(event: DragEvent<HTMLElement>, columnId: ColumnId) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTarget((current) => current?.columnId === columnId && current.taskId === null ? current : { columnId, taskId: null });
  }

  function handleCardDragOver(event: DragEvent<HTMLElement>, columnId: ColumnId, taskId: number) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setDropTarget((current) => current?.columnId === columnId && current.taskId === taskId ? current : { columnId, taskId });
  }

  async function handleDrop(event: DragEvent<HTMLElement>, columnId: ColumnId, taskId: number | null) {
    event.preventDefault();
    event.stopPropagation();
    if (!selectedBoardId) {
      return;
    }

    const draggedTaskId = Number(event.dataTransfer.getData("text/plain")) || draggingTask?.taskId;
    if (!draggedTaskId) {
      return;
    }

    const nextTasks = moveTaskToPosition(tasks, draggedTaskId, columnId, taskId).map((task, index) => ({ ...task, position: index }));
    setTasks(nextTasks);
    setDraggingTask(null);
    setDropTarget(null);

    try {
      await persistBoardOrder(nextTasks, selectedBoardId, authFetch);
      setError("");
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : "Falha ao mover tarefa.");
      await refreshTasks(selectedBoardId);
    }
  }

  async function moveTask(taskId: number, direction: "left" | "right") {
    if (!selectedBoardId) {
      return;
    }
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    const columnIndex = columns.findIndex((column) => column.id === task.column);
    const nextIndex = direction === "right" ? columnIndex + 1 : columnIndex - 1;
    if (nextIndex < 0 || nextIndex >= columns.length) {
      return;
    }

    const nextTasks = moveTaskToPosition(tasks, taskId, columns[nextIndex].id, null).map((item, index) => ({ ...item, position: index }));
    setTasks(nextTasks);

    try {
      await persistBoardOrder(nextTasks, selectedBoardId, authFetch);
      setError("");
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : "Falha ao mover tarefa.");
      await refreshTasks(selectedBoardId);
    }
  }

  if (!supabase) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-900 sm:px-8 lg:px-10">
        <section className="relative mx-auto flex min-h-screen max-w-md items-center">
          <div className="glass-panel w-full rounded-[1rem] p-4 sm:p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">Configurar Supabase</div>
            <h1 className="mt-4 font-[family:var(--font-space-grotesk)] text-xl font-medium text-slate-900">Faltam variáveis públicas do Supabase.</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local para habilitar login e boards.</p>
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
        <section className="relative mx-auto flex min-h-screen max-w-md items-center">
          <div className="glass-panel w-full rounded-[1rem] p-4 sm:p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">Organizador</div>
            <h1 className="mt-4 font-[family:var(--font-space-grotesk)] text-4xl font-medium text-slate-900">Entre para gerenciar seus quadros.</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">Entre com seu email para acessar seus quadros e tarefas.</p>
            <form className="mt-6 space-y-4" onSubmit={(event) => void handleAuthSubmit(event)}>
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
              <button type="submit" className="w-full cursor-pointer rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(15,23,42,0.12)] hover:bg-slate-800">{loading ? "Processando..." : authMode === "signin" ? "Entrar" : "Criar conta"}</button>
            </form>
            <button type="button" onClick={() => setAuthMode((current) => current === "signin" ? "signup" : "signin")} className="mt-4 cursor-pointer text-sm text-slate-600">{authMode === "signin" ? "Criar conta" : "Já tenho conta"}</button>
            {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
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
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="glass-panel rounded-[1rem] p-4 sm:p-5">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-2xl">
                <span className="mb-4 inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">Organizador</span>
                <h1 className="max-w-3xl font-[family:var(--font-space-grotesk)] text-2xl font-medium tracking-tight text-slate-900 sm:text-3xl">Organize seus quadros, tarefas, checklist e comentários em um só lugar.</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-sm">Cada conta possui seus próprios quadros. Em cada card você pode adicionar anexos, checklist e comentários.</p>
              </div>
              <div className="rounded-[1rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Sessão</div>
                <div className="mt-3 break-all text-xs font-medium text-slate-100">{session.user.email}</div>
                <button type="button" onClick={() => void handleSignOut()} className="mt-4 cursor-pointer rounded-xl border border-slate-200 bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/18">Sair</button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard tone="blue" label="Em progresso" value={String(totalDoing).padStart(2, "0")} detail="Execucao ativa" />
              <StatCard tone="amber" label="Em revisao" value={String(totalReview).padStart(2, "0")} detail="Validacao pendente" />
              <StatCard tone="emerald" label="Concluidas" value={String(totalDone).padStart(2, "0")} detail="Fluxo fechado" />
            </div>
          </div>
          <aside className="glass-panel rounded-[1rem] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Menu lateral</div>
            <h2 className="mt-3 font-[family:var(--font-space-grotesk)] text-xl font-medium text-slate-900">Seus quadros</h2>
            <div className="mt-5 space-y-3">
              <select value={selectedBoardId ?? ""} onChange={(event) => setSelectedBoardId(Number(event.target.value) || null)} className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
                <option value="">Selecione um quadro</option>
                {boards.map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}
              </select>
              <form className="space-y-3" onSubmit={(event) => void handleCreateBoard(event)}>
                <input value={boardName} onChange={(event) => setBoardName(event.target.value)} placeholder="Novo quadro" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
                <textarea value={boardDescription} onChange={(event) => setBoardDescription(event.target.value)} rows={3} placeholder="Descrição curta" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
                <button type="submit" className="w-full cursor-pointer rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(15,23,42,0.12)] hover:bg-slate-800">Criar quadro</button>
              </form>
              <button type="button" onClick={openCreateModal} disabled={!selectedBoardId} className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Criar card no modal</button>
            </div>
          </aside>
        </div>
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {loading ? <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-8 text-center text-sm text-slate-600">Carregando...</div> : null}
        <section className="grid gap-5 xl:grid-cols-4">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.column === column.id);
            const isColumnActive = dropTarget?.columnId === column.id && dropTarget.taskId === null;
            return (
              <div key={column.id} onDragOver={(event) => handleColumnDragOver(event, column.id)} onDrop={(event) => void handleDrop(event, column.id, null)} className={`rounded-[1rem] border border-slate-200 bg-linear-to-b ${column.surface} p-4 shadow-none transition ${isColumnActive ? "ring-2 ring-slate-300" : ""}`}> 
                <div className="mb-4 flex items-center justify-between"><div><div className={`mb-2 h-2 w-14 rounded-full bg-linear-to-r ${column.accent}`} /><h3 className="font-[family:var(--font-space-grotesk)] text-sm font-medium text-slate-900">{column.title}</h3></div><span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">{columnTasks.length} cards</span></div>
                <div className="min-h-24 space-y-4">
                  {columnTasks.map((task) => {
                    const doneCount = task.checklist.filter((item) => item.done).length;
                    const isDragging = draggingTask?.taskId === task.id;
                    const isDropTarget = dropTarget?.columnId === column.id && dropTarget.taskId === task.id;
                    return <article key={task.id} draggable onDragStart={(event) => handleDragStart(event, task.id, task.column)} onDragEnd={handleDragEnd} onDragOver={(event) => handleCardDragOver(event, column.id, task.id)} onDrop={(event) => void handleDrop(event, column.id, task.id)} className={`task-card group cursor-pointer ${isDragging ? "opacity-60" : ""}`}>
                      {isDropTarget ? <div className="task-drop-indicator" /> : null}
                      <div className="task-card__glow" />
                      <div className="task-card__content cursor-pointer active:cursor-grabbing">
                        <div className="flex items-start justify-between gap-3"><div><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${priorityTone[task.priority]}`}>{task.priority}</span><h4 className="mt-3 text-sm font-medium text-slate-900">{task.title}</h4></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">{task.effort}</span></div>
                        <p className="mt-3 text-[13px] leading-5 text-slate-600">{task.description}</p>
                        {task.imageUrl ? <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"><Image src={task.imageUrl} alt={task.title} width={800} height={288} className="h-28 w-full object-cover" unoptimized /></div> : null}
                        <div className="mt-3 flex flex-wrap gap-1.5">{task.tags.map((tag) => <span key={tag} className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">{tag}</span>)}</div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500"><span>Criado {formatDateLabel(task.createdDate)}</span><span>Prazo {formatDateLabel(task.dueDate)}</span><span>Owner {task.assignee}</span><span>{doneCount}/{task.checklist.length} checklist</span></div>
                        <div className="mt-3 flex flex-wrap gap-1.5"><button type="button" onClick={() => void moveTask(task.id, "left")} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Voltar</button><button type="button" onClick={() => void moveTask(task.id, "right")} className="cursor-pointer rounded-xl border border-blue-300/30 bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-100">Avancar</button><button type="button" onClick={() => openEditModal(task)} className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100">Editar</button>{task.attachmentUrl ? <a href={task.attachmentUrl} target="_blank" rel="noreferrer" download className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100">Arquivo</a> : null}<button type="button" onClick={() => void handleDeleteTask(task.id)} className="cursor-pointer rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 transition hover:bg-rose-100" aria-label={`Apagar ${task.title}`}><TrashIcon /></button></div>
                      </div>
                    </article>;
                  })}
                  {!loading && columnTasks.length === 0 ? <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Solte um card aqui</div> : null}
                </div>
              </div>
            );
          })}
        </section>
      </section>
      {isModalOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-white px-4 py-8 backdrop-blur-[2px]"><div className="glass-panel w-full max-w-3xl rounded-[1rem] p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{editingTaskId === null ? "Novo card" : "Editar card"}</div><h2 className="mt-3 font-[family:var(--font-space-grotesk)] text-xl font-medium text-slate-900">{editingTaskId === null ? "Criar tarefa" : "Atualizar tarefa"}</h2></div><button type="button" onClick={closeModal} className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50">Fechar</button></div><form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}><label className="block sm:col-span-2"><span className="mb-2 block text-sm text-slate-600">Nome</span><input value={formState.title} onChange={(event) => handleInputChange("title", event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" /></label><label className="block"><span className="mb-2 block text-sm text-slate-600">Data</span><input type="date" value={formState.createdDate} onChange={(event) => handleInputChange("createdDate", event.target.value)} className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" /></label><label className="block"><span className="mb-2 block text-sm text-slate-600">Prazo</span><input type="date" value={formState.dueDate} onChange={(event) => handleInputChange("dueDate", event.target.value)} className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" /></label><label className="block"><span className="mb-2 block text-sm text-slate-600">Prioridade</span><select value={formState.priority} onChange={(event) => handleInputChange("priority", event.target.value as Priority)} className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baixa">Baixa</option></select></label><label className="block"><span className="mb-2 block text-sm text-slate-600">Responsavel</span><input value={formState.assignee} onChange={(event) => handleInputChange("assignee", event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" /></label><label className="block sm:col-span-2"><span className="mb-2 block text-sm text-slate-600">Arquivo ou imagem</span><input type="file" accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileChange} className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700" /></label>{formState.attachmentName ? <div className="sm:col-span-2 text-sm text-slate-500">Arquivo atual: {formState.attachmentName}</div> : null}{formState.imagePreview ? <div className="sm:col-span-2 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100"><Image src={formState.imagePreview} alt="Preview do arquivo" width={1200} height={520} className="h-52 w-full object-cover" unoptimized /></div> : null}<label className="block sm:col-span-2"><span className="mb-2 block text-sm text-slate-600">Detalhes</span><textarea value={formState.details} onChange={(event) => handleInputChange("details", event.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none" /></label><div className="sm:col-span-2 grid gap-4 lg:grid-cols-2"><div className="rounded-[1rem] border border-slate-200 bg-white p-3 "><div className="text-xs font-medium text-slate-700">Checklist</div><div className="mt-3 flex gap-2"><input value={newChecklistItem} onChange={(event) => setNewChecklistItem(event.target.value)} placeholder="Novo item" className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none" /><button type="button" onClick={addChecklistItem} className="cursor-pointer rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-700">Adicionar</button></div><div className="mt-3 space-y-2">{formState.checklist.map((item) => <div key={item.id} className="flex items-center gap-2 text-sm text-slate-600"><button type="button" onClick={() => toggleChecklistItem(item.id)} className={`h-5 w-5 rounded border ${item.done ? "border-emerald-300 bg-emerald-300/30" : "border-slate-300 bg-white"}`} /><span className={item.done ? "line-through text-slate-500" : ""}>{item.text}</span><button type="button" onClick={() => removeChecklistItem(item.id)} className="ml-auto text-xs text-rose-600">remover</button></div>)}</div></div><div className="rounded-[1rem] border border-slate-200 bg-white p-3 "><div className="text-xs font-medium text-slate-700">Comentarios</div><div className="mt-3 flex gap-2"><input value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Novo comentario" className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none" /><button type="button" onClick={addComment} className="cursor-pointer rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-700">Adicionar</button></div><div className="mt-3 space-y-3">{formState.comments.map((comment) => <div key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><div className="flex items-center justify-between text-xs text-slate-500"><span>{comment.author}</span><span>{new Date(comment.createdAt).toLocaleDateString("pt-BR")}</span></div><p className="mt-2">{comment.text}</p><button type="button" onClick={() => removeComment(comment.id)} className="mt-2 text-xs text-rose-600">remover</button></div>)}</div></div></div><div className="sm:col-span-2 flex gap-3"><button type="submit" disabled={isSaving} className="cursor-pointer rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(15,23,42,0.12)] hover:bg-slate-800 disabled:opacity-70">{isSaving ? "Salvando..." : editingTaskId === null ? "Salvar card" : "Atualizar card"}</button><button type="button" onClick={closeModal} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button></div></form></div></div> : null}
    </main>
  );
}

async function uploadFile(file: File) {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/uploads", { method: "POST", body });
  const data = (await response.json()) as { name: string; url: string; isImage: boolean; error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Falha ao enviar arquivo.");
  }
  return data;
}

async function persistBoardOrder(tasks: Task[], boardId: number, authFetch: <T>(input: string, init?: RequestInit) => Promise<T>) {
  await authFetch<{ ok: true }>("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ boardId, tasks: tasks.map((task, index) => ({ id: task.id, column: task.column, position: index })) }) });
}

function moveTaskToPosition(current: Task[], taskId: number, destinationColumn: ColumnId, beforeTaskId: number | null) {
  const task = current.find((item) => item.id === taskId);
  if (!task) {
    return current;
  }
  const remaining = current.filter((item) => item.id !== taskId);
  const movedTask = { ...task, column: destinationColumn };
  const targetIndex = beforeTaskId === null ? -1 : remaining.findIndex((item) => item.id === beforeTaskId);
  if (targetIndex === -1) {
    const lastDestinationIndex = findLastIndex(remaining, (item) => item.column === destinationColumn);
    if (lastDestinationIndex === -1) {
      const insertIndex = columns.findIndex((column) => column.id === destinationColumn);
      const firstDifferentColumnIndex = remaining.findIndex((item) => columns.findIndex((column) => column.id === item.column) > insertIndex);
      if (firstDifferentColumnIndex === -1) {
        return [...remaining, movedTask];
      }
      return [...remaining.slice(0, firstDifferentColumnIndex), movedTask, ...remaining.slice(firstDifferentColumnIndex)];
    }
    return [...remaining.slice(0, lastDestinationIndex + 1), movedTask, ...remaining.slice(lastDestinationIndex + 1)];
  }
  return [...remaining.slice(0, targetIndex), movedTask, ...remaining.slice(targetIndex)];
}

function findLastIndex<T>(items: T[], predicate: (item: T) => boolean) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index])) {
      return index;
    }
  }
  return -1;
}

function formatDateLabel(value: string) {
  if (value.includes("/")) {
    return value;
  }
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}/${month}/${year}`;
}

function StatCard({
  label,
  value,
  detail,
  tone = "blue",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "blue" | "amber" | "emerald";
}) {
  const toneClass = {
    blue: "from-blue-50 to-sky-50 border-blue-100",
    amber: "from-amber-50 to-orange-50 border-amber-100",
    emerald: "from-emerald-50 to-teal-50 border-emerald-100",
  }[tone];

  return (
    <div className={`rounded-[1rem] border bg-linear-to-b ${toneClass} p-4`}>
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-3 font-[family:var(--font-space-grotesk)] text-3xl font-medium text-slate-900">
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-600">{detail}</div>
    </div>
  );
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M3 6h18" /><path d="M8 6V4.8c0-.66.54-1.2 1.2-1.2h5.6c.66 0 1.2.54 1.2 1.2V6" /><path d="M6.5 6l.9 13.1c.05.73.66 1.29 1.39 1.29h6.42c.73 0 1.34-.56 1.39-1.29L17.5 6" /><path d="M10 10.5v5.5" /><path d="M14 10.5v5.5" /></svg>;
}






