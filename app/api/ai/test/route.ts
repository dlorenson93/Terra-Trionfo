import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const key = process.env.OPENAI_API_KEY
  return NextResponse.json({
    hasKey: !!key,
    keyPrefix: key ? key.slice(0, 12) + '...' : null,
    keyLength: key ? key.length : 0,
    nodeEnv: process.env.NODE_ENV,
  })
}
