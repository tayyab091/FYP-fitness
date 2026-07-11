import { WorkoutLog, WorkoutPlan } from '@/models'

export async function enrichBodyWithTrainerId(
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (typeof body.trainerId === 'string') {
    return body
  }

  if (typeof body.planId === 'string') {
    const plan = await WorkoutPlan.findById(body.planId)
    if (plan?.trainerId) {
      return { ...body, trainerId: plan.trainerId.toString() }
    }
  }

  return body
}

export async function getTrainerIdFromPlan(planId: string): Promise<string | null> {
  const plan = await WorkoutPlan.findById(planId)
  return plan?.trainerId?.toString() ?? null
}

export async function getTrainerIdFromLog(logId: string): Promise<string | null> {
  const log = await WorkoutLog.findById(logId)
  if (!log?.planId) {
    return null
  }
  return getTrainerIdFromPlan(log.planId.toString())
}
