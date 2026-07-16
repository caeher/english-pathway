const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings'
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536

export interface EmbeddingResult {
  embedding: number[]
  model: string
}

function getOpenAiApiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('Missing OPENAI_API_KEY environment variable')
  }
  return key
}

export async function createEmbedding(text: string): Promise<EmbeddingResult> {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('Cannot embed empty text')
  }

  const response = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getOpenAiApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: trimmed,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OpenAI embeddings failed (${response.status}): ${errorBody}`)
  }

  const payload = (await response.json()) as {
    data: Array<{ embedding: number[] }>
    model: string
  }

  const embedding = payload.data[0]?.embedding
  if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error('Invalid embedding response from OpenAI')
  }

  return { embedding, model: payload.model }
}

export function embeddingToVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}

export const EMBEDDING_CONFIG = {
  model: EMBEDDING_MODEL,
  dimensions: EMBEDDING_DIMENSIONS,
} as const
