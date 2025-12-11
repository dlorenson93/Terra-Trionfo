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
