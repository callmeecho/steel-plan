import { createClient } from '@/lib/supabase/server'

const TABLE_NAME = 'optimization_plan_results'

export type PersistedPlanSnapshot = {
  plan: unknown
  sourceDir: string | null
  generatedAt: string | null
  results: unknown[]
  stats: unknown[]
  unscheduled: unknown[]
}

type StoredPlanRow = {
  task_id: string
  status: string
  source_dir: string | null
  generated_at: string | null
  snapshot: PersistedPlanSnapshot
  message: string | null
}

export async function savePlanSnapshot(
  taskId: string,
  snapshot: PersistedPlanSnapshot,
  status: 'completed' | 'failed' = 'completed',
  message: string | null = null,
) {
  const supabase = await createClient()
  const payload: StoredPlanRow = {
    task_id: taskId,
    status,
    source_dir: snapshot.sourceDir,
    generated_at: snapshot.generatedAt,
    snapshot,
    message,
  }

  const { error } = await supabase.from(TABLE_NAME).upsert(payload, { onConflict: 'task_id' })
  if (error) {
    throw new Error(`savePlanSnapshot failed: ${error.message}`)
  }
}

export async function savePlanFailure(taskId: string, message: string) {
  const supabase = await createClient()
  const { error } = await supabase.from(TABLE_NAME).upsert(
    {
      task_id: taskId,
      status: 'failed',
      message,
      snapshot: null,
      source_dir: null,
      generated_at: null,
    },
    { onConflict: 'task_id' },
  )

  if (error) {
    throw new Error(`savePlanFailure failed: ${error.message}`)
  }
}

export async function loadPlanSnapshotByTaskId(taskId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('snapshot')
    .eq('task_id', taskId)
    .maybeSingle()

  if (error || !data || !data.snapshot) return null
  return data.snapshot as PersistedPlanSnapshot
}

export async function loadLatestPlanSnapshot() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('snapshot')
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data || !data.snapshot) return null
  return data.snapshot as PersistedPlanSnapshot
}
