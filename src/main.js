import './style.css';

function createLayout() {
  const app = document.getElementById('app');
  if (!app) return;

  const container = document.createElement('div');
  container.className = 'app-root';

  // Editor container
  const editorContainer = document.createElement('div');
  editorContainer.className = 'editor-container';
  editorContainer.setAttribute('data-test-id', 'editor-container');

  const editorLabel = document.createElement('div');
  editorLabel.className = 'panel-title';
  editorLabel.textContent = 'Code Editor';

  const textarea = document.createElement('textarea');
  textarea.className = 'editor-input';
  textarea.setAttribute('data-test-id', 'editor-input');
  textarea.setAttribute('spellcheck', 'false');
  textarea.setAttribute('rows', '20');
  textarea.setAttribute('aria-label', 'Code editor');

  editorContainer.appendChild(editorLabel);
  editorContainer.appendChild(textarea);

  // Event dashboard
  const dashboard = document.createElement('div');
  dashboard.className = 'event-dashboard';
  dashboard.setAttribute('data-test-id', 'event-dashboard');

  const dashTitle = document.createElement('div');
  dashTitle.className = 'panel-title';
  dashTitle.textContent = 'Event Dashboard';

  const logList = document.createElement('div');
  logList.className = 'event-log-list';
  logList.setAttribute('data-test-id', 'event-log-list');

  dashboard.appendChild(dashTitle);
  dashboard.appendChild(logList);

  container.appendChild(editorContainer);
  container.appendChild(dashboard);
  app.appendChild(container);

  setupEditor(textarea, logList);
}

