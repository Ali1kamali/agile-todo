import { app, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'

interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
}

export function manageWindowState(windowName: string = 'main', defaultWidth = 1000, defaultHeight = 700) {
  const stateFilePath = join(app.getPath('userData'), `window-state-${windowName}.json`)

  let state: WindowState = {
    width: defaultWidth,
    height: defaultHeight,
    isMaximized: false
  }

  // Load existing state
  try {
    const raw = readFileSync(stateFilePath, 'utf-8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.width === 'number' && typeof parsed.height === 'number') {
      state = parsed
    }
  } catch {
    // Fallback to default
  }

  // Validate bounds within current displays
  if (state.x !== undefined && state.y !== undefined) {
    const visibleOnAnyScreen = screen.getAllDisplays().some((display) => {
      const b = display.bounds
      return (
        state.x! >= b.x &&
        state.x! < b.x + b.width &&
        state.y! >= b.y &&
        state.y! < b.y + b.height
      )
    })

    if (!visibleOnAnyScreen) {
      delete state.x
      delete state.y
    }
  }

  function saveState(win: BrowserWindow) {
    if (win.isDestroyed()) return

    const isMaximized = win.isMaximized()
    if (!isMaximized) {
      const bounds = win.getBounds()
      state.x = bounds.x
      state.y = bounds.y
      state.width = bounds.width
      state.height = bounds.height
    }
    state.isMaximized = isMaximized

    try {
      writeFileSync(stateFilePath, JSON.stringify(state))
    } catch {
      // Ignore write errors during shutdown
    }
  }

  function track(win: BrowserWindow) {
    if (state.isMaximized) {
      win.maximize()
    }

    win.on('resize', () => saveState(win))
    win.on('move', () => saveState(win))
    win.on('close', () => saveState(win))
  }

  return {
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    isMaximized: state.isMaximized,
    track
  }
}
