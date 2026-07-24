# ElevenLabs agent client tools setup

English Pathway registers client tools in code (`TutorClientTools.tsx`) and in the ElevenLabs agent dashboard. Names and parameters must match exactly.

## Required client tools

Register each tool as **Client** type with **Wait for response** enabled:

| Tool name | Purpose |
|-----------|---------|
| `showGrammar` | Display structured grammar blocks in the learning panel |
| `showActivity` | Show a curriculum activity by validated ID |
| `showQuestion` | Show a multiple-choice quick check |
| `clearPanel` | Clear the learning panel |
| `fetchCurriculumContext` | Retrieve curriculum content and activity IDs |
| `listChapterActivities` | List activities for a chapter |
| `getPanelState` | Read current panel state |

## Parameters

Match the Zod schemas in `lib/tutor/schemas.ts` and the OpenAI tool definitions in `lib/tutor/realtime-tools.ts`.

### showGrammar structured blocks

`showGrammar` accepts plain-text blocks only — no markdown or HTML:

- `heading`: `{ type: "heading", level: 2|3, text: "..." }`
- `paragraph`: `{ type: "paragraph", text: "..." }`
- `example`: `{ type: "example", text: "..." }`
- `list`: `{ type: "list", items: ["...", "..."] }`
- `emphasis`: `{ type: "emphasis", text: "..." }`

## Agent prompt

Include the teaching protocol from `lib/tutor/instructions.ts`: use panel tools to teach, never invent activity IDs, wait for activity completion before advancing.

## Verification

1. Start a text session on `/learn`
2. Ask the tutor to explain a grammar topic — the right panel should update with structured blocks
3. Ask for a quiz — tutor should call `listChapterActivities` or `fetchCurriculumContext`, then `showActivity`
4. Complete the activity — tutor should acknowledge the score