function setupEditor(textarea, logList) {
  let history = [''];
  let historyIndex = 0;

  let highlightCallCount = 0;

  function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn(...args);
      }, delay);
    };
  }

  const runHighlight = () => {
    // Placeholder for expensive operation like syntax highlighting.
    highlightCallCount += 1;
  };

  const debouncedHighlight = debounce(runHighlight, 150);

  function addLogEntry(message) {
    const entry = document.createElement('div');
    entry.className = 'event-log-entry';
    entry.setAttribute('data-test-id', 'event-log-entry');
    entry.textContent = message;
    logList.appendChild(entry);
    logList.scrollTop = logList.scrollHeight;
  }

  function logFromEvent(ev) {
    const parts = [];
    parts.push(`type=${ev.type}`);
    if ('key' in ev) {
      parts.push(`key=${ev.key}`);
      parts.push(`code=${ev.code}`);
      parts.push(`ctrl=${ev.ctrlKey}`);
      parts.push(`meta=${ev.metaKey}`);
      parts.push(`shift=${ev.shiftKey}`);
      parts.push(`alt=${ev.altKey}`);
    }
    if (ev.type === 'input') {
      const anyEv = ev;
      const data = 'data' in anyEv ? anyEv.data : '';
      parts.push(`data=${data}`);
      parts.push(`value=${textarea.value}`);
    }
    if (ev.type.startsWith('composition') && 'data' in ev) {
      parts.push(`data=${ev.data}`);
    }
    addLogEntry(parts.join(' | '));
  }

  function recordChange(newContent) {
    const current = history[historyIndex];
    if (newContent === current) return;
    history = history.slice(0, historyIndex + 1);
    history.push(newContent);
    historyIndex = history.length - 1;
    debouncedHighlight();
  }

  function setContent(newContent, updateHistory = true) {
    textarea.value = newContent;
    if (updateHistory) {
      recordChange(newContent);
    }
  }

  function getCurrentContent() {
    return textarea.value;
  }

  function getLineInfo(text, index) {
    let lineStart = text.lastIndexOf('\n', index - 1);
    if (lineStart === -1) lineStart = 0; else lineStart += 1;
    let lineEnd = text.indexOf('\n', index);
    if (lineEnd === -1) lineEnd = text.length;
    return { lineStart, lineEnd };
  }

  function getLineIndent(text, lineStart) {
    let i = lineStart;
    while (i < text.length && text[i] === ' ') {
      i += 1;
    }
    return text.slice(lineStart, i);
  }

  function handleTab(event) {
    const text = getCurrentContent();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const { lineStart } = getLineInfo(text, start);

    if (!event.shiftKey) {
      const before = text.slice(0, lineStart);
      const line = text.slice(lineStart, end);
      const after = text.slice(end);
      const newText = before + '  ' + line + after;
      const delta = 2;
      setContent(newText, true);
      const newStart = start + delta;
      const newEnd = end + delta;
      textarea.selectionStart = newStart;
      textarea.selectionEnd = newEnd;
    } else {
      if (text.slice(lineStart, lineStart + 2) === '  ') {
        const before = text.slice(0, lineStart);
        const line = text.slice(lineStart + 2, end);
        const after = text.slice(end);
        const newText = before + line + after;
        setContent(newText, true);
        const delta = -2;
        const newStart = Math.max(lineStart, start + delta);
        const newEnd = Math.max(lineStart, end + delta);
        textarea.selectionStart = newStart;
        textarea.selectionEnd = newEnd;
      }
    }
  }

  function handleEnter() {
    const text = getCurrentContent();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const { lineStart, lineEnd } = getLineInfo(text, start);
    const indent = getLineIndent(text, lineStart);

    const before = text.slice(0, start);
    const after = text.slice(end);
    const insertion = '\n' + indent;
    const newPos = before.length + insertion.length;
    const newText = before + insertion + after;
    setContent(newText, true);
    textarea.selectionStart = newPos;
    textarea.selectionEnd = newPos;
  }

  function toggleComment() {
    const text = getCurrentContent();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const { lineStart, lineEnd } = getLineInfo(text, start);

    const line = text.slice(lineStart, lineEnd);
    const commentToken = '// ';

    let newLine;
    if (line.startsWith(commentToken)) {
      newLine = line.slice(commentToken.length);
    } else {
      newLine = commentToken + line;
    }

    const before = text.slice(0, lineStart);
    const after = text.slice(lineEnd);
    const newText = before + newLine + after;
    setContent(newText, true);

    const delta = newLine.length - line.length;
    textarea.selectionStart = start + delta;
    textarea.selectionEnd = end + delta;
  }

  function undo() {
    if (historyIndex > 0) {
      historyIndex -= 1;
      const content = history[historyIndex];
      setContent(content, false);
    }
  }

  function redo() {
    if (historyIndex < history.length - 1) {
      historyIndex += 1;
      const content = history[historyIndex];
      setContent(content, false);
    }
  }

  let chordTimer = null;
  let chordPending = false;

  function resetChord() {
    chordPending = false;
    if (chordTimer) {
      clearTimeout(chordTimer);
      chordTimer = null;
    }
  }

  function isModifierPressed(ev) {
    return ev.ctrlKey || ev.metaKey;
  }

  textarea.addEventListener('keydown', (ev) => {
    logFromEvent(ev);

    const key = ev.key;
    const lowerKey = typeof key === 'string' ? key.toLowerCase() : key;

    // Chord handling first
    if (isModifierPressed(ev) && lowerKey === 'k') {
      ev.preventDefault();
      chordPending = true;
      if (chordTimer) clearTimeout(chordTimer);
      chordTimer = setTimeout(() => {
        resetChord();
      }, 2000);
      return;
    }

    if (chordPending) {
      if (isModifierPressed(ev) && lowerKey === 'c') {
        ev.preventDefault();
        addLogEntry('Action: Chord Success');
        resetChord();
        return;
      } else {
        resetChord();
      }
    }

    // Save shortcut
    if (isModifierPressed(ev) && lowerKey === 's') {
      ev.preventDefault();
      addLogEntry('Action: Save');
      return;
    }

    // Undo / Redo
    if (isModifierPressed(ev) && lowerKey === 'z') {
      ev.preventDefault();
      if (ev.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }

    // Comment toggle
    if (isModifierPressed(ev) && lowerKey === '/') {
      ev.preventDefault();
      toggleComment();
      return;
    }

    if (key === 'Tab') {
      ev.preventDefault();
      handleTab(ev);
      return;
    }

    if (key === 'Enter') {
      ev.preventDefault();
      handleEnter();
      return;
    }
  });

  textarea.addEventListener('keyup', (ev) => {
    logFromEvent(ev);
  });

  textarea.addEventListener('input', (ev) => {
    logFromEvent(ev);
    recordChange(getCurrentContent());
  });

  textarea.addEventListener('compositionstart', (ev) => {
    logFromEvent(ev);
  });
  textarea.addEventListener('compositionupdate', (ev) => {
    logFromEvent(ev);
  });
  textarea.addEventListener('compositionend', (ev) => {
    logFromEvent(ev);
  });

  // Initialize history with empty content
  setContent('', true);

  // Expose verification helpers
  window.getEditorState = function () {
    return {
      content: getCurrentContent(),
      historySize: history.length,
    };
  };

  window.getHighlightCallCount = function () {
    return highlightCallCount;
  };
}

createLayout();
