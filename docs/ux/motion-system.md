# Motion system

Motion serves one of two purposes: orienting learners after a navigation or panel change, and confirming an activity outcome. It never gates interaction or conveys information that is unavailable without animation.

| Context | Shared variant | Purpose |
| --- | --- | --- |
| Page transition | `pageTransition` | Preserve orientation while a route appears. |
| Dynamic learning panel | `panelTransition` | Clarify that a tutor request changed the active content. |
| Activity result | `resultTransition` | Confirm completion without a disruptive celebration. |

The common durations are 200ms for feedback, 240ms for panels, and 280ms for pages, using the same decelerating easing curve. `useReducedMotion` replaces these variants with an immediate visible state; confetti is already disabled for that preference. Game-specific direct-manipulation animations may remain local when they communicate an action such as placing a word or selecting a match.
