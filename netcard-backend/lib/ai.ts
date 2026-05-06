import OpenAI from 'openai'

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.FRONTEND_URL ?? 'http://localhost:5173',
    'X-Title': 'PPL AI NetCard',
  },
})

const PRIMARY_MODEL  = process.env.OPENROUTER_PRIMARY_MODEL  ?? 'liquid/lfm-2'
const FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL ?? 'openai/gpt-3.5-turbo'

export async function generateAI(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  maxTokens = 300,
): Promise<string> {
  try {
    const res = await openrouter.chat.completions.create({
      model: PRIMARY_MODEL,
      max_tokens: maxTokens,
      messages,
    })
    return res.choices[0]?.message?.content ?? ''
  } catch {
    const res = await openrouter.chat.completions.create({
      model: FALLBACK_MODEL,
      max_tokens: maxTokens,
      messages,
    })
    return res.choices[0]?.message?.content ?? ''
  }
}
