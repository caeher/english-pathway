# Activity control bar

Every activity rendered through `ActivityRenderer` includes the same sticky control bar:

- Instructions toggle contextual guidance based on declared accessibility capabilities (`keyboard`, `audio`, `microphone`).
- Need help appears when the activity declares the `hint` capability. The shell shows graduated hints in an in-panel tray before falling back to the tutor or English helper.
- Restart confirms that only the current attempt will be cleared, then remounts the game without changing the activity panel or tutor context.
- Skip and Exit confirm that the attempt remains unfinished and can be resumed from Learn, then close the panel safely.

The bar uses native buttons in a consistent tab order, wraps on narrow screens, and remains visible while activity content scrolls.

## Graduated hints

1. **Need help** advances through reminder → partial → explanation levels defined per activity type.
2. Level 3 (full answer) requires confirmation explaining the practice impact.
3. Hints render in `ActivityHintTray` below the control bar and work without a voice session.
4. When editorial hints are exhausted, the shell sends structured context to the voice tutor or English helper fallback.
5. Hint level persists in the activity snapshot for resume.

Capability declarations live in `features/activities/registry.ts`. See `knowledge/AUTHORING.md` for the runtime contract checklist.
