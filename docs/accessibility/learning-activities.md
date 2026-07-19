# Learning activity accessibility notes

All activity controls have a visible focus style through the shared focus treatment. Pointer input is optional: native controls operate with Enter/Space, and drag-oriented activities expose selection workflows.

| Activity | Keyboard-only path | Screen-reader feedback |
| --- | --- | --- |
| Quiz | Tab to an answer or text field; Enter submits text | Correctness announced after each answer |
| Flashcard | Tab to flip, navigation, known, reset, and pronunciation controls | Current card, face, and known count announced |
| Word match | Select a word then its translation with Enter/Space | Match count and incorrect attempts announced |
| Sentence builder | Add/remove words with buttons; check and continue | Selected word count and result announced |
| SVG scene | Tab through objects; Enter/Space discovers each one | Focused object and discovery count announced |
| Word scramble | Tab through letters and clear control | Native button labels expose each letter and completion result |
| Listening | Play/replay audio then select an answer | Correctness announced after selection |
| Dictation | Replay audio, type response, submit, continue | Correctness announced after submission |
| Pronunciation | Use mic button or text-verification fallback | Transcript, errors, and score are announced |
| Drag/drop match and sentence | Use selection buttons to pair/add/remove; dragging is optional | Pair/sentence progress and result announced |

Manual verification: navigate each activity using only Tab, Shift+Tab, Enter, and Space at desktop and mobile-width layouts; verify that focus stays visible, the action can complete, and a screen reader receives the listed status update.
