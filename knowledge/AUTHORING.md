# Curriculum Markdown authoring

Chapter content supports GitHub-Flavored Markdown. Use headings in order (`##`, `###`, and `####`), short paragraphs, lists, tables, links, and fenced code blocks.

Use these blockquote labels for semantic teaching notes:

```md
> **Tip:** Use the present simple for routines.
> **Important:** The word order changes in a question.
> **Example:** Do you work here?
> **Remember:** Practice the phrase aloud.
```

The renderer adds accessible heading anchors, preserves highlighted English phrases wrapped in single asterisks for pronunciation, and makes GFM tables horizontally scrollable on small screens. Do not put sensitive data, audio, or learner responses in curriculum Markdown.

---

## Activities (`activities.json`)

Each chapter has an `activities.json` file — a JSON array of activity objects validated by `features/activities/contracts.ts`. Run `pnpm activities:validate` after editing.

### Activity object shape

```json
{
  "id": "m1-ch2-listening",
  "type": "listening",
  "title": "Listen and Choose",
  "description": "Listen and choose the correct answer.",
  "props": { }
}
```

**ID convention:** `{chapterId}-{type}` (e.g. `m5-ch3-listening`). Never reuse IDs.

### Standard bundle (6–8 activities per chapter)

| Order | Type | Purpose |
|-------|------|---------|
| 1 | `flashcard` | Key vocabulary or forms |
| 2 | `word-match` | Associations from the chapter |
| 3 | `quiz` | 5–8 MC + fill-blank questions from `chapter.md` |
| 4 | `sentence-builder` | 3–5 sentences from the topic |
| 5 | `word-scramble` | Chapter vocabulary |
| 6 | `listening` | 3 items with `audioText` from the chapter |
| 7 | `dictation` | 3 short phrases aligned to the level |
| 8 | `pronunciation` | 3–5 phrases with phonetic or usage hints |

Reference implementation: `knowledge/modules/modulo-1/chapters/m1-ch1/activities.json`.

### Pedagogical matrix

| Chapter focus | Priority types |
|---------------|----------------|
| Alphabet / sounds / spelling | listening, dictation, pronunciation |
| Thematic vocabulary | word-match, word-scramble |
| Grammar (tenses, modals) | quiz fill-blank, sentence-builder |
| Connectors / cohesion | quiz, sentence-builder |
| Dialogues / situations | listening, pronunciation, quiz |
| Advanced listening | listening (3+ items), quiz inferential, dictation |
| Oral/written production | pronunciation, dictation, sentence-builder |

### Module coverage rules

| Module | Audio/oral requirement |
|--------|------------------------|
| 1 | listening + pronunciation + dictation in all 6 chapters |
| 2–7 | listening in ≥4/6 chapters; sentence-builder in ≥4/6 |
| 8 | all 4 audio/oral types in all 5 chapters |
| 9 | listening + pronunciation in all; dictation in ch2, ch4 |
| 10 | sentence-builder in ch3, ch4; listening in narrative chapters |
| 11 | sentence-builder in all |
| 12 | listening + pronunciation in all 5 chapters |
| 13 | listening + pronunciation in ≥4; dictation in email/note chapters |
| 14 | listening + pronunciation in ≥3 chapters |

### Quality checklist

- [ ] Quiz questions reference vocabulary or rules from the same `chapter.md`
- [ ] `explanation` fields are in English
- [ ] `listening`/`dictation` use phrases from the chapter, not generic filler
- [ ] `pronunciation` prioritizes sounds that confuse Spanish speakers
- [ ] No duplicate items across flashcard, word-match, and word-scramble in the same chapter

### JSON templates

**listening** (3 items):

```json
{
  "id": "mX-chY-listening",
  "type": "listening",
  "title": "Listen and Choose",
  "description": "Listen and choose the correct answer.",
  "props": {
    "items": [
      {
        "id": "l1",
        "audioText": "Hello",
        "question": "What did you hear?",
        "options": ["Hello", "Goodbye", "Thanks", "Please"],
        "correct": 0,
        "explanation": "Hello is a universal greeting."
      }
    ]
  }
}
```

**dictation** (3 items):

```json
{
  "id": "mX-chY-dictation",
  "type": "dictation",
  "title": "Dictation Practice",
  "description": "Listen and write what you hear.",
  "props": {
    "items": [
      { "id": "d1", "audioText": "My name is Ana.", "hint": "Introduction phrase" }
    ]
  }
}
```

**pronunciation** (3–5 items):

```json
{
  "id": "mX-chY-pronunciation",
  "type": "pronunciation",
  "title": "Speaking Practice",
  "description": "Listen to the model audio and repeat each phrase aloud.",
  "props": {
    "items": [
      {
        "id": "p1",
        "phrase": "ship",
        "audio": {
          "src": "/audio/curated/ship.mp3",
          "transcript": "ship",
          "speaker": "Curated voice",
          "accent": "US English",
          "defaultRate": 1,
          "altText": "Short /ɪ/ vowel — revealed after the learner responds."
        },
        "contrastPair": {
          "label": "Vowel length contrast",
          "wordA": "ship",
          "wordB": "sheep",
          "phoneme": "/ɪ/ vs /iː/",
          "tip": "Keep ship short; stretch sheep slightly longer."
        },
        "hint": "Say ship with a short, relaxed vowel."
      }
    ]
  }
}
```

### Curated audio fields

