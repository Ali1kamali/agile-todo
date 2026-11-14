import type { TodoItem } from '@shared/todo.type'

/**
 * Calculates fair hierarchical progress (0 to 100):
 * 1. Divide total weight (1.0) equally among top-level root tasks.
 * 2. If a task has children, divide that task's weight equally among its direct children recursively.
 * 3. A completed leaf or fully completed branch contributes its exact weight.
 * 4. A parent marked completed contributes 100% of its subtree's weight (no double counting).
 * 5. Uses precise fraction sums to avoid floating point shortfall (e.g. 1/3 + 1/3 + 1/3 = exactly 1.0).
 */
export function calculateHierarchicalProgress(roots: TodoItem[]): number {
  if (!roots || roots.length === 0) return 0

  let totalCompletedWeight = 0

  const rootWeight = 1.0 / roots.length

  function calculateNodeProgress(node: TodoItem, allocatedWeight: number): number {
    // If this node is completed, it contributes its entire allocated weight
    if (node.isCompleted || node.status === 'completed') {
      return allocatedWeight
    }

    // If it has children, calculate their fraction
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

  // Convert to percentage with exact rounding safeguards
  const percentage = Math.min(100, Math.max(0, totalCompletedWeight * 100))
  // Round to nearest integer or 1 decimal if needed, but if it's very close to 100 (e.g. 99.999), make it 100
  if (Math.abs(100 - percentage) < 0.01) {
    return 100
  }

  return Math.round(percentage * 10) / 10
}
