# Learning continuation

`getLearningContinuation` is the single decision model used by dashboard, curriculum, and the Learn continuation prompt.

1. Due reviews take priority so recall work is not hidden.
2. Otherwise, a valid persisted module/chapter/activity target is resumed through `learnHref`.
3. New learners are directed to curriculum selection.
4. Learners who completed every chapter are directed to review for maintenance.

The continuation target keeps module, chapter, and activity identifiers in the URL. Curriculum chapter pages retain direct practice, previous/next chapter navigation, completion guidance, and a return link; review's empty state returns safely to Learn.
