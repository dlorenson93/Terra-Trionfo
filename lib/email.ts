/**
 * lib/email.ts
 *
 * Resend email client and transactional email templates for Terra Trionfo.
 * All emails send from noreply@terratrionfo.com.
 *
 * Usage:
 *   import { sendOrderConfirmation } from '@/lib/email'
 *   await sendOrderConfirmation({ ... })
 */

const FROM = 'Terra Trionfo <noreply@terratrionfo.com>'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrderConfirmationData {
  to:          string   // customer email
  customerName: string
  orderId:     string
  orderItems:  Array<{
    productName: string
    quantity:    number
    unitPrice:   number  // in dollars (float)
  }>
  total:       number   // in dollars (float)
  fulfillmentType: string  // e.g. 'DELIVERY' | 'PICKUP' | 'SHIPPING'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function fulfillmentLabel(type: string): string {
  const map: Record<string, string> = {
    DELIVERY: 'Local Delivery',
    PICKUP:   'Pickup',
    SHIPPING: 'Shipping',
  }
  return map[type] ?? type
}

// ── Email templates ───────────────────────────────────────────────────────────

function orderConfirmationHtml(data: OrderConfirmationData): string {
  const itemRows = data.orderItems
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e8e4dc;font-size:14px;color:#3d3a2e;">${item.productName}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e8e4dc;font-size:14px;color:#3d3a2e;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e8e4dc;font-size:14px;color:#3d3a2e;text-align:right;">${formatCurrency(item.unitPrice * item.quantity)}</td>
      </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f7f4ee;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ee;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #d9d4c7;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#2d3a1f;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#c8b97a;font-size:11px;letter-spacing:4px;text-transform:uppercase;">Terra Trionfo</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:normal;letter-spacing:1px;">Order Confirmed</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;font-size:15px;color:#5c5840;line-height:1.6;">
                Dear ${data.customerName},
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#5c5840;line-height:1.6;">
                Thank you for your order. We've received your payment and will be in touch with fulfillment details shortly.
              </p>

              <!-- Order summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4dc;margin-bottom:32px;">
                <tr style="background:#f7f4ee;">
                  <td colspan="3" style="padding:12px 16px;font-size:11px;font-family:Arial,sans-serif;font-weight:600;color:#8a7e5c;letter-spacing:2px;text-transform:uppercase;">
                    Order Summary — #${data.orderId.slice(-8).toUpperCase()}
                  </td>
                </tr>
                <tr style="background:#f7f4ee;">
                  <th style="padding:8px 16px;font-size:11px;font-family:Arial,sans-serif;color:#8a7e5c;text-align:left;border-bottom:1px solid #e8e4dc;">Item</th>
                  <th style="padding:8px 16px;font-size:11px;font-family:Arial,sans-serif;color:#8a7e5c;text-align:center;border-bottom:1px solid #e8e4dc;">Qty</th>
                  <th style="padding:8px 16px;font-size:11px;font-family:Arial,sans-serif;color:#8a7e5c;text-align:right;border-bottom:1px solid #e8e4dc;">Price</th>
                </tr>
                <tr><td colspan="3" style="padding:0 16px;">${itemRows}</td></tr>
                <tr style="background:#f7f4ee;">
                  <td colspan="2" style="padding:12px 16px;font-size:14px;font-weight:600;color:#2d3a1f;">Total</td>
                  <td style="padding:12px 16px;font-size:16px;font-weight:700;color:#2d3a1f;text-align:right;">${formatCurrency(data.total)}</td>
                </tr>
              </table>

              <!-- Fulfillment -->
              <p style="margin:0 0 8px;font-size:12px;font-family:Arial,sans-serif;font-weight:600;color:#8a7e5c;text-transform:uppercase;letter-spacing:2px;">Fulfillment</p>
              <p style="margin:0 0 32px;font-size:14px;color:#5c5840;">${fulfillmentLabel(data.fulfillmentType)}</p>

              <p style="margin:0;font-size:14px;color:#5c5840;line-height:1.6;">
                Questions? Reply to this email or contact us at
                <a href="mailto:info@terratrionfo.com" style="color:#5c7a20;text-decoration:none;">info@terratrionfo.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f7f4ee;padding:24px 40px;text-align:center;border-top:1px solid #e8e4dc;">
              <p style="margin:0;font-size:11px;font-family:Arial,sans-serif;color:#a09880;letter-spacing:1px;">
                © ${new Date().getFullYear()} Terra Trionfo · Boston, MA ·
                <a href="https://terratrionfo.com" style="color:#a09880;">terratrionfo.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Sends an order confirmation email to the customer after successful payment.
 * Silently logs and swallows errors — email failure must never break the webhook.
 */
export async function sendOrderConfirmation(data: OrderConfirmationData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping order confirmation email')
    return
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from:    FROM,
      to:      data.to,
      subject: `Your Terra Trionfo order is confirmed (#${data.orderId.slice(-8).toUpperCase()})`,
      html:    orderConfirmationHtml(data),
    })

    if (error) {
      console.error('[email] Resend error sending order confirmation:', error)
    } else {
      console.log(`[email] Order confirmation sent to ${data.to}`)
    }
  } catch (err) {
    console.error('[email] Unexpected error sending order confirmation:', err)
  }
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping password reset email')
    return
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Reset your password</title></head>
<body style="margin:0;padding:0;background:#f7f4ee;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ee;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #d9d4c7;max-width:600px;width:100%;">
        <tr><td style="background:#2d3a1f;padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#c8b97a;font-size:11px;letter-spacing:4px;text-transform:uppercase;">Terra Trionfo</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:normal;letter-spacing:1px;">Password Reset</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 24px;font-size:15px;color:#5c5840;line-height:1.6;">We received a request to reset your password. Click the button below — this link expires in 1 hour.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="background:#2d3a1f;color:#ffffff;text-decoration:none;padding:14px 32px;font-family:Arial,sans-serif;font-size:14px;letter-spacing:1px;display:inline-block;">Reset Password</a>
          </div>
          <p style="margin:0;font-size:13px;color:#8a7e5c;line-height:1.6;">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>
        </td></tr>
        <tr><td style="background:#f7f4ee;padding:24px 40px;text-align:center;border-top:1px solid #e8e4dc;">
          <p style="margin:0;font-size:11px;font-family:Arial,sans-serif;color:#a09880;letter-spacing:1px;">© ${new Date().getFullYear()} Terra Trionfo · Boston, MA · <a href="https://terratrionfo.com" style="color:#a09880;">terratrionfo.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from:    FROM,
      to,
      subject: 'Reset your Terra Trionfo password',
      html,
    })
    if (error) {
      console.error('[email] Resend error sending password reset:', error)
    }
  } catch (err) {
    console.error('[email] Unexpected error sending password reset email:', err)
  }
}

