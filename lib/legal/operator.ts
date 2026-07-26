export interface LegalOperatorConfig {
  operatorName: string
  privacyContactEmail: string
  supportContactEmail: string
  governingJurisdiction: string
}

function deriveHostEmail(localPart: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!appUrl) return `${localPart}@english-pathway.app`

  try {
    const hostname = new URL(appUrl).hostname
    const domain = hostname.replace(/^www\./, '')
    return `${localPart}@${domain}`
  } catch {
    return `${localPart}@english-pathway.app`
  }
}

export function getLegalOperatorConfig(): LegalOperatorConfig {
  return {
    operatorName: process.env.LEGAL_OPERATOR_NAME?.trim() || 'English Pathway',
    privacyContactEmail:
      process.env.LEGAL_PRIVACY_CONTACT_EMAIL?.trim() || deriveHostEmail('privacy'),
    supportContactEmail:
      process.env.LEGAL_SUPPORT_CONTACT_EMAIL?.trim() || deriveHostEmail('support'),
    governingJurisdiction:
      process.env.LEGAL_GOVERNING_JURISDICTION?.trim() || 'the jurisdiction of the service operator',
  }
}

export function formatLegalContactBlock(config: LegalOperatorConfig): string {
  return [
    `**Operator:** ${config.operatorName}`,
    `**Privacy contact:** ${config.privacyContactEmail}`,
    `**Support contact:** ${config.supportContactEmail}`,
    `**Governing law:** ${config.governingJurisdiction}`,
  ].join('\n')
}
