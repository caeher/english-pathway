export type CookieConsentChoice = 'essential' | 'analytics'

const COOKIE_CONSENT_KEY = 'english-pathway-cookie-consent'
const COOKIE_CONSENT_EVENT = 'english-pathway-cookie-consent-change'

export function getCookieConsent(): CookieConsentChoice | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(COOKIE_CONSENT_KEY)
  return value === 'essential' || value === 'analytics' ? value : null
}

export function hasAnalyticsConsent() {
  return getCookieConsent() === 'analytics'
}

export function setCookieConsent(choice: CookieConsentChoice) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(COOKIE_CONSENT_KEY, choice)
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT))
}

export function clearCookieConsent() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(COOKIE_CONSENT_KEY)
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT))
}

export { COOKIE_CONSENT_EVENT }
