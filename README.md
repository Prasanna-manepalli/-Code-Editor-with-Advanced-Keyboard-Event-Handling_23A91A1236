# High-Performance Code Editor

Browser-based code editor with advanced keyboard shortcut handling and a real-time event debugging dashboard, designed to mimic VS Code–style behavior.

---

## 1. Project Structure

- Root files:
  - `package.json`, 
  - `package-lock.json`
  - `index.html`
  - `Dockerfile`
  - `docker-compose.yml`
  - `.env.example`
  - `README.md`
- Source code:
  - `src/main.js` – UI layout, keyboard handling, state management, global functions
  - `src/style.css` – layout and styling for editor and dashboard

---

## 2. Features (Mapped to Requirements)

- Editor + dashboard UI (Req 1)
  - Left: main editor container (`data-test-id="editor-container"`) with textarea (`data-test-id="editor-input"`).
  - Right: event dashboard (`data-test-id="event-dashboard"`) and scrollable log list (`data-test-id="event-log-list"`).
- Event logging (Req 2)
  - Logs `keydown`, `keyup`, `input`, `compositionstart`, `compositionupdate`, `compositionend` from the editor.
  - Each log entry: element with `data-test-id="event-log-entry"`, text includes event type and key.
- Save shortcut (Req 3)
  - Ctrl/Cmd+S: `event.preventDefault()` + log entry `Action: Save` in the dashboard.
- Tab / Shift+Tab indentation (Req 4)
  - `Tab`: inserts two spaces at the start of the current line while keeping focus in the editor.
  - `Shift+Tab`: removes two leading spaces from the current line if present.
- Enter indentation (Req 5)
  - `Enter`: inserts a newline and copies the previous line's leading spaces to the new line.
- Undo/Redo history (Req 6)
  - Content changes from typing/pasting tracked in an internal history stack.
  - Ctrl/Cmd+Z → undo; Ctrl/Cmd+Shift+Z → redo.
  - Exposed via `window.getEditorState()`.
- Toggle line comment (Req 7)
  - Ctrl/Cmd+/ toggles `// ` at the start of the current line.
- Chord shortcut (Req 8)
  - Ctrl/Cmd+K, then Ctrl/Cmd+C within 2 seconds → logs `Action: Chord Success`.
  - Any other key or timeout resets the chord state.
- Input event–driven changes (Req 9)
  - The `input` event updates content and pushes to undo/redo history (covers typing and paste).
- Debounced expensive work (Req 10)
  - Placeholder "syntax highlighting" function is wrapped in a ≥150 ms debounce.
  - Call count exposed via `window.getHighlightCallCount()`.
- Cross-platform modifiers (Req 11)
  - All shortcuts accept both Ctrl (Windows/Linux) and Cmd (macOS) using `event.ctrlKey || event.metaKey`.

---

## 3. Global Verification Functions

- `window.getEditorState()`
  - Returns `{ content: string, historySize: number }`.
  - Use this to verify content changes, undo/redo behavior, and history length.
- `window.getHighlightCallCount()`
  - Returns the number of times the debounced highlight function ran.
  - For rapid typing tests, this should stay low (e.g., 1 after 10 quick keystrokes).

---

## 4. Run Locally (Node + Vite)

From the project root:

```bash
npm install
npm run dev
```

- Open: http://localhost:3005

---

## 5. Run with Docker + Docker Compose

From the project root:

```bash
docker-compose up --build
```

- The app listens on port `3005` inside the container and is exposed on port `3005` on the host via the mapping `3005:3005` in `docker-compose.yml`.
- Open: http://localhost:3005
- The `app` service includes a `curl`-based healthcheck to `http://localhost:3005` (inside the container).

---

## 6. Manual Testing Guide (Quick Checklist)

1. **Event logging**
   - Focus editor → press any key → new entry appears in the dashboard with type `keydown` and the key value.
2. **Save shortcut**
   - In editor, press Ctrl+S / Cmd+S → no browser save dialog; dashboard logs `Action: Save`.
3. **Tab / Shift+Tab**
   - Type `hello world`, put caret at start, press `Tab` → `  hello world`.
   - Press `Shift+Tab` → back to `hello world`; focus remains in editor.
4. **Enter indentation**
   - Type `  indented line`, caret at end, press `Enter` → new line starts with two spaces.
5. **Undo / Redo**
   - Type `hello`, then call `window.getEditorState()` in DevTools → `content: "hello"`.
   - Press Ctrl/Cmd+Z → content clears; Ctrl/Cmd+Shift+Z → `hello` returns.
6. **Toggle line comment**
   - Type `const x = 1;`, press Ctrl/Cmd+/ → `// const x = 1;`.
   - Press again → back to `const x = 1;`.
7. **Chord shortcut**
   - Press Ctrl/Cmd+K, then within 2s press Ctrl/Cmd+C → log `Action: Chord Success`.
8. **Debounced highlight**
   - Call `window.getHighlightCallCount()` → `0`.
   - Type 10 characters quickly, wait ~200 ms, call again → expect `1`.