| Field | Required | Notes |
|-------|----------|-------|
| `audio.src` | When using curated audio | Must start with `/audio/` or `http(s)://` |
| `audio.transcript` | Yes with curated audio | Revealed after the learner answers |
| `audio.speaker` | Optional | Displayed in the player badge |
| `audio.accent` | Optional | Displayed with speaker metadata |
| `audio.defaultRate` | Optional | `0.75`, `1`, or `1.25` |
| `audio.altText` | Recommended | Pedagogical note revealed post-answer |
| `mode` | Optional on listening | `guided` (TTS practice) or `evaluation` (recorded audio) |
| `contrastPair` | Optional on pronunciation | Include at least two contrast items per chapter when used |

Keep `audioText` / `phrase` as TTS fallback text when curated audio is unavailable.

### Authoring workflow

1. Read `chapter.md` — extract objectives, tables, example phrases
2. Compare with existing `activities.json` — note missing types
3. Add missing audio/oral activities (priority: listening, dictation, pronunciation)
4. Run `pnpm activities:validate`
5. Test: `/learn?moduleId=modulo-X&chapterId=mX-chY&activityId=mX-chY-listening`
6. Run `pnpm kb:embed` only if chapter markdown changed

---

## Activity runtime contract

Activity types are registered in `features/activities/registry.ts` with a versioned runtime contract (`ACTIVITY_RUNTIME_CONTRACT_VERSION`). The shell in `/learn` reads declared capabilities to enable controls and emit normalized runtime events.

### Capabilities

| Capability | Declare when |
|------------|--------------|
| `hint` | The activity exposes editorial or graduated hints (`word-scramble`, `dictation`, `pronunciation`) |
| `progress` | The activity reports per-item progress (all current types) |
| `snapshot` | The activity supports pause/resume via snapshot payloads (all current types) |
| `itemFeedback` | The activity can explain per-item results (`quiz`, `listening`, `branching-dialogue`) |
| `difficulty` | The activity supports adaptive variants (reserved for future types) |
| `keyboard` | Keyboard-operable controls are available |
| `audio` | Audio playback is required (`flashcard`, `listening`, `dictation`) or optional (`branching-dialogue`) |
| `microphone` | Microphone input is required (`pronunciation`) |
| `review` | Weak items can feed spaced-repetition review queues |

### Checklist for a new activity type

1. Add props schema in `features/activities/contracts.ts`
2. Implement renderer in `components/games/`
3. Add snapshot contract in `features/activities/snapshots/`
4. Register the type in `features/activities/registry.ts` with explicit capabilities
5. Wire the renderer in `components/learn/ActivityRenderer.tsx`
6. Add curriculum fixtures and run `pnpm activities:validate`
7. Extend `__tests__/activities/runtime-contract.test.ts` and `behavior-matrix.test.ts`

Runtime events (`started`, `itemAnswered`, `hintRequested`, `completed`, `abandoned`) are validated in `features/activities/runtime-contract.ts` and emitted by `ActivityRenderer`.

### Graduated hints (3 levels)

Activities with the `hint` capability use editorial content for levels 1–3:

| Level | UI label | Authoring |
|-------|----------|-----------|
| 1 | Reminder | `hint` field (and `category` for word-scramble) |
| 2 | Partial | Derived by the shell (first letter/words) — no extra authoring |
| 3 | Explanation | Full answer — learner must confirm before reveal |

Set `hintLevels: 3` in the registry. Hint level is persisted in the activity snapshot for resume.

### `branching-dialogue`

Use for situational and pragmatic practice: greetings, travel, interviews, negotiations.

| Field | Required | Notes |
|-------|----------|-------|
| `setting` | Yes | Situational context shown throughout the activity |
| `characters` | Optional | `{ id, name, role? }` for speaker labels |
| `startNodeId` | Yes | Must match a node `id` |
| `nodes` | Yes | 2–8 nodes; include at least two decision nodes and one terminal node |
| `nodes[].intention` | Yes | Communicative goal shown as “Your goal” |
| `nodes[].prompt` | Yes | Interlocutor line |
| `nodes[].choices` | Yes on decision nodes | 2–4 options with `pragmaticRating`, `explanation`, and `nextNodeId` |
| `nodes[].isTerminal` | Optional | Terminal nodes have no choices and close the dialogue |
| `choices[].pragmaticRating` | Yes | `optimal`, `acceptable`, or `inappropriate` |
| `choices[].grammaticalRating` | Optional | `correct` or `incorrect` — separates grammar from pragmatics in results |
| `choices[].consequence` | Optional | Short narrative outcome after the choice |
| `choices[].explanation` | Yes | Pedagogical feedback |

Pilot chapters: `m1-ch2-branching-dialogue`, `m9-ch1-branching-dialogue`, `m13-ch1-branching-dialogue`.

Example skeleton:

```json
{
  "id": "m1-ch2-branching-dialogue",
  "type": "branching-dialogue",
  "title": "Office Introductions",
  "description": "Choose appropriate greetings in a first-day scenario.",
  "props": {
    "setting": "First day at a new office.",
    "startNodeId": "n1",
    "nodes": [
      {
        "id": "n1",
        "intention": "Respond warmly and introduce yourself.",
        "prompt": "Hey! You must be the new hire.",
        "choices": [
          {
            "id": "c1",
            "text": "Hi! Nice to meet you. I'm Ana.",
            "nextNodeId": "end",
            "pragmaticRating": "optimal",
            "explanation": "Friendly and complete."
          },
          {
            "id": "c2",
            "text": "Yeah, what?",
            "nextNodeId": "end",
            "pragmaticRating": "inappropriate",
            "explanation": "Too rude for a workplace greeting."
          }
        ]
      },
      {
        "id": "end",
        "intention": "Close positively.",
        "prompt": "See you at the team meeting.",
        "isTerminal": true,
        "choices": []
      }
    ]
  }
}
```
