# Personal Growth & Agile Todo App

A desktop personal growth and habit-building todo application inspired by **Microsoft To Do**, designed for goal-oriented planning cycles and recursive hierarchical task management.

Built with **Electron**, **React**, **TypeScript**, **Tailwind CSS**, and **SQLite (better-sqlite3)**.

---

## ✨ Features

- 🎯 **Time-Bounded Planning Cycles:** Define growth cycles (1 to 6 months; recommended 3 months) by months, days, or explicit dates.
- 🌳 **Arbitrary Nested Subtasks:** Infinite nesting depth for breaking down ambitious goals into manageable subtasks.
- 📊 **Hierarchical Progress Weighting:** Mathematical, fair division of progress across top-level goals and recursive branches (no rounding shortfall).
- 📅 **Microsoft To-Do Style Workspace:**
  - **Today's Tasks (`active`):** Focused tasks for the day.
  - **All Tasks (`deactive`):** Backlog for the current cycle with expand/collapse and subtask addition.
  - **Completed Tasks (`completed`):** Archived accomplishments with full restoration capability.
- 🔄 **Safe Cycle Transitions:** Option to carry over unfinished tasks along with their entire descendant subtrees to the new cycle.
- 🌐 **Bilingual (Persian / English) & Full RTL/LTR Support:** Dynamic direction and localized text without layout breakage.
- 🛡️ **Secure Desktop Architecture:** Hardened Electron preload API (`contextIsolation: true`, safe IPC channels) and local per-user SQLite storage with WAL mode.
- 💬 **SweetAlert2 Confirmations:** Safe task deletion and cycle archiving confirmation dialogs.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (v9 or v12)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Ali1kamali/agile-todo.git
cd agile-todo
pnpm install
```

### Development

Run the Electron application in hot-reload development mode:

```bash
pnpm dev
```

### Verification & Typecheck

```bash
pnpm typecheck
pnpm lint
```

### Build & Package

To build the production bundle:

```bash
pnpm build
```

To package for desktop platforms:

```bash
# Windows
pnpm build:win

# macOS
pnpm build:mac

# Linux
pnpm build:linux
```

---

## 🗄️ Database & Storage

The application persists all cycles and nested tasks in an SQLite database file (`todos.db`) stored securely inside Electron's per-user application data directory (`app.getPath('userData')`). It uses Write-Ahead Logging (`WAL`) mode and foreign keys with `ON DELETE CASCADE` for subtask trees.

---

## 📜 License

[MIT License](LICENSE)
