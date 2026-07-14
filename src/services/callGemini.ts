// Gemini service — delegates to the real, config-gated client in realApiService.
export async function callGemini(prompt: string, options?: any) {
  const { realApiService } = await import('./realApiService');
  const maxTokens = options?.maxTokens ?? 1000;
  const temperature = options?.temperature ?? 0.7;

  if (!realApiService.gemini) {
    return { response: 'Gemini response placeholder' };
  }

  const response = await realApiService.gemini.generateContent(prompt, maxTokens, temperature);
  return { response };
}
