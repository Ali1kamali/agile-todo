import type { TodoItem } from '@shared/todo.type'

/**
 * Calculates fair hierarchical progress (0 to 100):
 * - If a task is completed, it contributes 100% of its branch weight.
 * - If a task is numeric (targetType === 'numeric') and has targetValue > 0:
 *     it contributes (currentValue / targetValue) * branchWeight.
 * - If a task has children, the weight is distributed recursively.
 */
export function calculateHierarchicalProgress(roots: TodoItem[]): number {
  if (!roots || roots.length === 0) return 0

  let totalCompletedWeight = 0
  const rootWeight = 1.0 / roots.length

  function calculateNodeProgress(node: TodoItem, allocatedWeight: number): number {
    if (node.isCompleted || node.status === 'completed') {
      return allocatedWeight
    }

    // Handle numeric measurable tasks
    if (node.targetType === 'numeric' && node.targetValue && node.targetValue > 0) {
      const current = Math.max(0, node.currentValue ?? 0)
      const fraction = Math.min(1.0, current / node.targetValue)
      return fraction * allocatedWeight
    }

    const children = node.subtasks || []
    if (children.length === 0) {
      return 0
    }

    const childAllocatedWeight = allocatedWeight / children.length
    let completedInBranch = 0

    for (const child of children) {
      completedInBranch += calculateNodeProgress(child, childAllocatedWeight)
    }

    return completedInBranch
  }

  for (const root of roots) {
    totalCompletedWeight += calculateNodeProgress(root, rootWeight)
  }

  const percentage = Math.min(100, Math.max(0, totalCompletedWeight * 100))
  if (Math.abs(100 - percentage) < 0.01) {
    return 100
  }

  return Math.round(percentage * 10) / 10
}
