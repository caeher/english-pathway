# Activity control bar

Every activity rendered through `ActivityRenderer` includes the same sticky control bar:

- Instructions toggle contextual keyboard/recovery guidance.
- Need help requests a graduated tutor hint when the activity shell provides it.
- Restart confirms that only the current attempt will be cleared, then remounts the game without changing the activity panel or tutor context.
- Skip and Exit confirm that the attempt remains unfinished and can be resumed from Learn, then close the panel safely.

The bar uses native buttons in a consistent tab order, wraps on narrow screens, and remains visible while activity content scrolls.
