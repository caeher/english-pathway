# Activity control bar

Every activity rendered through `ActivityRenderer` includes the same sticky control bar:

- Instructions toggle contextual guidance based on declared accessibility capabilities (`keyboard`, `audio`, `microphone`).
- Need help appears only when the activity declares the `hint` capability and the shell provides a tutor help handler.
- Restart confirms that only the current attempt will be cleared, then remounts the game without changing the activity panel or tutor context.
- Skip and Exit confirm that the attempt remains unfinished and can be resumed from Learn, then close the panel safely.

The bar uses native buttons in a consistent tab order, wraps on narrow screens, and remains visible while activity content scrolls.

Capability declarations live in `features/activities/registry.ts`. See `knowledge/AUTHORING.md` for the runtime contract checklist.
