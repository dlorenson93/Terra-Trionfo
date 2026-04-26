import { prisma } from '@/lib/prisma'
import { MembershipTier, ProductReleaseStatus, SubscriptionStatus } from '@prisma/client'

export const MEMBERSHIP_TIERS: Record<MembershipTier, { label: string; bottlesPerMonth: number }> = {
  APERTURA: { label: 'Apertura', bottlesPerMonth: 2 },
  COLLEZIONE: { label: 'Collezione', bottlesPerMonth: 3 },
  RISERVA: { label: 'Riserva', bottlesPerMonth: 4 },
}

export const getStripePriceId = (tier: MembershipTier): string => {
  const mapping: Record<MembershipTier, string | undefined> = {
    APERTURA: process.env.STRIPE_PRICE_APERTURA,
    COLLEZIONE: process.env.STRIPE_PRICE_COLLEZIONE,
    RISERVA: process.env.STRIPE_PRICE_RISERVA,
  }

  const priceId = mapping[tier]
  if (!priceId) {
    throw new Error(`Missing Stripe price ID for membership tier ${tier}`)
  }

  return priceId
}

export const isValidMembershipTier = (value: string): value is MembershipTier =>
  ['APERTURA', 'COLLEZIONE', 'RISERVA'].includes(value)

export const resolveMembershipSelectionValidation = async (
  tier: MembershipTier,
  month: number,
  year: number,
) => {
  const selections = await prisma.subscriptionSelection.findMany({
    where: { tier, month, year },
    include: { product: true },
  })

  const issues: string[] = []
  const productRequirements: Record<string, { required: number; inventory: number; releaseStatus: ProductReleaseStatus; allocationRemaining: number }> = {}

  if (selections.length === 0) {
    issues.push('No curated selections defined for this tier and period.')
    return { valid: false, issues, selections }
  }

  for (const selection of selections) {
    const required = selection.quantity
    productRequirements[selection.productId] = {
      required,
      inventory: selection.product.inventory,
      releaseStatus: selection.product.releaseStatus,
      allocationRemaining: selection.product.allocationRemaining,
    }

    if (selection.product.releaseStatus === 'SOLD_OUT') {
      issues.push(`Product ${selection.product.name} is SOLD_OUT.`)
    }

    if (selection.product.releaseStatus === 'ALLOCATED' && selection.product.allocationRemaining < required) {
      issues.push(`Product ${selection.product.name} has only ${selection.product.allocationRemaining} allocation remaining.`)
    }

    if (selection.product.inventory < required) {
      issues.push(`Product ${selection.product.name} has insufficient inventory (${selection.product.inventory} < ${required}).`)
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    selections,
    productRequirements,
  }
}

export const validateTierSelection = async (
  tier: MembershipTier,
  month: number,
  year: number,
) => {
  return resolveMembershipSelectionValidation(tier, month, year)
}

const buildOrderItemsFromSelection = (selections: Array<any>, products: Array<any>) =>
  selections.map((selection) => {
    const product = products.find((product) => product.id === selection.productId) as any
    return {
      productId: selection.productId,
      quantity: selection.quantity,
      unitPrice: product.retailPriceCents / 100,
      commerceModel: product.commerceModel,
    }
  })

export const generateSubscriptionShipmentForSubscription = async (
  subscriptionId: string,
  month: number,
  year: number,
  createdBy: string,
) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  })

  if (!subscription) {
    return { success: false, message: 'Subscription not found' }
  }

  if (subscription.status !== 'ACTIVE') {
    return { success: false, message: 'Subscription is not active' }
  }

  const validation = await resolveMembershipSelectionValidation(subscription.tier, month, year)
  if (!validation.valid) {
    return { success: false, message: 'Selection validation failed', issues: validation.issues }
  }

  const products = await prisma.product.findMany({
    where: { id: { in: validation.selections.map((selection) => selection.productId) } },
  })

  const orderItems = buildOrderItemsFromSelection(validation.selections, products)
  const total = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  const result = await prisma.$transaction(async (tx) => {
    const shipment = await tx.subscriptionShipment.create({
      data: {
        subscriptionId: subscription.id,
        month,
        year,
        status: 'GENERATED',
        generatedAt: new Date(),
      },
    })

    const order = await tx.order.create({
      data: {
        userId: subscription.userId,
        total,
        orderType: 'SUBSCRIPTION',
        status: 'CONFIRMED',
        fulfillmentType: 'PICKUP',
        deliveryFeeCents: 0,
        subscriptionShipmentId: shipment.id,
        orderItems: {
          create: orderItems,
        },
      } as any,
    })

    for (const item of orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { inventory: { decrement: item.quantity } },
      })
    }

    await tx.subscriptionAuditLog.create({
      data: {
        action: 'GENERATE_SUBSCRIPTION_SHIPMENT',
        entityType: 'Subscription',
        entityId: subscription.id,
        details: {
          shipmentId: shipment.id,
          orderId: order.id,
          month,
          year,
          items: orderItems,
        },
        createdBy,
      },
    })

    return { shipment, order }
  })

  return {
    success: true,
    message: 'Subscription shipment generated successfully.',
    shipment: result.shipment,
    order: result.order,
  }
}

