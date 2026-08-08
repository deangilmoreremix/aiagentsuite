import { realApiService } from '../services/realApiService';
import { apiConfig, validateApiSetup } from '../config/apiConfig';
import { runAgentWithTools } from './openaiAgents';
import { executeCrmTool } from './crmTools';

const validation = validateApiSetup();

if (validation.canUseRealMode) {
  console.log('✅ OpenAI Agents SDK initialized with real API key');
} else {
  console.warn('⚠️ OpenAI API key not configured. Using demo mode.');
}

export const agentToolApps = [
  'send_email', 'create_calendar_event', 'send_slack_message',
  'create_contact', 'create_deal', 'log_activity', 'search_contacts'
];

export const agentToolPickerOptions = agentToolApps.map((tool) => ({
  label: tool.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  value: `agent:${tool}`,
  icon: getToolIcon(tool),
  status: apiConfig.openai.isConfigured ? 'available' : 'demo'
}));

function getToolIcon(tool: string) {
  const icons: Record<string, string> = {
    send_email: '📧',
    create_calendar_event: '📅',
    send_slack_message: '💬',
    create_contact: '👤',
    create_deal: '💼',
    log_activity: '📝',
    search_contacts: '🔍'
  };
  return icons[tool] || '🔧';
}

export function getAgentToolPickerUI(onSelect: (value: string) => void) {
  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      {agentToolPickerOptions.map((option) => (
        <button
          key={option.value}
          className="border rounded-xl py-2 px-4 text-sm hover:bg-gray-100"
          onClick={() => onSelect(option.value)}
        >
          {option.icon} {option.label}
          {option.status === 'demo' && <span className="text-xs text-orange-500 ml-1">(Demo)</span>}
        </button>
      ))}
    </div>
  );
}

export async function executeAgentWithTools(agentName: string, task: string, tools: string[]) {
  const validation = validateApiSetup();

  if (!validation.canUseRealMode) {
    const errorMsg = 'Real mode not available. Please configure your OpenAI API key.';
    console.error('❌', errorMsg);
    try {
      embedAgentResponseUI(null, errorMsg);
    } catch (error) {
      console.error('Failed to embed response UI:', error);
    }
    return errorMsg;
  }

  try {
    console.log(`🤖 Executing ${agentName} with real AI...`);
    console.log(`📋 Task: ${task}`);
    console.log(`🔧 Tools: ${tools.join(', ')}`);

    const result = await runAgentWithTools({
      name: agentName,
      instructions: `You are ${agentName}. Your task: ${task}. Available tools: ${tools.join(', ')}.
        Use the available tools when the task requires external actions and provide a clear final answer.`,
      input: task,
      tools: tools.length > 0
    });

    console.log('✅ Real AI execution completed');
    try {
      embedAgentResponseUI(tools, result.output);
    } catch (error) {
      console.error('Failed to embed response UI:', error);
    }

    if (validation.hasVoice) {
      try {
        console.log('🎙️ Generating voice response...');
        const audioUrl = await realApiService.elevenlabs.generateSpeech(
          result.output.substring(0, 200) + '...'
        );
        console.log('✅ Voice response generated');

        const audio = new Audio(audioUrl);
        audio.play().catch((e) => console.log('Audio playback failed:', e));
      } catch (voiceError) {
        console.log('⚠️ Voice generation failed:', voiceError);
      }
    }

    return result.output;
  } catch (error) {
    console.error('❌ Real agent execution failed:', error);
    const errorMsg = `Real AI execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    try {
      embedAgentResponseUI(null, errorMsg);
    } catch (uiError) {
      console.error('Failed to embed error UI:', uiError);
    }
    return errorMsg;
  }
}

export const runAllAgents = async (task: string, tools: string[]) => {
  const validation = validateApiSetup();

  if (!validation.canUseRealMode) {
    console.error('❌ Real mode not available. Please configure your APIs.');
    return;
  }

  const agents = [
    'AI SDR Agent', 'AI Dialer Agent', 'AI AE Agent', 'AI Journeys Agent', 'Voice Agent', 'Meetings Agent',
    'Objection Handler Agent', 'Reengagement Agent', 'Follow-up Agent', 'Lead Scoring Agent',
    'Lead Enrichment Agent', 'Smart Demo Bot Agent', 'WhatsApp Nurturer Agent', 'SMS Campaigner Agent',
    'Cold Outreach Closer Agent', 'Personalized Email Agent'
  ];

  console.log('🚀 Running all agents with real AI...');
  for (const agent of agents) {
    console.log(`\n🤖 Running ${agent} with real APIs...`);
    await executeAgentWithTools(agent, task, tools);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

export async function runAgentForModule(agentName: string, task: string, app: string) {
  console.log(`\n[Real CRM Execution] ${agentName} for task:`, task);
  return await executeAgentWithTools(agentName, task, [app]);
}

function embedAgentResponseUI(_toolsUsed: any, output: any) {
  try {
    const container = document.querySelector('#agent-response-container');
    if (!container) {
      console.warn('Agent response container not found');
      return;
    }
    container.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'border border-gray-300 rounded-lg p-4 bg-white shadow-sm';

    const title = document.createElement('h3');
    title.innerText = validation.canUseRealMode ? '🔴 Real AI Agent Result' : '🔵 Demo Agent Response';
    title.className = 'text-lg font-semibold mb-2';

    const content = document.createElement('pre');
    content.className = 'text-sm whitespace-pre-wrap break-words';
    content.innerText = typeof output === 'string' ? output : JSON.stringify(output, null, 2);

    const buttonRow = document.createElement('div');
    buttonRow.className = 'mt-4 flex gap-2';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-xs';
    copyBtn.innerText = 'Copy';
    copyBtn.onclick = () => navigator.clipboard.writeText(content.innerText);

    const exportBtn = document.createElement('button');
    exportBtn.className = 'bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-xs';
    exportBtn.innerText = 'Export';
    exportBtn.onclick = () => {
      const blob = new Blob([content.innerText], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'real-agent-response.txt';
      link.click();
    };

    if (validation.hasToolIntegration) {
      const emailBtn = document.createElement('button');
      emailBtn.className = 'bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs';
      emailBtn.innerText = 'Send via Email';
      emailBtn.onclick = async () => {
        try {
          await executeCrmTool('send_email', {
            to: 'user@example.com',
            subject: 'Real AI Agent Response',
            body: content.innerText
          });
          alert('✅ Email sent via real API!');
        } catch (error) {
          alert('⚠️ Email send failed: ' + error);
        }
      };
      buttonRow.appendChild(emailBtn);
    }

    buttonRow.appendChild(copyBtn);
    buttonRow.appendChild(exportBtn);

    card.appendChild(title);
    card.appendChild(content);
    card.appendChild(buttonRow);
    container.appendChild(card);
  } catch (error) {
    console.error('Failed to embed agent response UI:', error);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const validation = validateApiSetup();
    console.log('🔧 Agent Suite initialized');
    console.log('Mode:', validation.canUseRealMode ? '🔴 Real AI Mode' : '🔵 Demo Mode');

    if (validation.canUseRealMode) {
      console.log('🚀 Ready for real AI agent execution!');
    } else {
      console.log('⚠️ Configure OpenAI API key to enable real AI execution');
    }
  });
}
