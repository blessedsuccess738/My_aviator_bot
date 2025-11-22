export const COUPON_CODES: Record<string, number> = {
  'QARTU2': 3000,
  'SENTAY': 5000,
  'MIRADO': 10000,
  'KELTOR': 15000,
  'FANTRY9': 20000,
  'BALTEX3': 30000,
  'ZERNAP': 50000,
  'HARTUQ': 80000,
  'VEXTON5': 100000,
  'LARIMO7': 150000
}

export function validateCoupon(couponCode: string): number | null {
  const upperCode = couponCode.toUpperCase()
  return COUPON_CODES[upperCode] || null
}

export function isValidCoupon(couponCode: string): boolean {
  return validateCoupon(couponCode) !== null
}