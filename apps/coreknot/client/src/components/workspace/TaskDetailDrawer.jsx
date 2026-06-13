import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, X } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import {
  TASK_BOARD_COLUMNS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  addChecklistItem,
  addTaskComment,
  fetchTask,
  patchChecklistItem,
  patchTask,
} from '../../lib/taskApi';

export function TaskDetailDrawer({ workspaceSlug, taskId, onClose }) {
  const queryClient = useQueryClient();
  const [commentBody, setCommentBody] = useState('');
  const [checklistTitle, setChecklistTitle] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['workspace', workspaceSlug, 'task', taskId],
    queryFn: () => fetchTask(workspaceSlug, taskId),
    enabled: Boolean(workspaceSlug && taskId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'task', taskId] });
    queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'tasks'] });
  };

  const patchMutation = useMutation({
    mutationFn: (payload) => patchTask(workspaceSlug, taskId, payload),
    onSuccess: invalidate,
  });

  const commentMutation = useMutation({
    mutationFn: () => addTaskComment(workspaceSlug, taskId, { body: commentBody.trim() }),
    onSuccess: () => {
      setCommentBody('');
      invalidate();
    },
  });

  const checklistMutation = useMutation({
    mutationFn: () => addChecklistItem(workspaceSlug, taskId, { title: checklistTitle.trim() }),
    onSuccess: () => {
      setChecklistTitle('');
      invalidate();
    },
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: ({ itemId, isDone }) =>
      patchChecklistItem(workspaceSlug, taskId, itemId, { isDone }),
    onSuccess: invalidate,
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close task detail"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-md h-full overflow-y-auto bg-[var(--color-bg-surface)] border-l border-[var(--color-bg-border)] shadow-xl">
        <div className="sticky top-0 flex items-center justify-between gap-2 border-b border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Task detail</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-[var(--color-bg-muted)]"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading || !task ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="p-4 space-y-6">
            <section className="space-y-3">
              <input
                type="text"
                value={task.title}
                onChange={(e) => patchMutation.mutate({ title: e.target.value })}
                className="w-full text-base font-semibold bg-transparent border-b border-transparent hover:border-[var(--color-bg-border)] focus:border-[var(--color-brand-primary)] outline-none"
              />
              <textarea
                value={task.description ?? ''}
                onChange={(e) => patchMutation.mutate({ description: e.target.value || null })}
                placeholder="Add description…"
                rows={3}
                className="w-full rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-[var(--color-text-muted)]">
                  Status
                  <select
                    value={task.status}
                    onChange={(e) => patchMutation.mutate({ status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-2 py-1.5 text-sm"
                  >
                    {TASK_BOARD_COLUMNS.map((s) => (
                      <option key={s} value={s}>
                        {TASK_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-[var(--color-text-muted)]">
                  Priority
                  <select
                    value={task.priority}
                    onChange={(e) => patchMutation.mutate({ priority: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-2 py-1.5 text-sm"
                  >
                    {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {task.projectName && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Project: {task.projectName}
                </p>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Assignees
              </h3>
              {task.assignees?.length ? (
                <ul className="space-y-1">
                  {task.assignees.map((a) => (
                    <li key={a.personId} className="text-sm">
                      {a.displayName}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)]">Unassigned</p>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Checklist
              </h3>
              <ul className="space-y-1">
                {(task.checklist ?? []).map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.isDone}
                      onChange={() =>
                        toggleChecklistMutation.mutate({
                          itemId: item.id,
                          isDone: !item.isDone,
                        })
                      }
                    />
                    <span className={item.isDone ? 'line-through text-[var(--color-text-muted)]' : ''}>
                      {item.title}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={checklistTitle}
                  onChange={(e) => setChecklistTitle(e.target.value)}
                  placeholder="New checklist item"
                  className="flex-1 rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => checklistMutation.mutate()}
                  disabled={checklistMutation.isPending || !checklistTitle.trim()}
                  className="rounded-lg border border-[var(--color-bg-border)] px-2 py-1.5 text-xs"
                >
                  Add
                </button>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] flex items-center gap-1">
                <MessageSquare size={12} />
                Comments
              </h3>
              <ul className="space-y-3 max-h-48 overflow-y-auto">
                {(task.comments ?? []).map((comment) => (
                  <li key={comment.id} className="text-sm space-y-0.5">
                    <p className="font-medium text-xs">{comment.authorName}</p>
                    <p className="text-[var(--color-text-secondary)]">{comment.body}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => commentMutation.mutate()}
                  disabled={commentMutation.isPending || !commentBody.trim()}
                  className="rounded-lg bg-[var(--color-brand-primary)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  Post
                </button>
              </div>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}

export default TaskDetailDrawer;
