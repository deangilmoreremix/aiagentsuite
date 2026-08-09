import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Smoke tests for the agent runtime + CRM tools.
 *
 * These run completely offline: `@openai/agents` is replaced with a fake
 * implementation, so no API key, network access, or real model call is
 * involved. The point is to prove the wiring (agent construction, run
 * invocation, tool-call extraction, and the local CRM tool executor).
 */

/** Minimal stand-in for the SDK's `RunResult`, limited to the fields we read. */
interface FakeRunResult {
  finalOutput: string;
  newItems: unknown[];
  history: unknown[];
}

/**
 * Shared state between the hoisted `vi.mock` factory and the tests.
 * `vi.hoisted` is required because `vi.mock` factories are hoisted above
 * all imports, so they cannot close over ordinary module-level consts.
 */
const harness = vi.hoisted(() => {
  const defaultResult = (): FakeRunResult => ({
    finalOutput: 'hello from mock',
    newItems: [],
    history: []
  });

  return {
    /** Options passed to every `new Agent(...)` call. */
    agentOptions: [] as unknown[],
    /** Inputs passed to every `run(...)` call. */
    runInputs: [] as unknown[],
    /** When set, the next `run(...)` resolves with this instead of the default. */
    nextResult: null as FakeRunResult | null,
    defaultResult
  };
});

vi.mock('@openai/agents', () => {
  class Agent {
    constructor(options: unknown) {
      harness.agentOptions.push(options);
    }
  }

  class MCPServerSSE {
    constructor(options?: unknown) {
      void options;
    }
    async connect(): Promise<void> {}
    async close(): Promise<void> {}
  }

  return {
    Agent,
    MCPServerSSE,
    // Fake `run`: records the call and resolves a RunResult-shaped object.
    run: vi.fn(async (agent: unknown, input: unknown): Promise<FakeRunResult> => {
      void agent;
      harness.runInputs.push(input);
      const queued = harness.nextResult;
      harness.nextResult = null;
      return queued ?? harness.defaultResult();
    }),
    // Fake `tool`: the real SDK validates/wraps; here we just echo the options
    // so `crmTools` can be built at import time without any SDK machinery.
    tool: (options: unknown) => options,
    setDefaultOpenAIClient: vi.fn()
  };
});

// Imported after `vi.mock` so the modules under test pick up the fake SDK.
import { runAgentWithTools } from '../openaiAgents';
import { crmTools, executeCrmTool } from '../crmTools';

beforeEach(() => {
  harness.agentOptions.length = 0;
  harness.runInputs.length = 0;
  harness.nextResult = null;
});

describe('runAgentWithTools (mocked @openai/agents)', () => {
  it('resolves with the mocked final output and an array of tool calls', async () => {
    const result = await runAgentWithTools({
      name: 'Test',
      instructions: 'x',
      input: 'y'
    });

    expect(result.output).toBe('hello from mock');
    expect(Array.isArray(result.toolCalls)).toBe(true);
    expect(result.toolCalls).toEqual([]);
    expect(Array.isArray(result.history)).toBe(true);
  });

  it('builds an Agent with the given name/instructions and forwards the input', async () => {
    await runAgentWithTools({
      name: 'Test',
      instructions: 'x',
      input: 'y'
    });

    expect(harness.agentOptions).toHaveLength(1);

    const options = harness.agentOptions[0] as {
      name: string;
      instructions: string;
      model: string;
      tools: unknown[];
    };

    expect(options.name).toBe('Test');
    expect(options.instructions).toBe('x');
    // A real model id is resolved, never the fictional "main"/"thinking" ones.
    expect(options.model).toBeTruthy();
    expect(options.model).not.toMatch(/main|thinking/i);
    // Tools are attached by default.
    expect(options.tools).toHaveLength(crmTools.length);

    expect(harness.runInputs).toEqual(['y']);
  });

  it('passes an empty tool list when tools are disabled', async () => {
    await runAgentWithTools({
      name: 'Test',
      instructions: 'x',
      input: 'y',
      tools: false
    });

    const options = harness.agentOptions[0] as { tools: unknown[] };
    expect(options.tools).toEqual([]);
  });

  it('pairs tool_call_item entries with their tool_call_output_item results', async () => {
    harness.nextResult = {
      finalOutput: 'done',
      newItems: [
        {
          type: 'tool_call_item',
          name: 'create_contact',
          rawItem: { arguments: JSON.stringify({ first_name: 'A', last_name: 'B' }) }
        },
        {
          type: 'tool_call_output_item',
          output: '{"created":true}'
        }
      ],
      history: []
    };

    const result = await runAgentWithTools({
      name: 'Test',
      instructions: 'x',
      input: 'y'
    });

    expect(result.output).toBe('done');
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].name).toBe('create_contact');
    expect(result.toolCalls[0].input).toEqual({ first_name: 'A', last_name: 'B' });
    expect(result.toolCalls[0].output).toBe('{"created":true}');
  });
});

describe('executeCrmTool', () => {
  it('create_contact resolves with created: true', async () => {
    const result = (await executeCrmTool('create_contact', {
      first_name: 'A',
      last_name: 'B'
    })) as { created?: boolean; contact?: unknown };

    expect(result).toBeTypeOf('object');
    expect(result.created).toBe(true);
    // `contact` depends on whether Supabase is configured, so only assert the
    // key exists rather than its value.
    expect(result).toHaveProperty('contact');
  });

  it('send_email resolves with sent: true and echoes the recipient', async () => {
    const result = (await executeCrmTool('send_email', {
      to: 'x@y.z',
      subject: 's',
      body: 'b'
    })) as { sent?: boolean; to?: string; subject?: string };

    expect(result.sent).toBe(true);
    expect(result.to).toBe('x@y.z');
    expect(result.subject).toBe('s');
  });

  it('returns an error object for an unknown tool', async () => {
    const result = (await executeCrmTool('does_not_exist', {})) as { error?: string };

    expect(result.error).toContain('does_not_exist');
  });
});

describe('crmTools registry', () => {
  it('exposes the expected CRM tool names', () => {
    const names = (crmTools as Array<{ name?: string }>).map((entry) => entry.name);

    expect(names).toContain('send_email');
    expect(names).toContain('create_contact');
    expect(names).toContain('search_contacts');
  });
});
