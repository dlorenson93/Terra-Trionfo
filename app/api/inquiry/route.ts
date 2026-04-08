import { NextRequest, NextResponse } from 'next/server'
import { sendWineInquiryEmails } from '@/lib/email'

export const dynamic = 'force-dynamic'

interface InquiryItem {
  name: string
  slug: string
  quantity: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, firstName, email, accountType, message } = body

    if (
      !Array.isArray(items) || items.length === 0 ||
      typeof firstName !== 'string' || firstName.trim().length === 0 ||
      typeof email !== 'string' || !email.includes('@') ||
      (accountType !== 'CONSUMER' && accountType !== 'TRADE')
    ) {
      return NextResponse.json({ error: 'Invalid inquiry data' }, { status: 400 })
    }

    const sanitizedItems: InquiryItem[] = items.map((i: any) => ({
      name:     String(i.name || '').slice(0, 200),
      slug:     String(i.slug || '').slice(0, 200),
      quantity: Math.max(1, Math.min(99, Number(i.quantity) || 1)),
    }))

    await sendWineInquiryEmails({
      firstName: firstName.trim().slice(0, 100),
      email:     email.trim().toLowerCase(),
      accountType,
      message:   typeof message === 'string' ? message.slice(0, 1000) : undefined,
      items:     sanitizedItems,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[inquiry] POST error:', err)
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 })
  }
}
