# Lesson Markdown and TTS performance

The largest current authored chapter is approximately 2.9 KB of Markdown. The rendering path is evaluated against that representative upper bound and against repeated parent updates while the same chapter remains open.

| Concern | Before | After | Guard |
| --- | --- | --- | --- |
| Markdown transform on unrelated parent updates | Recreated the Markdown renderer configuration each render | `MarkdownDocument` is memoized by `content`; wrapper class changes do not reparse content | `__tests__/lesson/markdown-tts.test.ts` |
| Optional media | Browser choice depended on image scheduling | Author images use lazy loading | Same regression test |
| Section change during playback | A global utterance could continue and a previous control could remain active | Content cleanup stops speech; subscribed buttons receive one shared active state | Same regression test |

Manual measurement: open the longest chapter, scroll its full length while changing tutor/panel state, start a pronunciation control, then switch chapter or close the panel. The scroll remains responsive, audio stops exactly once on the section change, and no control remains pressed after cancellation.
