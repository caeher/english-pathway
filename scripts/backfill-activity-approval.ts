/**
 * Recomputes activity_completions.passed and chapter_completions from knowledge policy.
 * Run after deploy: pnpm backfill:approval [--dry-run] [--report=path.csv]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { loadAllModules } from '@/lib/knowledge/load-all'
import { evaluateActivityApproval } from '@/lib/curriculum/approval'
import { getChapterProgress } from '@/lib/curriculum/progress'
import type { Database } from '@/lib/supabase/database.types'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dryRun = process.argv.includes('--dry-run')
const reportArg = process.argv.find((arg) => arg.startsWith('--report='))
const reportPath = reportArg?.split('=')[1] ?? path.join(root, 'backfill-approval-report.csv')

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exitCode = 1
    return
  }

  const supabase = createClient<Database>(url, serviceKey)
  const modules = loadAllModules()
  const activityById = new Map(modules.flatMap((module) => module.chapters.flatMap((chapter) => chapter.activities.map((activity) => [activity.id, { activity, chapter }] as const))))

  const { data: rows, error } = await supabase.from('activity_completions').select('*')
  if (error) throw new Error(error.message)

  const report: string[] = ['user_id,activity_id,chapter_id,old_passed,new_passed,old_score,status']
  let updatedActivities = 0

  for (const row of rows ?? []) {
    const resolved = activityById.get(row.activity_id)
    if (!resolved) continue

    const approval = evaluateActivityApproval(resolved.activity, {
      finished: row.status === 'completed',
      scorePercent: row.score ?? undefined,
    })
    const newPassed = row.passed === true || approval.passed

    if (newPassed !== row.passed) {
      report.push(`${row.user_id},${row.activity_id},${row.chapter_id},${row.passed},${newPassed},${row.score ?? ''},${row.status}`)
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('activity_completions')
          .update({ passed: newPassed })
          .eq('user_id', row.user_id)
          .eq('activity_id', row.activity_id)
        if (updateError) throw new Error(updateError.message)
      }
      updatedActivities += 1
    }
  }

  const userIds = [...new Set((rows ?? []).map((row) => row.user_id))]
  let removedChapters = 0

  for (const userId of userIds) {
    const [{ data: chapterRows }, { data: activityRows }] = await Promise.all([
      supabase.from('chapter_completions').select('chapter_id').eq('user_id', userId),
      supabase.from('activity_completions').select('activity_id, chapter_id, status, passed, score, attempts, updated_at').eq('user_id', userId),
    ])

    const snapshot = {
      completedChapterIds: new Set((chapterRows ?? []).map((row) => row.chapter_id)),
      activities: (activityRows ?? []).map((row) => ({ ...row, status: row.status as 'completed' | 'in_progress' | 'not_started' })),
      lastChapterId: null,
      lastActivityId: null,
    }

    for (const curriculumModule of modules) {
      for (const chapter of curriculumModule.chapters) {
        const progress = getChapterProgress(chapter, snapshot)
        const isMarkedComplete = snapshot.completedChapterIds.has(chapter.id)
        if (isMarkedComplete && !progress.canComplete && progress.status !== 'completed') {
          report.push(`${userId},,${chapter.id},chapter_complete,true,false,,removed`)
          if (!dryRun) {
            const { error: deleteError } = await supabase
              .from('chapter_completions')
              .delete()
              .eq('user_id', userId)
              .eq('chapter_id', chapter.id)
            if (deleteError) throw new Error(deleteError.message)
          }
          removedChapters += 1
        }
      }
    }
  }

  fs.writeFileSync(reportPath, `${report.join('\n')}\n`, 'utf8')
  console.log(`${dryRun ? '[dry-run] ' : ''}Updated ${updatedActivities} activity row(s), removed ${removedChapters} chapter completion(s). Report: ${reportPath}`)
}

void main()
