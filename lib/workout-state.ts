// Shared workout completion state
export const completedWorkouts = new Set<number>()

// Latest created plan storage
let latestPlan: any = null

export function markWorkoutComplete(sessionId: number) {
  completedWorkouts.add(sessionId)
}

export function markWorkoutIncomplete(sessionId: number) {
  completedWorkouts.delete(sessionId)
}

export function isWorkoutComplete(sessionId: number): boolean {
  return completedWorkouts.has(sessionId)
}

export function setLatestPlan(plan: any) {
  latestPlan = plan
}

export function getLatestPlan() {
  return latestPlan
}