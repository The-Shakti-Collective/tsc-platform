import React, { useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Plus } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { TaskDetailDrawer } from '../../components/workspace/TaskDetailDrawer';
import {
  TASK_BOARD_COLUMNS,
  TASK_PRIORITY_COLORS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  createTask,
  fetchTasks,
  patchTask,
} from '../../lib/taskApi';

function TaskCard({ task, onSelect, onStatusChange }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      className={`w-full text-left rounded-lg border p-3 space-y-2 bg-[var(--color-bg-surface)] hover:shadow-sm transition-shadow ${TASK_STATUS_COLORS[task.status] ?? ''}`}
    >
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{task.title}</p>
      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide">
        <span className={TASK_PRIORITY_COLORS[task.priority] ?? ''}>{task.priority}</span>
        {task.projectName && (
          <span className="text-[var(--color-text-muted)]">{task.projectName}</span>
        )}
        {task.dueAt && (
          <span className="text-[var(--color-text-muted)]">
            Due {new Date(task.dueAt).toLocaleDateString()}
          </span>
        )}
      </div>
      {task.checklistTotal > 0 && (
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Checklist {task.checklistDone}/{task.checklistTotal}
        </p>
      )}
      <select
        value={task.status}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          e.stopPropagation();
          onStatusChange(task.id, e.target.value);
        }}
        className="w-full rounded border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-2 py-1 text-xs"
      >
        {TASK_BOARD_COLUMNS.map((status) => (
          <option key={status} value={status}>
            {TASK_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </button>
  );
}

export default function TaskBoardPage() {
  const { workspace } = useOutletContext();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const projectFilter = searchParams.get('project') ?? undefined;
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['workspace', workspace?.slug, 'tasks', 'board', projectFilter],
    queryFn: () =>
      fetchTasks(workspace.slug, {
        view: 'board',
        projectSlug: projectFilter,
      }),
    enabled: Boolean(workspace?.slug),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createTask(workspace.slug, {
        title: newTitle.trim(),
        projectSlug: projectFilter,
        metadata: {},
      }),
    onSuccess: () => {
      setNewTitle('');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace.slug, 'tasks'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }) => patchTask(workspace.slug, taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace.slug, 'tasks'] });
    },
  });

  const columns = data?.columns ?? {};
  const columnKeys = TASK_BOARD_COLUMNS;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <CheckSquare size={20} />
            Tasks
            {projectFilter && (
              <span className="text-sm font-normal text-[var(--color-text-muted)]">
                · {projectFilter}
              </span>
            )}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Kanban board — drag-free status updates via column or task detail.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-bg-border)] px-3 py-2 text-sm font-medium"
        >
          <Plus size={14} />
          New task
        </button>
      </header>

      {showForm && (
        <div className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-4 flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm"
            placeholder="Task title"
          />
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !newTitle.trim()}
            className="rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Create
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {columnKeys.map((status) => (
            <div key={status} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] px-1">
                {TASK_STATUS_LABELS[status]} ({(columns[status] ?? []).length})
              </h2>
              <div className="space-y-2 min-h-[120px]">
                {(columns[status] ?? []).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelect={(t) => setSelectedTaskId(t.id)}
                    onStatusChange={(taskId, nextStatus) =>
                      statusMutation.mutate({ taskId, status: nextStatus })
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTaskId && (
        <TaskDetailDrawer
          workspaceSlug={workspace.slug}
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
