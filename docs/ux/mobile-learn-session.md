# Mobile learning session

The learn route uses a focused stacked layout below the desktop breakpoint.

- Tutor controls occupy at most 58dvh and scroll independently, so the current mode, recovery controls, and text input remain reachable at 320px width and with a virtual keyboard.
- The activity panel remains mounted below the tutor; it receives the remaining space and its own scroll area. No bottom-sheet overlay can cover activity controls or reset local game progress.
- Dynamic viewport units avoid browser-chrome jumps, while safe-area padding keeps the final action clear of device cutouts and home indicators.
- When the tutor replaces panel content, focus moves to its labelled heading without forcing a desktop scroll; keyboard users retain a predictable activity entry point.

Manual verification: test 320px portrait, 390px portrait, 768px tablet, landscape, and an open virtual keyboard. Check that start/end, text input, activity actions, help, close, and recovery controls remain visible or reachable by one scroll.
