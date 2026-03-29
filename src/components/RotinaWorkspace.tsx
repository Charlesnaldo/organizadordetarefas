"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Board, BoardPayload, ChecklistItem, ColumnId, CommentItem, Priority, Task, TaskPayload } from "@/lib/task-types";

type Column = { id: ColumnId; title: string; accent: string; surface: string };
type DragState = { taskId: number; columnId: ColumnId } | null;
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
  { id: "review", title: "Revisão", accent: "from-amber-400 to-orange-400", surface: "from-white to-amber-50/70" },
  { id: "done", title: "Concluído", accent: "from-emerald-400 to-teal-500", surface: "from-white to-emerald-50/70" },
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

export default function RotinaWorkspace({ session }: { session: Session }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
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

  useEffect(() => {
    void refreshBoards();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedBoardId) {
      void refreshTasks(selectedBoardId);
    }
  }, [selectedBoardId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function authFetch<T>(input: string, init?: RequestInit): Promise<T> {
    if (!supabase) {
      throw new Error("Supabase nao configurado.");
    }

    const activeSession = session ?? (await supabase.auth.getSession()).data.session;
    if (!activeSession?.access_token) {
      throw new Error("Sessão expirada.");
    }

    const response = await fetch(input, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${activeSession.access_token}`,
      },
    });
    const data = await response.json() as T & { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "Falha na requisicao.");
    }
    return data;
  }

  async function refreshBoards() {
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

  async function refreshTasks(boardId: number) {
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
      setBoards((current) => [...current, createdBoard]);
      setSelectedBoardId(createdBoard.id);
      setBoardName("");
      setBoardDescription("");
    } catch (boardError) {
      setError(boardError instanceof Error ? boardError.message : "Falha ao criar quadro.");
    }
  }

  function openCreateModal() {
    setEditingTaskId(null);
    setSelectedFile(null);
    setFormState(emptyFormState);
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
    setIsModalOpen(true);
  }

  function closeModal() {
    setFormState(emptyFormState);
    setSelectedFile(null);
    setEditingTaskId(null);
    setIsSaving(false);
    setIsModalOpen(false);
  }

  function handleInputChange(key: keyof FormState, value: string | ChecklistItem[] | CommentItem[]) {
    setFormState((current) => ({ ...current, [key]: value }));
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
        const preview = reader.result;
        setFormState((current) => ({ ...current, imagePreview: preview }));
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
        description: formState.details.trim() || "Nova tarefa.",
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
        toast.success("Tarefa criada!");
      } else {
        const updatedTask = await authFetch<Task>(`/api/tasks/${editingTaskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setTasks((current) => current.map((task) => task.id === editingTaskId ? updatedTask : task));
        toast.success("Tarefa atualizada!");
      }

      closeModal();
      setError("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar tarefa.");
      setIsSaving(false);
      toast.error("Erro ao salvar tarefa.");
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
      toast.success("Tarefa removida.");
    } catch (deleteError) {
      setTasks(previousTasks);
      setError(deleteError instanceof Error ? deleteError.message : "Falha ao apagar tarefa.");
      toast.error("Erro ao remover tarefa.");
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
    setDropTarget({ columnId, taskId: null });
  }

  function handleCardDragOver(event: DragEvent<HTMLElement>, columnId: ColumnId, taskId: number) {
    event.preventDefault();
    event.stopPropagation();
    setDropTarget({ columnId, taskId });
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
    } catch {
      await refreshTasks(selectedBoardId);
    }
  }

  const totalDoing = tasks.filter((task) => task.column === "doing").length;
  const totalReview = tasks.filter((task) => task.column === "review").length;
  const totalDone = tasks.filter((task) => task.column === "done").length;

  return (
    <>
      <section className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
        <aside className="glass-panel rounded-[1.4rem] p-4 sm:p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Rotina</div>
          <h2 className="mt-3 font-[family:var(--font-space-grotesk)] text-2xl font-medium text-slate-900">Seus quadros</h2>
          <div className="mt-5 space-y-3">
            <select value={selectedBoardId ?? ""} onChange={(event) => setSelectedBoardId(Number(event.target.value) || null)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
              <option value="">Selecione um quadro</option>
              {boards.map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}
            </select>
            <form className="space-y-3" onSubmit={(event) => void handleCreateBoard(event)}>
              <input value={boardName} onChange={(event) => setBoardName(event.target.value)} placeholder="Novo quadro" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
              <textarea value={boardDescription} onChange={(event) => setBoardDescription(event.target.value)} rows={3} placeholder="Descrição curta" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
              <button type="submit" className="w-full cursor-pointer rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Criar quadro</button>
            </form>
            <button type="button" onClick={openCreateModal} disabled={!selectedBoardId} className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs font-medium text-slate-700 disabled:opacity-50">Criar card</button>
          </div>
        </aside>
        <div className="glass-panel rounded-[1.4rem] p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard tone="blue" label="Em progresso" value={String(totalDoing).padStart(2, "0")} detail="Execucao ativa" />
            <StatCard tone="amber" label="Em revisão" value={String(totalReview).padStart(2, "0")} detail="Validação pendente" />
            <StatCard tone="emerald" label="Concluidas" value={String(totalDone).padStart(2, "0")} detail="Fluxo fechado" />
          </div>
          {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        </div>
      </section>

      {loading ? <div className="glass-panel rounded-[1.4rem] p-6 text-center text-sm text-slate-500">Carregando...</div> : null}

      <section className="grid gap-5 xl:grid-cols-4">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.column === column.id);
          const isColumnActive = dropTarget?.columnId === column.id && dropTarget.taskId === null;
          return (
            <div key={column.id} onDragOver={(event) => handleColumnDragOver(event, column.id)} onDrop={(event) => void handleDrop(event, column.id, null)} className={`rounded-[1rem] border border-slate-200 bg-linear-to-b ${column.surface} p-4 transition ${isColumnActive ? "ring-2 ring-slate-300" : ""}`}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className={`mb-2 h-2 w-14 rounded-full bg-linear-to-r ${column.accent}`} />
                  <h3 className="font-[family:var(--font-space-grotesk)] text-sm font-medium text-slate-900">{column.title}</h3>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">{columnTasks.length} cards</span>
              </div>
              <div className="space-y-4">
                {columnTasks.map((task) => {
                  const isDragging = draggingTask?.taskId === task.id;
                  const doneCount = task.checklist.filter((item) => item.done).length;
                  return (
                    <article key={task.id} draggable onDragStart={(event) => handleDragStart(event, task.id, task.column)} onDragEnd={handleDragEnd} onDragOver={(event) => handleCardDragOver(event, column.id, task.id)} onDrop={(event) => void handleDrop(event, column.id, task.id)} className={`task-card ${isDragging ? "opacity-60" : ""}`}>
                      <div className="task-card__content">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${priorityTone[task.priority]}`}>{task.priority}</span>
                            <h4 className="mt-3 text-sm font-medium text-slate-900">{task.title}</h4>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">{task.effort}</span>
                        </div>
                        <p className="mt-3 text-[13px] leading-5 text-slate-600">{task.description}</p>
                        {task.imageUrl ? <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"><Image src={task.imageUrl} alt={task.title} width={800} height={288} className="h-28 w-full object-cover" unoptimized /></div> : null}
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500"><span>Criado {formatDateLabel(task.createdDate)}</span><span>Prazo {formatDateLabel(task.dueDate)}</span><span>Owner {task.assignee}</span><span>{doneCount}/{task.checklist.length} checklist</span></div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <button type="button" onClick={() => openEditModal(task)} className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700" aria-label={`Editar tarefa: ${task.title}`}>Editar</button>
                          {task.attachmentUrl ? <a href={task.attachmentUrl} target="_blank" rel="noreferrer" className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700" aria-label={`Ver anexo da tarefa: ${task.title}`}>Arquivo</a> : null}
                          <button type="button" onClick={() => void handleDeleteTask(task.id)} className="cursor-pointer rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700" aria-label={`Apagar tarefa: ${task.title}`}>Apagar</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {!loading && columnTasks.length === 0 ? (
                  <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center">
                    <p className="text-xs font-medium text-slate-400">Nenhuma tarefa aqui.</p>
                    <p className="mt-1 text-[11px] text-slate-300 italic">Arraste um card ou crie um novo.</p>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </section>

      {isModalOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 px-4 py-8 backdrop-blur-[2px]"><div className="glass-panel w-full max-w-3xl rounded-[1rem] p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{editingTaskId === null ? "Novo card" : "Editar card"}</div><h2 className="mt-3 font-[family:var(--font-space-grotesk)] text-xl font-medium text-slate-900">{editingTaskId === null ? "Criar tarefa" : "Atualizar tarefa"}</h2></div><button type="button" onClick={closeModal} className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">Fechar</button></div><form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}><label className="block sm:col-span-2"><span className="mb-2 block text-sm text-slate-600">Nome</span><input value={formState.title} onChange={(event) => handleInputChange("title", event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" /></label><label className="block"><span className="mb-2 block text-sm text-slate-600">Data</span><input type="date" value={formState.createdDate} onChange={(event) => handleInputChange("createdDate", event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" /></label><label className="block"><span className="mb-2 block text-sm text-slate-600">Prazo</span><input type="date" value={formState.dueDate} onChange={(event) => handleInputChange("dueDate", event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" /></label><label className="block"><span className="mb-2 block text-sm text-slate-600">Prioridade</span><select value={formState.priority} onChange={(event) => handleInputChange("priority", event.target.value as Priority)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baixa">Baixa</option></select></label><label className="block"><span className="mb-2 block text-sm text-slate-600">Responsavel</span><input value={formState.assignee} onChange={(event) => handleInputChange("assignee", event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" /></label><label className="block sm:col-span-2"><span className="mb-2 block text-sm text-slate-600">Arquivo ou imagem</span><input type="file" accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" /></label>{formState.imagePreview ? <div className="sm:col-span-2 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100"><Image src={formState.imagePreview} alt="Preview do arquivo" width={1200} height={520} className="h-52 w-full object-cover" unoptimized /></div> : null}<label className="block sm:col-span-2"><span className="mb-2 block text-sm text-slate-600">Detalhes</span><textarea value={formState.details} onChange={(event) => handleInputChange("details", event.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" /></label><div className="sm:col-span-2 flex gap-3"><button type="submit" disabled={isSaving} className="cursor-pointer rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70">{isSaving ? "Salvando..." : editingTaskId === null ? "Salvar card" : "Atualizar card"}</button><button type="button" onClick={closeModal} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700">Cancelar</button></div></form></div></div> : null}
    </>
  );
}

async function uploadFile(file: File) {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/uploads", { method: "POST", body });
  const data = await response.json() as { name: string; url: string; isImage: boolean; error?: string };
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
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}/${month}/${year}`;
}

function StatCard({ label, value, detail, tone = "blue" }: { label: string; value: string; detail: string; tone?: "blue" | "amber" | "emerald"; }) {
  const toneClass = { blue: "from-blue-50 to-sky-50 border-blue-100", amber: "from-amber-50 to-orange-50 border-amber-100", emerald: "from-emerald-50 to-teal-50 border-emerald-100" }[tone];
  return <div className={`rounded-[1rem] border bg-linear-to-b ${toneClass} p-4`}><div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</div><div className="mt-3 font-[family:var(--font-space-grotesk)] text-3xl font-medium text-slate-900">{value}</div><div className="mt-1 text-sm text-slate-600">{detail}</div></div>;
}



