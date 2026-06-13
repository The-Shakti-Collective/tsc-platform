import React, { useCallback, useEffect, useState } from 'react';
import { Bot, Play, RefreshCw, Zap } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import {
  AUTOMATION_TRIGGER_LABELS,
  evaluateAutomationAll,
  fetchAutomationRules,
  fetchRecentAutomationRuns,
} from '../../lib/automationV2Api';

function TriggerBadge({ triggerType }) {
  const label = AUTOMATION_TRIGGER_LABELS[triggerType] ?? triggerType;
  return (
    <span className="inline-flex items-center rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300">
      {label}
    </span>
  );
}

function RunRow({ run }) {
  const stepCount = Array.isArray(run.steps) ? run.steps.length : 0;
  return (
    <div className="rounded-lg border border-[var(--color-bg-border)] p-3 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
            {run.ruleName ?? run.ruleId ?? 'Automation run'}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {run.status} · {stepCount} steps
          </p>
        </div>
        {run.triggerType && <TriggerBadge triggerType={run.triggerType} />}
      </div>
      {Array.isArray(run.steps) && run.steps.length > 0 && (
        <ul className="text-[11px] text-[var(--color-text-muted)] space-y-0.5 pt-1">
          {run.steps.slice(0, 3).map((step, index) => (
            <li key={`${run.id}-${index}`}>• {step.summary ?? step.step}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AutomationRulesPanel() {
  const [rules, setRules] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluateResult, setEvaluateResult] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rulesPayload, runsPayload] = await Promise.all([
        fetchAutomationRules({ status: 'active' }),
        fetchRecentAutomationRuns(8),
      ]);
      setRules(rulesPayload.items ?? []);
      setRuns(runsPayload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load automation data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleEvaluate = async () => {
    setEvaluating(true);
    setError(null);
    try {
      const result = await evaluateAutomationAll();
      setEvaluateResult(result);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluate failed');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.16)', color: '#a78bfa' }}
          >
            <Bot size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Automation Engine V2
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Signal rules on health, churn, deals, superfans — cron stub via evaluate
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-bg-border)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--token-surface-2)] disabled:opacity-50"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleEvaluate}
            disabled={evaluating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {evaluating ? <Spinner size={12} /> : <Play size={12} />}
            Run evaluate
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {evaluateResult && (
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/8 p-3 text-xs text-[var(--color-text-primary)]">
          <div className="flex items-center gap-1.5 font-medium">
            <Zap size={12} className="text-violet-500" />
            Evaluate complete — {evaluateResult.fired ?? 0} fired / {evaluateResult.matches ?? 0} matches
          </div>
          <p className="text-[var(--color-text-muted)] mt-1">
            Scope: {evaluateResult.scope ?? 'platform'} · checked {evaluateResult.rulesChecked ?? 0} trigger types
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Active rules
            </h3>
            {rules.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No active rules.</p>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-lg border border-[var(--color-bg-border)] p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{rule.name}</p>
                    <TriggerBadge triggerType={rule.triggerType ?? rule.workflowType} />
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {(rule.steps ?? []).length} action steps · {rule.status}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Recent runs
            </h3>
            {runs.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No runs yet — try Run evaluate.</p>
            ) : (
              runs.map((run) => <RunRow key={run.id} run={run} />)
            )}
          </div>
        </div>
      )}
    </section>
  );
}
