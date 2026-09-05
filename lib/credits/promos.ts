export const REGISTERED_SEP_2026_PROMO = {
  key: 'registered_sep_2026',
  grantedSeconds: 2 * 60 * 60,
  validUntil: '2026-10-01T00:00:00.000Z',
} as const

export function isRegisteredSep2026PromoActive(now = Date.now()): boolean {
  return now < Date.parse(REGISTERED_SEP_2026_PROMO.validUntil)
}
