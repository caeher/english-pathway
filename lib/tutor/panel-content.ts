import { z } from 'zod'

export const PANEL_CONTENT_LIMITS = {
  maxBlocks: 24,
  maxTotalChars: 12_000,
  maxBlockText: 2_000,
  maxListItems: 12,
  maxListItemChars: 500,
  maxTitleChars: 160,
} as const

const UNSAFE_URL_PATTERN = /(?:https?:\/\/|www\.|javascript:|data:)/i
const UNSAFE_HTML_ATTR_PATTERN = /\bon\w+\s*=/i
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/

export function isSafePanelText(value: string, options?: { allowNewlines?: boolean }): boolean {
  if (!value || value.length > PANEL_CONTENT_LIMITS.maxBlockText) return false
  if (!options?.allowNewlines && value.includes('\n')) return false
  if (options?.allowNewlines && /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) return false
  if (!options?.allowNewlines && CONTROL_CHAR_PATTERN.test(value)) return false
  if (/[<>]/.test(value)) return false
  if (UNSAFE_URL_PATTERN.test(value)) return false
  if (UNSAFE_HTML_ATTR_PATTERN.test(value)) return false
  return true
}

function safeTextSchema(options?: { allowNewlines?: boolean }) {
  return z
    .string()
    .min(1)
    .max(PANEL_CONTENT_LIMITS.maxBlockText)
    .refine((value) => isSafePanelText(value, options), 'Unsafe panel text')
}

const headingBlockSchema = z.object({
  type: z.literal('heading'),
  level: z.union([z.literal(2), z.literal(3)]),
  text: safeTextSchema(),
})

const paragraphBlockSchema = z.object({
  type: z.literal('paragraph'),
  text: safeTextSchema({ allowNewlines: true }),
})

const exampleBlockSchema = z.object({
  type: z.literal('example'),
  text: safeTextSchema(),
})

const listBlockSchema = z.object({
  type: z.literal('list'),
  items: z
    .array(safeTextSchema())
    .min(1)
    .max(PANEL_CONTENT_LIMITS.maxListItems),
})

const emphasisBlockSchema = z.object({
  type: z.literal('emphasis'),
  text: safeTextSchema({ allowNewlines: true }),
})

export const panelBlockSchema = z.discriminatedUnion('type', [
  headingBlockSchema,
  paragraphBlockSchema,
  exampleBlockSchema,
  listBlockSchema,
  emphasisBlockSchema,
])

export type PanelBlock = z.infer<typeof panelBlockSchema>

export function countPanelBlockChars(block: PanelBlock): number {
  switch (block.type) {
    case 'list':
      return block.items.reduce((sum, item) => sum + item.length, 0)
    default:
      return block.text.length
  }
}

export function countPanelContentChars(blocks: PanelBlock[]): number {
  return blocks.reduce((sum, block) => sum + countPanelBlockChars(block), 0)
}

export const panelContentSchema = z
  .array(panelBlockSchema)
  .min(1)
  .max(PANEL_CONTENT_LIMITS.maxBlocks)
  .refine(
    (blocks) => countPanelContentChars(blocks) <= PANEL_CONTENT_LIMITS.maxTotalChars,
    'Panel content exceeds total character limit',
  )

export function deriveSpeakableText(blocks: PanelBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'list':
          return block.items.join('. ')
        default:
          return block.text
      }
    })
    .join('. ')
}

export const PANEL_REJECTION_NOTICE =
  'This explanation could not be shown. Your tutor will try again with a simpler format.'
