import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt, buildUserMessage } from '@/lib/ai/prompts'
import { WINES } from '@/data/wines'
import { PRODUCERS } from '@/data/producers'
import {
  buildPortfolioContextFromDB,
  fetchLiveDBProducts,
  fetchLiveDBCompanies,
  type DBProductRef,
} from '@/lib/ai/portfolioContext'
import type {
  SommelierRequest,
  SommelierResponse,
  SuggestedWine,
  SuggestedProducer,
  RecommendationCard,
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
      max_tokens: 700,
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

function resolveSuggestedWinesFromDB(
  answer: string,
  dbProducts: DBProductRef[],
): SuggestedWine[] {
  const lower = answer.toLowerCase()
  return dbProducts
    .filter((p) => {
      const fullName = `${p.company.name} ${p.name}`.toLowerCase()
      return lower.includes(fullName) || lower.includes(p.name.toLowerCase())
    })
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      displayName: `${p.company.name} ${p.name}`,
      type: p.wineStyle || 'Wine',
      region: p.region || '',
      price: p.retailPriceCents / 100,
      slug: p.slug || p.id,
    }))
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

function resolveSuggestedProducersFromDB(
  answer: string,
  dbCompanies: Array<{ id: string; name: string; slug: string | null; region: string | null }>,
): SuggestedProducer[] {
  const lower = answer.toLowerCase()
  return dbCompanies
    .filter((c) => lower.includes(c.name.toLowerCase()))
    .slice(0, 2)
    .map((c) => ({
      id: c.id,
      name: c.name,
      region: c.region || '',
      slug: c.slug || c.id,
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

/**
 * Extract the first named Terra Trionfo wine from the answer as the
 * primary recommendation, and subsequent named wines as secondaries.
 * This is a heuristic based on name-matching — no LLM structured output needed.
 */
function extractRecommendations(
  answer: string,
  suggestedWines: SuggestedWine[],
): { primary?: RecommendationCard; secondary?: RecommendationCard[] } {
  if (suggestedWines.length === 0) return {}
  const [first, ...rest] = suggestedWines

  // Find the sentence containing the wine name as the reason snippet
  const reasonSentence = (name: string): string => {
    const sentences = answer.split(/(?<=[.!?])\s+/)
    const hit = sentences.find((s) => s.toLowerCase().includes(name.toLowerCase()))
    return hit ? hit.trim().slice(0, 180) : ''
  }

  const primary: RecommendationCard = {
    name: first.displayName,
    slug: first.slug,
    producer: first.displayName.split(' ')[0], // first word is always producer name
    reason: reasonSentence(first.displayName),
  }

  const secondary: RecommendationCard[] = rest.map((w) => ({
    name: w.displayName,
    slug: w.slug,
    producer: w.displayName.split(' ')[0],
    reason: reasonSentence(w.displayName),
  }))

  return { primary, secondary: secondary.length > 0 ? secondary : undefined }
}

/**
 * Generate 2–3 contextual follow-up prompts based on what wines appeared
 * in the answer and the original question.
 */
function generateFollowUpPrompts(
  question: string,
  suggestedWines: SuggestedWine[],
): string[] {
  const prompts: string[] = []
  const q = question.toLowerCase()

  if (suggestedWines.length > 0) {
    const first = suggestedWines[0]
    prompts.push(`Tell me more about ${first.displayName}`)
    if (first.displayName.toLowerCase().includes('barolo')) {
      prompts.push('How long should I age this Barolo?')
    } else if (first.type === 'Sparkling' || first.type === 'Sparkling Rosé') {
      prompts.push('What occasions suit this wine best?')
    } else {
      prompts.push('What foods pair best with this wine?')
    }
  }

  if (q.includes('pair') || q.includes('food')) {
    prompts.push('What other wines in the portfolio are great for entertaining?')
  } else if (q.includes('region') || q.includes('barolo') || q.includes('franciacorta')) {
    prompts.push('Which wine should I try first from this region?')
  } else if (q.includes('age') || q.includes('cellar')) {
    prompts.push('Which Terra Trionfo wines are best for cellaring?')
  } else {
    prompts.push('What is a good wine for a special occasion?')
  }

  return prompts.slice(0, 3)
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

    // Sanitise question
    const question = body.question.trim().replace(/\s+/g, ' ').slice(0, 500)
    if (question.length === 0) {
      return NextResponse.json({ error: 'Question cannot be empty.' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('[Sommelier] OPENAI_API_KEY is not set in environment variables.')
      return NextResponse.json(
        {
          answer:
            'The wine guide is currently being set up. Please check back shortly — in the meantime, explore the portfolio to discover our producers.',
        } satisfies SommelierResponse,
        { status: 200 },
      )
    }
    console.log('[Sommelier] API key present, key prefix:', process.env.OPENAI_API_KEY.slice(0, 10))

    // ── DB-first: fetch live portfolio context + product/company refs in parallel ──
    const [portfolioContext, dbProducts, dbCompanies] = await Promise.all([
      buildPortfolioContextFromDB(),
      fetchLiveDBProducts(),
      fetchLiveDBCompanies(),
    ])

    const systemPrompt = buildSystemPrompt(portfolioContext)
    const userMessage = buildUserMessage(
      question,
      body.wineContext,
      body.regionContext,
      body.producerContext,
      body.sessionPreferences,
    )

    const answerText = await callOpenAI(systemPrompt, userMessage)

    // DB-first wine/producer resolution; fall back to static if DB returned nothing
    const suggestedWines =
      dbProducts.length > 0
        ? resolveSuggestedWinesFromDB(answerText, dbProducts)
        : resolveSuggestedWines(answerText)

    const suggestedProducers =
      dbCompanies.length > 0
        ? resolveSuggestedProducersFromDB(answerText, dbCompanies)
        : resolveSuggestedProducers(answerText)
    const { primary, secondary } = extractRecommendations(answerText, suggestedWines)
    const followUpPrompts = generateFollowUpPrompts(question, suggestedWines)

    const response: SommelierResponse = {
      answer: answerText,
      ...(primary && { primaryRecommendation: primary }),
      ...(secondary && secondary.length > 0 && { secondaryRecommendations: secondary }),
      ...(followUpPrompts.length > 0 && { followUpPrompts }),
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
