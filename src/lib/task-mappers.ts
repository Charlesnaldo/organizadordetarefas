import {
  Board,
  BoardPayload,
  BoardRecord,
  Task,
  TaskPayload,
  TaskRecord,
} from "@/lib/task-types";

export function mapBoardRecord(record: BoardRecord): Board {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? "",
  };
}

export function mapTaskRecord(record: TaskRecord): Task {
  return {
    id: record.id,
    boardId: record.board_id,
    title: record.title,
    description: record.description,
    priority: record.priority,
    createdDate: record.created_date,
    dueDate: record.due_date,
    assignee: record.assignee,
    tags: record.tags ?? [],
    column: record.column_id,
    effort: record.effort,
    attachmentName: record.attachment_name ?? undefined,
    attachmentUrl: record.attachment_url ?? undefined,
    imageUrl: record.image_url ?? undefined,
    checklist: record.checklist ?? [],
    comments: record.comments ?? [],
    position: record.position,
  };
}

export function mapBoardPayload(payload: BoardPayload) {
  return {
    name: payload.name,
    description: payload.description,
  };
}

export function mapTaskPayload(payload: TaskPayload) {
  return {
    board_id: payload.boardId,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    created_date: payload.createdDate,
    due_date: payload.dueDate,
    assignee: payload.assignee,
    tags: payload.tags,
    column_id: payload.column,
    effort: payload.effort,
    attachment_name: payload.attachmentName ?? null,
    attachment_url: payload.attachmentUrl ?? null,
    image_url: payload.imageUrl ?? null,
    checklist: payload.checklist,
    comments: payload.comments,
  };
}
