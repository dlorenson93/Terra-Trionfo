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
