import { z } from 'zod'

export const analyticsEventSchema = z.object({
  event_name: z.enum([
    'landing_cta_click', 'demo_activity_complete', 'demo_chapter_start', 'signup_complete', 'onboarding_step',
    'onboarding_view', 'onboarding_abandon', 'onboarding_skip', 'onboarding_complete', 'chapter_start',
    'chapter_complete', 'activity_complete', 'daily_goal_met', 'streak_lost', 'streak_saved', 'srs_review_complete',
    'game_complete', 'guest_signup_prompt_shown', 'guest_signup_prompt_click', 'learn_mode_select',
    'learn_microphone', 'learn_session_start', 'learn_session_end', 'learn_session_error',
  ]),
  properties: z.record(z.string().max(80), z.union([z.string().max(500), z.number(), z.boolean(), z.null()])).default({}).refine((value) => Object.keys(value).length <= 30, 'Too many analytics properties'),
  session_id: z.string().max(128).nullable().optional(),
})
