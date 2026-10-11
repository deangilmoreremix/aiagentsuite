// Server-side AI proxy. Holds PRIVATE provider credentials (OPENAI_API_KEY /
// GEMINI_API_KEY) from the server environment only — these are NEVER exposed
// to the browser. When a provider key is absent, it returns a simulated
// ("demo mode") response so the landing page keeps working with zero config.
//
// It never echoes the request key, the error object, or any secret.

import OpenAI from 'openai';

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
});

const head = (s) => String(s ?? '').substring(0, 100);

export async function handler(event) {
  if (event.httpMethod && event.httpMethod.toUpperCase() !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const provider = payload.provider === 'gemini' ? 'gemini' : 'openai';
  const op = payload.op || 'text';

  try {
    if (provider === 'gemini') {
      const key = process.env.GEMINI_API_KEY;
      const prompt = payload.prompt || '';
      if (!key) {
        return json(200, { demo: true, text: `[Simulated Gemini response to: ${head(prompt)}...]` });
      }
      const model = payload.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: payload.maxTokens || 500,
            temperature: payload.temperature ?? 0.7,
          },
        }),
      });
      if (!r.ok) {
        return json(200, { demo: true, text: `[Simulated Gemini response to: ${head(prompt)}...]` });
      }
      const data = await r.json();
      const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text).join('') || '';
      return json(200, { demo: false, text: text || `[Simulated Gemini response to: ${head(prompt)}...]` });
    }

    // OpenAI
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      if (op === 'chat') {
        return json(200, { demo: true, choices: [{ message: { content: `[Simulated response to conversation with ${(payload.messages || []).length} messages]` } }] });
      }
      if (op === 'response') {
        return json(200, { demo: true, output_text: `[Simulated response to: ${head(payload.input || payload.prompt)}...]` });
      }
      return json(200, { demo: true, text: `[Simulated response to: ${head(payload.prompt)}...]` });
    }

    const client = new OpenAI({ apiKey: key });

    if (op === 'chat') {
      const completion = await client.chat.completions.create({
        model: payload.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: payload.messages || [],
        max_tokens: payload.max_tokens || 1000,
        temperature: payload.temperature ?? 0.7,
      });
      return json(200, { demo: false, output_text: completion.choices[0]?.message?.content || '', id: completion.id });
    }

    if (op === 'response') {
      const completion = await client.chat.completions.create({
        model: payload.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: payload.messages || [],
        max_tokens: payload.max_tokens || 1000,
        temperature: payload.temperature ?? 0.2,
        response_format: payload.response_format,
      });
      return json(200, { demo: false, output_text: completion.choices[0]?.message?.content || '', id: completion.id });
    }

    const completion = await client.chat.completions.create({
      model: payload.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: payload.prompt || '' }],
      max_tokens: payload.maxTokens || 500,
      temperature: payload.temperature ?? 0.7,
    });
    return json(200, { demo: false, text: completion.choices[0]?.message?.content || '' });
  } catch {
    // Fail closed to demo mode WITHOUT leaking error contents or keys.
    const seed = payload.prompt || payload.input || 'request';
    return json(200, { demo: true, text: `[Simulated response to: ${head(seed)}...]` });
  }
}