export const generateSubscriptionShipments = async (
  tier: MembershipTier,
  month: number,
  year: number,
  createdBy: string,
) => {
  const validation = await resolveMembershipSelectionValidation(tier, month, year)
  if (!validation.valid) {
    return {
      success: false,
      message: 'Selection validation failed. Fix inventory, allocation, or release issues before shipment generation.',
      issues: validation.issues,
      generated: 0,
    }
  }

  const activeSubscriptions = await prisma.subscription.findMany({
    where: { tier, status: 'ACTIVE' },
  })

  if (activeSubscriptions.length === 0) {
    return {
      success: false,
      message: 'No active subscriptions found for this tier.',
      generated: 0,
    }
  }

  const selections = validation.selections
  const requiredTotals = selections.reduce((acc, selection) => {
    acc[selection.productId] = (acc[selection.productId] ?? 0) + selection.quantity * activeSubscriptions.length
    return acc
  }, {} as Record<string, number>)

  const products = await prisma.product.findMany({
    where: { id: { in: Object.keys(requiredTotals) } },
  })

  const insufficient = products.filter((product) => (product.inventory ?? 0) < (requiredTotals[product.id] ?? 0))
  if (insufficient.length > 0) {
    return {
      success: false,
      message: 'Insufficient inventory for the current curated selection across all active subscriptions.',
      issues: insufficient.map((product) => `Product ${product.name} inventory ${product.inventory} is less than required ${requiredTotals[product.id]}.`),
      generated: 0,
    }
  }

  let generatedCount = 0
  const createOrderData = async (subscription: any) => {
    const orderItems = selections.map((selection) => {
      const product = products.find((product) => product.id === selection.productId) as any
      return {
        productId: selection.productId,
        quantity: selection.quantity,
        unitPrice: product.retailPriceCents / 100,
        commerceModel: product.commerceModel,
      }
    })

    return {
      userId: subscription.userId,
      total: orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      orderType: 'SUBSCRIPTION',
      status: 'CONFIRMED',
      fulfillmentType: 'PICKUP',
      deliveryFeeCents: 0,
      orderItems: {
        create: orderItems,
      },
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const subscription of activeSubscriptions) {
      const shipment = await tx.subscriptionShipment.create({
        data: {
          subscriptionId: subscription.id,
          month,
          year,
          status: 'GENERATED',
          generatedAt: new Date(),
        },
      })

      const order = await tx.order.create({
        data: {
          ...await createOrderData(subscription),
          subscriptionShipmentId: shipment.id,
        } as any,
      })

      for (const selection of selections) {
        await tx.product.update({
          where: { id: selection.productId },
          data: {
            inventory: {
              decrement: selection.quantity,
            },
          },
        })
      }

      await tx.subscriptionAuditLog.create({
        data: {
          action: 'GENERATE_SHIPMENT',
          entityType: 'SubscriptionShipment',
          entityId: shipment.id,
          details: {
            subscriptionId: subscription.id,
            orderId: order.id,
            month,
            year,
            items: selections.map((selection) => ({ productId: selection.productId, quantity: selection.quantity })),
          },
          createdBy,
        },
      })

      generatedCount += 1
    }
  })

  return {
    success: true,
    message: `Generated ${generatedCount} subscription shipments for ${tier} ${month}/${year}.`,
    generated: generatedCount,
  }
}

export const logMembershipAudit = async (
  action: string,
  entityType: string,
  entityId: string,
  details: any,
  createdBy: string,
) => {
  await prisma.subscriptionAuditLog.create({
    data: { action, entityType, entityId, details, createdBy },
  })
}
