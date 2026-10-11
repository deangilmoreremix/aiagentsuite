// Report which providers are configured SERVER-SIDE. Returns booleans only —
// never a key value. The client uses this to decide demo vs live mode.
const json = (body) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});

export async function handler() {
  return json({
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    composio: !!process.env.COMPOSIO_API_KEY,
  });
}
