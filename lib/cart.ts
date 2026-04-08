export interface CartItem {
  productId: string
  name: string
  imageUrl?: string
  price: number
  quantity: number
}

export const getCart = (): CartItem[] => {
  if (typeof window === 'undefined') return []
  const cart = localStorage.getItem('cart')
  return cart ? JSON.parse(cart) : []
}

export const addToCart = (item: CartItem) => {
  const cart = getCart()
  const existingItem = cart.find((i) => i.productId === item.productId)

  if (existingItem) {
    existingItem.quantity += item.quantity
  } else {
    cart.push(item)
  }

  localStorage.setItem('cart', JSON.stringify(cart))
}

export const updateCartItem = (productId: string, quantity: number) => {
  const cart = getCart()
  const item = cart.find((i) => i.productId === productId)
  if (item) {
    item.quantity = quantity
    localStorage.setItem('cart', JSON.stringify(cart))
  }
}

export const removeFromCart = (productId: string) => {
  const cart = getCart()
  const updatedCart = cart.filter((i) => i.productId !== productId)
  localStorage.setItem('cart', JSON.stringify(updatedCart))
}

export const clearCart = () => {
  localStorage.removeItem('cart')
}

export const getCartTotal = (): number => {
  const cart = getCart()
  return cart.reduce((total, item) => total + item.price * item.quantity, 0)
}

export const getCartCount = (): number => {
  const cart = getCart()
  return cart.reduce((total, item) => total + item.quantity, 0)
}

// ─── Inquiry basket (static / pre-import wines) ───────────────────────────────
// Stored separately from the purchase cart so the two flows never collide.

const INQUIRY_KEY = 'inquiry'

export const getInquiry = (): CartItem[] => {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(INQUIRY_KEY)
  return raw ? JSON.parse(raw) : []
}

export const addToInquiry = (item: CartItem) => {
  const inquiry = getInquiry()
  const existing = inquiry.find((i) => i.productId === item.productId)
  if (existing) {
    existing.quantity += item.quantity
  } else {
    inquiry.push(item)
  }
  localStorage.setItem(INQUIRY_KEY, JSON.stringify(inquiry))
}

export const removeFromInquiry = (productId: string) => {
  const updated = getInquiry().filter((i) => i.productId !== productId)
  localStorage.setItem(INQUIRY_KEY, JSON.stringify(updated))
}

export const clearInquiry = () => {
  localStorage.removeItem(INQUIRY_KEY)
}

export const getInquiryCount = (): number => {
  return getInquiry().reduce((total, item) => total + item.quantity, 0)
}
