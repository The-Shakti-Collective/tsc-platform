import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import {
  COPILOT_STARTER_PROMPTS,
  fetchCopilotSuggestions,
  submitCopilotFeedback,
  submitCopilotQuery,
} from '../../lib/copilotApi';

function formatCell(value) {
  if (value == null) return '—';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
  }
  return String(value);
}

function DataTable({ table }) {
  if (!table?.columns?.length || !table?.rows?.length) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-bg-border)]">
      <table className="w-full text-left text-xs">
        <thead className="bg-[var(--token-surface-2)] text-[var(--color-text-muted)]">
          <tr>
            {table.columns.map((col) => (
              <th key={col.key} className="px-3 py-2 font-medium">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-t border-[var(--color-bg-border)] text-[var(--color-text-primary)]"
            >
              {table.columns.map((col) => (
                <td key={col.key} className="px-3 py-2">{formatCell(row[col.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MessageBubble({ role, children }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[92%] rounded-xl px-3 py-2 text-sm ${
          isUser
            ? 'bg-[var(--color-brand-primary)] text-white'
            : 'border border-[var(--color-bg-border)] bg-[var(--token-surface-2)] text-[var(--color-text-primary)]'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function ResponseCard({ response, onFollowUp, feedbackState, onFeedback }) {
  const intentLabel = response.intent?.replace(/_/g, ' ');

  return (
    <div className="space-y-3">
      <MessageBubble role="assistant">
        <p>{response.answer}</p>
        {intentLabel && response.intent !== 'fallback' && (
          <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
            Intent: {intentLabel}
          </p>
        )}
      </MessageBubble>

      {response.data?.table && <DataTable table={response.data.table} />}

      {response.sources?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {response.sources.map((source) => (
            <span
              key={`${source.label}-${source.route}`}
              className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-700 dark:text-violet-300"
            >
              {source.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onFeedback('up')}
          disabled={feedbackState != null}
          className="inline-flex items-center gap-1 rounded-md border border-[var(--color-bg-border)] px-2 py-1 text-[10px] text-[var(--color-text-muted)] hover:bg-[var(--token-surface-2)] disabled:opacity-50"
          aria-label="Helpful"
        >
          <ThumbsUp size={12} />
          {feedbackState === 'up' ? 'Thanks' : 'Helpful'}
        </button>
        <button
          type="button"
          onClick={() => onFeedback('down')}
          disabled={feedbackState != null}
          className="inline-flex items-center gap-1 rounded-md border border-[var(--color-bg-border)] px-2 py-1 text-[10px] text-[var(--color-text-muted)] hover:bg-[var(--token-surface-2)] disabled:opacity-50"
          aria-label="Not helpful"
        >
          <ThumbsDown size={12} />
          {feedbackState === 'down' ? 'Noted' : 'Not helpful'}
        </button>
        {response._source === 'mock' && (
          <span className="text-[10px] text-[var(--color-text-muted)]">mock data</span>
        )}
      </div>

      {response.suggestedFollowUps?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {response.suggestedFollowUps.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onFollowUp(prompt)}
              className="rounded-full border border-[var(--color-bg-border)] px-3 py-1 text-[11px] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CopilotPanel({ artistId = undefined, personId = undefined, compact = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(COPILOT_STARTER_PROMPTS);
  const [feedbackByTask, setFeedbackByTask] = useState({});

  const loadSuggestions = useCallback(async () => {
    const payload = await fetchCopilotSuggestions();
    const prompts = payload.items?.map((item) => item.prompt) ?? COPILOT_STARTER_PROMPTS;
    setSuggestions(prompts);
  }, []);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const runQuery = useCallback(
    async (message) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
      setInput('');
      setLoading(true);

      try {
        const response = await submitCopilotQuery({
          message: trimmed,
          artistId,
          personId,
        });
        setMessages((prev) => [...prev, { role: 'assistant', response }]);
      } finally {
        setLoading(false);
      }
    },
    [artistId, personId],
  );

  const handleFeedback = async (response, rating) => {
    const taskId = response.taskId;
    setFeedbackByTask((prev) => ({ ...prev, [taskId ?? response.sessionId]: rating }));
    await submitCopilotFeedback({
      taskId,
      message: response.message,
      intent: response.intent,
      rating,
    });
  };

  return (
    <section
      className={`rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] ${
        compact ? 'p-4' : 'p-5'
      } space-y-4`}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
          style={{ backgroundColor: 'rgba(139, 92, 246, 0.16)', color: '#a78bfa' }}
        >
          <Sparkles size={16} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Ecosystem Copilot
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Ask in natural language — pattern-matched intents, live API data
          </p>
        </div>
      </div>

      <div className={`space-y-3 ${compact ? 'max-h-72' : 'max-h-96'} overflow-y-auto pr-1`}>
        {messages.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">
            Try: &ldquo;Show artists at risk&rdquo; or pick a starter prompt below.
          </p>
        )}
        {messages.map((entry, index) =>
          entry.role === 'user' ? (
            <MessageBubble key={`u-${index}`} role="user">{entry.text}</MessageBubble>
          ) : (
            <ResponseCard
              key={`a-${index}`}
              response={entry.response}
              onFollowUp={runQuery}
              feedbackState={feedbackByTask[entry.response.taskId ?? entry.response.sessionId]}
              onFeedback={(rating) => handleFeedback(entry.response, rating)}
            />
          ),
        )}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <Spinner size={12} />
            Routing query…
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.slice(0, compact ? 3 : 5).map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => runQuery(prompt)}
            disabled={loading}
            className="rounded-full border border-[var(--color-bg-border)] px-3 py-1 text-[11px] text-[var(--color-text-primary)] hover:bg-[var(--token-surface-2)] disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          runQuery(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about artists, communities, opportunities…"
          disabled={loading}
          className="flex-1 rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand-primary)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <MessageSquare size={14} />
          Ask
        </button>
      </form>
    </section>
  );
}
