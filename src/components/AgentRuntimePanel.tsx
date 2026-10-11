import React, { useEffect, useState } from 'react';
import { AGENT_CATALOG } from '../agents/agentCatalog';
import { fetchAgentStatus, runAgentTask, runWorkflowTask } from '../agents/agentClient';
import type { AgentRunResult, AgentStatusResponse } from '../agents/agentCatalog';

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  ready: { text: 'Ready', cls: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/40' },
  integration_required: { text: 'Integration required', cls: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40' },
  llm_required: { text: 'LLM not configured', cls: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40' },
  completed: { text: 'Completed', cls: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/40' },
  completed_demo: { text: 'Completed (demo)', cls: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40' },
  failed: { text: 'Failed', cls: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40' },
  unauthenticated: { text: 'Sign-in required', cls: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40' },
  awaiting_approval: { text: 'Awaiting approval', cls: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/40' },
};

function Badge({ status }: { status: string }) {
  const b = STATUS_LABEL[status] || { text: status, cls: 'bg-gray-500/20 text-gray-600 dark:text-gray-300 border-gray-400/40' };
  return <span className={`text-xs px-2 py-0.5 rounded border ${b.cls}`}>{b.text}</span>;
}

const AgentRuntimePanel: React.FC = () => {
  const [status, setStatus] = useState<AgentStatusResponse | null>(null);
  const [statusError, setStatusError] = useState<string>('');
  const [agentKey, setAgentKey] = useState<string>('ai_sdr');
  const [input, setInput] = useState<string>('Find the top 3 hottest leads and draft follow-ups');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AgentRunResult | null>(null);

  useEffect(() => {
    let alive = true;
    fetchAgentStatus()
      .then((s) => { if (alive) setStatus(s); })
      .catch(() => { if (alive) setStatusError('Agent runtime status unavailable (deploy with Netlify functions).'); });
    return () => { alive = false; };
  }, []);

  const catalog = AGENT_CATALOG;
  const agentStatuses = status?.agents || [];
  const integrations = status?.integrations || {};

  const run = async (mode: 'demo' | 'real') => {
    setRunning(true);
    setResult(null);
    try {
      const r = await runAgentTask(agentKey, input, { mode });
      setResult(r);
    } catch (e: any) {
      setResult({ status: 'failed', error: e?.message || 'run failed' });
    } finally {
      setRunning(false);
    }
  };

  const runWorkflow = async (mode: 'demo' | 'real') => {
    setRunning(true);
    setResult(null);
    try {
      const r = await runWorkflowTask('qualify_lead', input, { mode });
      setResult(r as AgentRunResult);
    } catch (e: any) {
      setResult({ status: 'failed', error: e?.message || 'run failed' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">AI Agent Runtime</h2>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Live status of the 16 AI agents. Real execution runs server-side through the OpenAI Agents SDK; integrations must be connected for provider actions.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(integrations).map(([k, v]) => (
          <span key={k} className={`text-xs px-2 py-1 rounded border ${v ? 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/40' : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-400/30'}`}>
            {k}: {v ? 'connected' : 'not configured'}
          </span>
        ))}
        {statusError && <span className="text-xs px-2 py-1 rounded border bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40">{statusError}</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {catalog.map((a) => {
          const s = agentStatuses.find((x) => x.key === a.key);
          const st = s?.status || (statusError ? '' : 'loading');
          return (
            <button
              key={a.key}
              onClick={() => setAgentKey(a.key)}
              className={`text-left p-3 rounded-xl border transition-colors ${agentKey === a.key ? 'border-blue-500 bg-blue-500/10' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">{a.name}</span>
                {st ? <Badge status={st} /> : <span className="text-xs text-slate-400">…</span>}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{a.role}</div>
              {s && s.blockedIntegrations.length > 0 && (
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">needs: {s.blockedIntegrations.join(', ')}</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Task for {catalog.find((a) => a.key === agentKey)?.name || agentKey}</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white mb-3"
        />
        <div className="flex flex-wrap gap-2">
          <button disabled={running} onClick={() => run('demo')} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50">
            {running ? 'Running…' : 'Run (demo)'}
          </button>
          <button disabled={running} onClick={() => run('real')} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-50">
            Run (real)
          </button>
          <button disabled={running} onClick={() => runWorkflow('real')} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm disabled:opacity-50">
            Qualify lead workflow (real)
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Real execution requires sign-in; consequential actions require approval. Demo runs are labeled and mutate no data.</p>

        {result && (
          <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2"><Badge status={result.status} />{result.agentName && <span className="text-sm text-slate-500 dark:text-slate-400">{result.agentName}</span>}</div>
            {result.message && <div className="text-sm text-amber-600 dark:text-amber-400">{result.message}</div>}
            {result.error && <div className="text-sm text-red-600 dark:text-red-400">Error: {result.error}</div>}
            {result.output && <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{result.output}</p>}
            {result.blockedIntegrations && result.blockedIntegrations.length > 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">Blocked integrations: {result.blockedIntegrations.join(', ')}</div>
            )}
            {result.steps && (
              <ul className="mt-2 space-y-1">
                {result.steps.map((s, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Badge status={s.status} /> <span className="font-medium">{s.agentKey}</span>{s.label ? <span className="text-slate-400">— {s.label}</span> : null}
                  </li>
                ))}
              </ul>
            )}
            {result.toolCalls && result.toolCalls.length > 0 && (
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Tool calls: {result.toolCalls.map((t) => t.name).join(', ')}</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default AgentRuntimePanel;
