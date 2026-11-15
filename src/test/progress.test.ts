import { describe, it, expect } from 'vitest'
import { calculateHierarchicalProgress } from '../renderer/src/utils/progress'
import type { TodoItem } from '../shared/todo.type'

describe('Progress Calculation & Hierarchical Weighting', () => {
  it('returns 0 when task list is empty', () => {
    expect(calculateHierarchicalProgress([])).toBe(0)
  })

  it('calculates 100% when a single root task is completed', () => {
    const tasks: TodoItem[] = [
      {
        id: '1',
        title: 'Task 1',
        isCompleted: true,
        status: 'completed',
        createdAt: new Date().toISOString()
      }
    ]
    expect(calculateHierarchicalProgress(tasks)).toBe(100)
  })

  it('divides weight equally among top-level tasks', () => {
    const tasks: TodoItem[] = [
      {
        id: '1',
        title: 'Task 1',
        isCompleted: true,
        status: 'completed',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Task 2',
        isCompleted: false,
        status: 'deactive',
        createdAt: new Date().toISOString()
      }
    ]
    expect(calculateHierarchicalProgress(tasks)).toBe(50)
  })

  it('recursively divides weight among children without floating-point shortfall', () => {
    // 3 children under a parent: each child is 1/3 of the parent's 100% = 33.333%
    const tasks: TodoItem[] = [
      {
        id: 'p1',
        title: 'Parent Goal',
        isCompleted: false,
        status: 'deactive',
        createdAt: new Date().toISOString(),
        subtasks: [
          {
            id: 'c1',
            title: 'Child 1',
            isCompleted: true,
            status: 'completed',
            createdAt: new Date().toISOString()
          },
          {
            id: 'c2',
            title: 'Child 2',
            isCompleted: true,
            status: 'completed',
            createdAt: new Date().toISOString()
          },
          {
            id: 'c3',
            title: 'Child 3',
            isCompleted: true,
            status: 'completed',
            createdAt: new Date().toISOString()
          }
        ]
      }
    ]

    // Completing all 3 children must produce exactly 100%
    expect(calculateHierarchicalProgress(tasks)).toBe(100)
  })

  it('does not double count when parent is marked completed with incomplete children', () => {
    const tasks: TodoItem[] = [
      {
        id: 'p1',
        title: 'Parent Goal',
        isCompleted: true,
        status: 'completed',
        createdAt: new Date().toISOString(),
        subtasks: [
          {
            id: 'c1',
            title: 'Child 1',
            isCompleted: false,
            status: 'deactive',
            createdAt: new Date().toISOString()
          }
        ]
      }
    ]

    expect(calculateHierarchicalProgress(tasks)).toBe(100)
  })
})
