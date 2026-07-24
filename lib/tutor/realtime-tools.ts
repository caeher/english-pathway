export const TUTOR_REALTIME_TOOLS = [
  {
    type: 'function',
    name: 'showGrammar',
    description: 'Show a concise grammar explanation in the learning panel on the right.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', maxLength: 160 },
        markdown: { type: 'string', maxLength: 12000 },
      },
      required: ['title', 'markdown'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'showActivity',
    description: 'Show a curriculum activity by its validated ID. Use listChapterActivities or fetchCurriculumContext to find valid IDs.',
    parameters: {
      type: 'object',
      properties: { activityId: { type: 'string', maxLength: 160 } },
      required: ['activityId'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'showQuestion',
    description: 'Show a multiple-choice question in the learning panel.',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', maxLength: 1000 },
        options: { type: 'array', items: { type: 'string', maxLength: 300 }, maxItems: 8 },
        correctIndex: { type: 'integer', minimum: 0, maximum: 7 },
      },
      required: ['prompt', 'options', 'correctIndex'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'clearPanel',
    description: 'Clear the learning panel when changing topics.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    type: 'function',
    name: 'fetchCurriculumContext',
    description: 'Retrieve relevant English Pathway curriculum context including activity IDs.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', maxLength: 500 },
        moduleId: { type: 'string', maxLength: 100 },
        chapterId: { type: 'string', maxLength: 100 },
        matchCount: { type: 'integer', minimum: 1, maximum: 5 },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'listChapterActivities',
    description: 'List all activities available in a chapter with their validated IDs.',
    parameters: {
      type: 'object',
      properties: { chapterId: { type: 'string', maxLength: 160 } },
      required: ['chapterId'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'getPanelState',
    description: 'Get the current state of the learning panel to verify a tool call succeeded.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
] as const
