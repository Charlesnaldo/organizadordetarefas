export type ColumnId = "backlog" | "doing" | "review" | "done";
export type Priority = "Alta" | "Media" | "Baixa";

export type Board = {
  id: number;
  name: string;
  description: string;
};

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type CommentItem = {
  id: string;
  text: string;
  createdAt: string;
  author: string;
};

export type Task = {
  id: number;
  boardId: number;
  title: string;
  description: string;
  priority: Priority;
  createdDate: string;
  dueDate: string;
  assignee: string;
  tags: string[];
  column: ColumnId;
  effort: string;
  attachmentName?: string;
  attachmentUrl?: string;
  imageUrl?: string;
  checklist: ChecklistItem[];
  comments: CommentItem[];
  position: number;
};

export type BoardRecord = {
  id: number;
  name: string;
  description: string | null;
};

export type TaskRecord = {
  id: number;
  board_id: number;
  title: string;
  description: string;
  priority: Priority;
  created_date: string;
  due_date: string;
  assignee: string;
  tags: string[] | null;
  column_id: ColumnId;
  effort: string;
  attachment_name: string | null;
  attachment_url: string | null;
  image_url: string | null;
  checklist: ChecklistItem[] | null;
  comments: CommentItem[] | null;
  position: number;
};

export type BoardPayload = {
  name: string;
  description: string;
};

export type TaskPayload = {
  boardId: number;
  title: string;
  description: string;
  priority: Priority;
  createdDate: string;
  dueDate: string;
  assignee: string;
  tags: string[];
  column: ColumnId;
  effort: string;
  attachmentName?: string;
  attachmentUrl?: string;
  imageUrl?: string;
  checklist: ChecklistItem[];
  comments: CommentItem[];
};
