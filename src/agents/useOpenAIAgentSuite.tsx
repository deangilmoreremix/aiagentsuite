import OpenAI from "openai";
import { realApiService } from "../services/realApiService";
import { apiConfig, validateApiSetup } from "../config/apiConfig";

// Initialize OpenAI client with error handling
const validation = validateApiSetup();
let openai: OpenAI | null = null;

if (validation.canUseRealMode) {
  openai = new OpenAI({ 
    apiKey: apiConfig.openai.apiKey,
    dangerouslyAllowBrowser: true 
  });
  console.log('✅ OpenAI client initialized with real API key');
} else {
  console.warn('⚠️ OpenAI API key not configured. Using demo mode.');
}

export const composioApps = [
  "gmail", "slack", "google_calendar", "zoom", "trello", "google_sheets",
  "shopify", "stripe", "calendly", "whatsapp_business", "twilio",
  "facebook_ads", "typeform"
];

export const composioAuthMap = Object.fromEntries(
  composioApps.map(app => [
    `connect${app.replace(/(^|_)(\w)/g, (_, p1, p2) => p2.toUpperCase())}OAuth`,
    async () => {
      try {
        if (apiConfig.composio.isConfigured) {
          await realApiService.composio.executeAction(app, 'authenticate', {});
          console.log(`✅ ${app} connected via Composio.`);
        } else {
          console.log(`🔄 ${app} connection simulated (Composio not configured).`);
        }
      } catch (err) {
        console.error(`❌ Composio ${app} Auth failed:`, err);
      }
    }
  ])
);

export const composioToolPickerOptions = composioApps.map(app => ({
  label: app.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  value: `composio:${app}`,
  icon: getAppIcon(app),
  status: apiConfig.composio.isConfigured ? 'available' : 'demo'
}));

function getAppIcon(app: string) {
  const icons: Record<string, string> = {
    gmail: '📧',
    slack: '💬',
    google_calendar: '📅',
    zoom: '📹',
    trello: '📋',
    google_sheets: '📊',
    shopify: '🛒',
    stripe: '💳',
    calendly: '⏰',
    whatsapp_business: '📱',
    twilio: '📞',
    facebook_ads: '📢',
    typeform: '📝'
  };
  return icons[app] || '🔧';
}

export function getComposioToolPickerUI(onSelect: (value: string) => void) {
  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      {composioToolPickerOptions.map(option => (
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
    embedAgentResponseUI(null, errorMsg);
    return errorMsg;
  }

  try {
    console.log(`🤖 Executing ${agentName} with real AI...`);
    console.log(`📋 Task: ${task}`);
    console.log(`🔧 Tools: ${tools.join(', ')}`);

    // Use real OpenAI API
    const result = await realApiService.openai.generateText(
      `You are ${agentName}. Task: ${task}. Available tools: ${tools.join(', ')}. 
       Provide a detailed response about how you would execute this task using the available tools.
       Be specific about the steps you would take and the expected outcomes.`,
      500
    );

    console.log('✅ Real AI execution completed');
    embedAgentResponseUI(tools, result);
    
    // If voice is available, generate speech
    if (validation.hasVoice) {
      try {
        console.log('🎙️ Generating voice response...');
        const audioUrl = await realApiService.elevenlabs.generateSpeech(
          result.substring(0, 200) + '...' // Limit to 200 chars for demo
        );
        console.log('✅ Voice response generated');
        
        // Play the audio
        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.log('Audio playback failed:', e));
      } catch (voiceError) {
        console.log('⚠️ Voice generation failed:', voiceError);
      }
    }

    return result;

  } catch (error) {
    console.error('❌ Real agent execution failed:', error);
    const errorMsg = `Real AI execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    embedAgentResponseUI(null, errorMsg);
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
    "AI SDR Agent", "AI Dialer Agent", "AI AE Agent", "AI Journeys Agent", "Voice Agent", "Meetings Agent",
    "Objection Handler Agent", "Reengagement Agent", "Follow-up Agent", "Lead Scoring Agent",
    "Lead Enrichment Agent", "Smart Demo Bot Agent", "WhatsApp Nurturer Agent", "SMS Campaigner Agent",
    "Cold Outreach Closer Agent", "Personalized Email Agent"
  ];

  console.log('🚀 Running all agents with real AI...');
  for (const agent of agents) {
    console.log(`\n🤖 Running ${agent} with real APIs...`);
    await executeAgentWithTools(agent, task, tools);
    
    // Add delay between agents to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

export async function runAgentForModule(agentName: string, task: string, app: string) {
  console.log(`\n[Real CRM Execution] ${agentName} for task:`, task);
  return await executeAgentWithTools(agentName, task, [app]);
}

function embedAgentResponseUI(toolsUsed: any, output: any) {
  const container = document.querySelector("#agent-response-container");
  if (!container) return;
  container.innerHTML = "";

  const card = document.createElement("div");
  card.className = "border border-gray-300 rounded-lg p-4 bg-white shadow-sm";

  const title = document.createElement("h3");
  title.innerText = validation.canUseRealMode ? "🔴 Real AI Agent Result" : "🔵 Demo Agent Response";
  title.className = "text-lg font-semibold mb-2";

  const content = document.createElement("pre");
  content.className = "text-sm whitespace-pre-wrap break-words";
  content.innerText = typeof output === 'string' ? output : JSON.stringify(output, null, 2);

  const buttonRow = document.createElement("div");
  buttonRow.className = "mt-4 flex gap-2";

  const copyBtn = document.createElement("button");
  copyBtn.className = "bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-xs";
  copyBtn.innerText = "Copy";
  copyBtn.onclick = () => navigator.clipboard.writeText(content.innerText);

  const exportBtn = document.createElement("button");
  exportBtn.className = "bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-xs";
  exportBtn.innerText = "Export";
  exportBtn.onclick = () => {
    const blob = new Blob([content.innerText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "real-agent-response.txt";
    link.click();
  };

  if (validation.hasToolIntegration) {
    const emailBtn = document.createElement("button");
    emailBtn.className = "bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs";
    emailBtn.innerText = "Send via Email";
    emailBtn.onclick = async () => {
      try {
        await realApiService.composio.sendEmail({
          to: "user@example.com",
          subject: "Real AI Agent Response", 
          body: content.innerText
        });
        alert("✅ Email sent via real API!");
      } catch (error) {
        alert("⚠️ Email send failed: " + error);
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
}

// Initialize on page load
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