// ── Wine inquiry notification ─────────────────────────────────────────────────

export interface WineInquiryData {
  firstName: string
  email: string
  accountType: 'CONSUMER' | 'TRADE'
  message?: string
  items: { name: string; slug: string; quantity: number }[]
}

function inquiryNotificationHtml(data: WineInquiryData): string {
  const wineRows = data.items.map((i) =>
    `<tr>
      <td style="padding:8px 12px;font-size:14px;color:#3a3220;font-family:Georgia,serif;border-bottom:1px solid #e8e4dc;">${i.name}</td>
      <td style="padding:8px 12px;font-size:14px;color:#5c5840;font-family:Georgia,serif;border-bottom:1px solid #e8e4dc;text-align:center;">${i.quantity}</td>
    </tr>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>New Wine Inquiry</title></head>
<body style="margin:0;padding:0;background:#f7f4ee;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ee;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #d9d4c7;max-width:600px;width:100%;">
        <tr><td style="background:#2d3a1f;padding:28px 40px;text-align:center;">
          <p style="margin:0;color:#c8b97a;font-size:11px;letter-spacing:4px;text-transform:uppercase;">Terra Trionfo</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:20px;font-weight:normal;letter-spacing:1px;">New Wine Inquiry</h1>
        </td></tr>
        <tr><td style="padding:32px 40px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding:6px 0;font-size:12px;color:#8a7e5c;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:2px;width:120px;">Name</td>
              <td style="padding:6px 0;font-size:14px;color:#3a3220;">${data.firstName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:12px;color:#8a7e5c;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:2px;">Email</td>
              <td style="padding:6px 0;font-size:14px;color:#3a3220;"><a href="mailto:${data.email}" style="color:#2d3a1f;">${data.email}</a></td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:12px;color:#8a7e5c;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:2px;">Account Type</td>
              <td style="padding:6px 0;font-size:14px;color:#3a3220;">${data.accountType === 'TRADE' ? 'Trade Buyer' : 'Consumer'}</td>
            </tr>
            ${data.message ? `<tr>
              <td style="padding:6px 0;font-size:12px;color:#8a7e5c;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:2px;vertical-align:top;">Message</td>
              <td style="padding:6px 0;font-size:14px;color:#3a3220;line-height:1.6;">${data.message}</td>
            </tr>` : ''}
          </table>
          <p style="margin:0 0 12px;font-size:12px;font-family:Arial,sans-serif;color:#8a7e5c;text-transform:uppercase;letter-spacing:2px;">Wines of Interest</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4dc;">
            <tr>
              <th style="padding:8px 12px;font-size:11px;font-family:Arial,sans-serif;color:#8a7e5c;text-transform:uppercase;letter-spacing:1px;text-align:left;background:#f7f4ee;">Wine</th>
              <th style="padding:8px 12px;font-size:11px;font-family:Arial,sans-serif;color:#8a7e5c;text-transform:uppercase;letter-spacing:1px;text-align:center;background:#f7f4ee;">Qty</th>
            </tr>
            ${wineRows}
          </table>
        </td></tr>
        <tr><td style="background:#f7f4ee;padding:20px 40px;text-align:center;border-top:1px solid #e8e4dc;">
          <p style="margin:0;font-size:11px;font-family:Arial,sans-serif;color:#a09880;letter-spacing:1px;">Terra Trionfo · Boston, MA</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function inquiryConfirmationHtml(data: WineInquiryData): string {
  const wineList = data.items.map((i) =>
    `<li style="padding:4px 0;font-size:14px;color:#3a3220;font-family:Georgia,serif;">${i.name}</li>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Inquiry Received</title></head>
<body style="margin:0;padding:0;background:#f7f4ee;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ee;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #d9d4c7;max-width:600px;width:100%;">
        <tr><td style="background:#2d3a1f;padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#c8b97a;font-size:11px;letter-spacing:4px;text-transform:uppercase;">Terra Trionfo</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:normal;letter-spacing:1px;">Inquiry Received</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 20px;font-size:16px;color:#3a3220;line-height:1.6;">Dear ${data.firstName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#5c5840;line-height:1.7;">Thank you for your interest in our curated portfolio. We have received your inquiry and a member of our team will be in touch with you shortly.</p>
          <p style="margin:0 0 12px;font-size:12px;font-family:Arial,sans-serif;color:#8a7e5c;text-transform:uppercase;letter-spacing:2px;">Wines Under Consideration</p>
          <ul style="margin:0 0 28px;padding:0 0 0 20px;list-style:disc;">
            ${wineList}
          </ul>
          <p style="margin:0;font-size:14px;color:#5c5840;line-height:1.7;">These wines represent our forthcoming portfolio of small-production Italian estates. We will reach out directly as selections become available for U.S. import.</p>
        </td></tr>
        <tr><td style="background:#f7f4ee;padding:28px 40px;text-align:center;border-top:1px solid #e8e4dc;">
          <p style="margin:0 0 6px;font-size:13px;color:#5c5840;font-family:Georgia,serif;font-style:italic;">Terra Trionfo</p>
          <p style="margin:0;font-size:11px;font-family:Arial,sans-serif;color:#a09880;letter-spacing:1px;">Boston, MA · <a href="https://terratrionfo.com" style="color:#a09880;">terratrionfo.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendWineInquiryEmails(data: WineInquiryData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping inquiry emails. Inquiry from:', data.email)
    return
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const teamEmail = process.env.INQUIRY_NOTIFY_EMAIL || 'contact@terratrionfo.com'

    await Promise.all([
      resend.emails.send({
        from:    FROM,
        to:      teamEmail,
        subject: `New wine inquiry from ${data.firstName} (${data.accountType})`,
        html:    inquiryNotificationHtml(data),
        replyTo: data.email,
      }),
      resend.emails.send({
        from:    FROM,
        to:      data.email,
        subject: 'Your Terra Trionfo wine inquiry',
        html:    inquiryConfirmationHtml(data),
      }),
    ])
  } catch (err) {
    console.error('[email] Unexpected error sending inquiry emails:', err)
  }
}
