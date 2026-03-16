import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt, buildUserMessage } from '@/lib/ai/prompts'
import { WINES } from '@/data/wines'
import { PRODUCERS } from '@/data/producers'
import type {
  SommelierRequest,
  SommelierResponse,
  SuggestedWine,
  SuggestedProducer,
} from '@/lib/ai/types'

// OpenAI Chat Completions response shape (subset we need)
interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string | null
    }
  }>
  error?: {
    message: string
    type: string
  }
}

async function callOpenAI(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured.')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 650,
      temperature: 0.72,
    }),
  })

  const data: OpenAIChatResponse = await res.json()

  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? `OpenAI error ${res.status}`)
  }

  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty response from AI.')
  return text
}

function resolveSuggestedWines(answer: string): SuggestedWine[] {
  const lower = answer.toLowerCase()
  return WINES.filter(
    (w) =>
      lower.includes(w.displayName.toLowerCase()) ||
      lower.includes(w.wineName.toLowerCase()),
  )
    .slice(0, 3)
    .map((w) => ({
      id: w.id,
      displayName: w.displayName,
      type: w.type,
      region: w.region,
      price: w.consumerPurchasePriceUSD,
      slug: w.slug,
    }))
}

function resolveSuggestedProducers(answer: string): SuggestedProducer[] {
  const lower = answer.toLowerCase()
  return PRODUCERS.filter((p) => lower.includes(p.name.toLowerCase()))
    .slice(0, 2)
    .map((p) => ({
      id: p.id,
      name: p.name,
      region: p.region,
      slug: p.slug,
    }))
}

export async function POST(request: NextRequest) {
  try {
    // Basic content-type check
    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }

    const body: SommelierRequest = await request.json()

    if (!body.question || typeof body.question !== 'string') {
      return NextResponse.json({ error: 'A question is required.' }, { status: 400 })
    }

    // Sanitise question — strip excessive whitespace and enforce length limit
    const question = body.question.trim().replace(/\s+/g, ' ').slice(0, 500)
    if (question.length === 0) {
      return NextResponse.json({ error: 'Question cannot be empty.' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          answer:
            'The wine guide is currently being set up. Please check back shortly — in the meantime, explore the portfolio to discover our producers.',
        } satisfies SommelierResponse,
        { status: 200 },
      )
    }

    const systemPrompt = buildSystemPrompt()
    const userMessage = buildUserMessage(
      question,
      body.wineContext,
      body.regionContext,
      body.producerContext,
    )

    const answerText = await callOpenAI(systemPrompt, userMessage)

    const suggestedWines = resolveSuggestedWines(answerText)
    const suggestedProducers = resolveSuggestedProducers(answerText)

    const response: SommelierResponse = {
      answer: answerText,
      ...(suggestedWines.length > 0 && { suggestedWines }),
      ...(suggestedProducers.length > 0 && { suggestedProducers }),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Sommelier API]', error)
    return NextResponse.json(
      {
        answer:
          'I apologise — I am momentarily unavailable. Please try again in a moment.',
        error: 'temporary_error',
      } satisfies SommelierResponse,
      { status: 500 },
    )
  }
}
