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

### Standard bundle (8–10 activities per chapter)

| Order | Type | Purpose |
|-------|------|---------|
| 1 | `svg-scene` | Visual map of the concept |
| 2 | `flashcard` | Key vocabulary or forms |
| 3 | `word-match` | Associations from the chapter |
| 4 | `quiz` | 5–8 MC + fill-blank questions from `chapter.md` |
| 5 | `sentence-builder` | 3–5 sentences from the topic |
| 6 | `word-scramble` | Chapter vocabulary |
| 7 | `listening` | 3 items with `audioText` from the chapter |
| 8 | `dictation` | 3 short phrases aligned to the level |
| 9 | `pronunciation` | 3–5 phrases with phonetic or usage hints |
| 10 | `drag-drop` | `match` for vocab or `sentence` for word order |

Reference implementation: `knowledge/modules/modulo-1/chapters/m1-ch1/activities.json`.

### Pedagogical matrix

| Chapter focus | Priority types |
|---------------|----------------|
| Alphabet / sounds / spelling | listening, dictation, pronunciation |
| Thematic vocabulary | word-match, word-scramble, drag-drop match |
| Grammar (tenses, modals) | svg-scene, quiz fill-blank, sentence-builder, drag-drop sentence |
| Connectors / cohesion | quiz, drag-drop sentence, sentence-builder |
| Dialogues / situations | listening, pronunciation, quiz |
| Advanced listening | listening (3+ items), quiz inferential, dictation |
| Oral/written production | pronunciation, dictation, sentence-builder |

### Module coverage rules

| Module | Audio/oral requirement |
|--------|------------------------|
| 1 | listening + pronunciation + dictation in all 6 chapters |
| 2–7 | listening in ≥4/6 chapters; drag-drop sentence in ≥4/6 |
| 8 | all 4 audio/oral types in all 5 chapters |
| 9 | listening + pronunciation in all; dictation in ch2, ch4 |
| 10 | drag-drop sentence in ch3, ch4; listening in narrative chapters |
| 11 | drag-drop + sentence-builder in all |
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
  "title": "Practice Pronunciation",
  "description": "Listen and repeat the phrases.",
  "props": {
    "items": [
      { "id": "p1", "phrase": "Nice to meet you", "hint": "Standard greeting when meeting someone new" }
    ]
  }
}
```

**drag-drop match:**

```json
{
  "id": "mX-chY-dragdrop",
  "type": "drag-drop",
  "title": "Drag and Match",
  "description": "Drag items to their correct match.",
  "props": {
    "mode": "match",
    "pairs": [{ "left": "Hello", "right": "Hi!" }]
  }
}
```

**drag-drop sentence:**

```json
{
  "id": "mX-chY-dragdrop",
  "type": "drag-drop",
  "title": "Build the Sentence",
  "description": "Drag words into the correct order.",
  "props": {
    "mode": "sentence",
    "sentences": [
      { "prompt": "Greeting:", "words": ["Hello", "how", "are", "you"], "correct": "Hello how are you" }
    ]
  }
}
```

### Authoring workflow

1. Read `chapter.md` — extract objectives, tables, example phrases
2. Compare with existing `activities.json` — note missing types
3. Add 3–4 new activities (priority: listening, dictation, pronunciation, drag-drop)
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
| `itemFeedback` | The activity can explain per-item results (`quiz`, `listening`) |
| `difficulty` | The activity supports adaptive variants (reserved for future types) |
| `keyboard` | Keyboard-operable controls are available |
| `audio` | Audio playback is required (`flashcard`, `listening`, `dictation`) |
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
