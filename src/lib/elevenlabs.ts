// ElevenLabs integration — delegates to the real, config-gated client.
export async function speakText(text: string, voice?: string) {
  const { realApiService } = await import('./realApiService');

  if (!realApiService.elevenlabs) {
    return { audioUrl: 'placeholder-audio-url' };
  }

  const audioUrl = await realApiService.elevenlabs.generateSpeech(text, voice);
  return { audioUrl };
}
