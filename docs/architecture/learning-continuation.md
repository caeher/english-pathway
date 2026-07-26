# Learning continuation

`getLearningContinuation` is the single decision model used by dashboard, curriculum, and the Learn continuation prompt.

1. Due reviews take priority so recall work is not hidden.
2. Otherwise, a valid persisted module/chapter/activity target resumes through `curriculumChapterHref` (structured pathway).
3. New learners are directed to curriculum selection.
4. Learners who completed every chapter are directed to review for maintenance.

Resume links open the chapter in `/curriculum`; they never deep-link into `/learn` with curriculum query params. `/learn` is always a free-form tutor session — the agent may show activities only by invoking validated client tools during conversation.

Curriculum chapter pages retain chapter navigation, completion guidance, and exercise entry points. Review's empty state returns safely to Learn.
