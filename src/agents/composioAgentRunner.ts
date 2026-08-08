import { executeAgentWithTools } from "./useOpenAIAgentSuite";

export interface AgentStep {
  step: number;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  timestamp: Date;
}

export async function runComposioAgent(
  agentName: string, 
  prompt: string, 
  tools: string[], 
  setSteps?: (steps: string[]) => void
) {
  try {
    // Initialize steps tracking
    const steps: string[] = [];
    
    // Step 1: Initialize agent
    steps.push(`🤖 Initializing ${agentName}...`);
    if (setSteps) setSteps([...steps]);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Step 2: Analyze prompt and prepare tools
    steps.push(`🧠 Analyzing task: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
    if (setSteps) setSteps([...steps]);
    await new Promise(resolve => setTimeout(resolve, 400));

    // Step 3: Connect to required tools
    steps.push(`🔧 Connecting to tools: ${tools.join(', ')}`);
    if (setSteps) setSteps([...steps]);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 4: Execute agent with tools
    steps.push(`⚡ Executing agent with real AI...*`);
    if (setSteps) setSteps([...steps]);

    // Execute the actual agent logic
    const result = await executeAgentWithTools(agentName, prompt, tools);

    // Step 5: Process results
    steps.push(`✅ Agent execution completed successfully`);
    if (setSteps) setSteps([...steps]);
    
    // Step 6: Format output
    steps.push(`📊 Formatting results and logging to timeline`);
    if (setSteps) setSteps([...steps]);
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      success: true,
      agentName,
      result,
      tools,
      timestamp: new Date(),
      steps: steps.length
    };

  } catch (error) {
    console.error(`Agent ${agentName} execution failed:`, error);
    
    if (setSteps) {
      setSteps([
        `🤖 ${agentName} initialized`,
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        `🔄 Please check API keys and tool connections`
      ]);
    }

    return {
      success: false,
      agentName,
      error: error instanceof Error ? error.message : 'Unknown error',
      tools,
      timestamp: new Date()
    };
  }
}

export async function runMultipleAgents(
  agents: Array<{
    name: string;
    prompt: string;
    tools: string[];
  }>,
  setProgress?: (progress: { current: number; total: number; agentName: string }) => void
) {
  const results = [];
  
  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    
    if (setProgress) {
      setProgress({
        current: i + 1,
        total: agents.length,
        agentName: agent.name
      });
    }

    const result = await runComposioAgent(
      agent.name,
      agent.prompt,
      agent.tools
    );
    
    results.push(result);
    
    // Small delay between agents
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

export function createAgentWorkflow(steps: Array<{
  agentName: string;
  prompt: string;
  tools: string[];
  dependsOn?: number[]; // indices of previous steps this depends on
}>) {
  return {
    steps,
    async execute(setProgress?: (progress: any) => void) {
      const results: any[] = [];
      
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Wait for dependencies if any
        // Could add logic here to check if dependencies (step.dependsOn) completed successfully
        
        if (setProgress) {
          setProgress({
            currentStep: i + 1,
            totalSteps: steps.length,
            stepName: step.agentName,
            status: 'running'
          });
        }

        const result = await runComposioAgent(
          step.agentName,
          step.prompt,
          step.tools
        );
        
        results.push(result);
      }
      
      return results;
    }
  };
}

// Utility function to validate agent configuration
export function validateAgentConfig(config: {
  name: string;
  prompt: string;
  tools: string[];
}) {
  const errors = [];
  
  if (!config.name || config.name.trim().length === 0) {
    errors.push('Agent name is required');
  }
  
  if (!config.prompt || config.prompt.trim().length === 0) {
    errors.push('Agent prompt is required');
  }
  
  if (!config.tools || config.tools.length === 0) {
    errors.push('At least one tool is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper to get agent status
export function getAgentStatus(agentName: string) {
  // This could be connected to a state management system
  // For now, return a mock status
  return {
    name: agentName,
    status: 'ready' as 'ready' | 'running' | 'error',
    lastRun: new Date(),
    totalRuns: Math.floor(Math.random() * 100),
    successRate: Math.floor(Math.random() * 100)
  };
}