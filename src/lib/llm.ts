/**
 * Dispute Compass — LLM adapter (OpenAI-compatible).
 *
 * Works with any OpenAI-compatible endpoint through .env:
 *   LLM_API_KEY   (alias: NIM_API_KEY)
 *   LLM_BASE_URL  (alias: NIM_BASE_URL;  default: NVIDIA NIM)
 *   LLM_MODEL     (alias: NIM_MODEL;     default: nvidia/nemotron-3.5-super-vl-120b-a12b)
 *
 * When no key is configured, callers must fall back to deterministic
 * templates — every generated artifact is tagged with its source so the UI
 * can label output honestly ("AI draft" vs "Template").
 */

export interface LlmStatus {
  configured: boolean;
  provider: string;
  model: string;
  baseUrl: string;
}

export function llmStatus(): LlmStatus {
  const key = process.env.LLM_API_KEY || process.env.NIM_API_KEY || '';
  const baseUrl = process.env.LLM_BASE_URL || process.env.NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const model = process.env.LLM_MODEL || process.env.NIM_MODEL || 'nvidia/nemotron-3.5-super-vl-120b-a12b';
  const provider = key ? (baseUrl.includes('nvidia') ? 'NVIDIA NIM' : baseUrl.includes('openai') ? 'OpenAI' : 'OpenAI-compatible') : 'not-configured';
  return { configured: Boolean(key), provider, model, baseUrl };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export async function chatComplete(opts: ChatOptions): Promise<string> {
  const status = llmStatus();
  if (!status.configured) throw new Error('LLM_NOT_CONFIGURED');

  const res = await fetch(`${status.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.LLM_API_KEY || process.env.NIM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: status.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 1200,
      ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM request failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM returned empty content');
  return content;
}

/** Parse a JSON object out of an LLM response, tolerating code fences. */
export function parseJsonLoose<T>(raw: string): T | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
