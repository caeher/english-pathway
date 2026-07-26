import { describe, expect, it } from 'vitest'
import { getMissingLegalConsentsForClient } from '@/lib/auth/required-consent'

describe('required legal consent', () => {
  it('returns published documents missing from user consent records', async () => {
    const supabase = {
      from: (table: string) => {
        if (table === 'legal_documents') {
          return {
            select: () => ({
              in: () => ({
                not: async () => ({
                  data: [
                    { id: 'terms-id', type: 'terms', version: '1.2', slug: 'terms', title: 'Terms of Service' },
                    { id: 'privacy-id', type: 'privacy', version: '1.2', slug: 'privacy', title: 'Privacy Policy' },
                  ],
                  error: null,
                }),
              }),
            }),
          }
        }

        if (table === 'user_consents') {
          return {
            select: () => ({
              eq: async () => ({
                data: [{ legal_document_id: 'terms-id', document_version: '1.2' }],
                error: null,
              }),
            }),
          }
        }

        throw new Error(`Unexpected table ${table}`)
      },
    }

    const missing = await getMissingLegalConsentsForClient(supabase as never, 'user-1')
    expect(missing).toHaveLength(1)
    expect(missing[0]?.type).toBe('privacy')
    expect(missing[0]?.version).toBe('1.2')
  })
})
