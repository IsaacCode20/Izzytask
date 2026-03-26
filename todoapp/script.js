/* ── STATE ──────────────────────────────────────────────── */
let tasks = JSON.parse(localStorage.getItem('izzytask_tasks') || '[]');
let currentFilter = 'all';
let searchQuery   = '';
let activeTaskId  = null;   // which task is open in detail page

/* ── HELPERS ────────────────────────────────────────────── */
const save = () => localStorage.setItem('izzytask_tasks', JSON.stringify(tasks));
const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const fmt  = d  => new Date(d).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) +
                   ' · ' + new Date(d).toLocaleDateString([], {month:'short', day:'numeric'});

/* ── DATE BADGE ─────────────────────────────────────────── */
document.getElementById('dateBadge').textContent =
  new Date().toLocaleDateString([], {weekday:'short', month:'short', day:'numeric'});

/* ══════════════════════════════════════════════════════════
   PAGE NAVIGATION
══════════════════════════════════════════════════════════ */
function showDetail(taskId) {
  activeTaskId = taskId;
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  // populate fields
  document.getElementById('detailTitle').value    = task.text;
  document.getElementById('detailNotes').value    = task.notes    || '';
  document.getElementById('detailDue').value      = task.due      || '';
  document.getElementById('detailPriority').value = task.priority || 'medium';
  document.getElementById('detailCreated').textContent = fmt(task.createdAt);
  document.getElementById('detailId').textContent = task.id;

  // status check
  const check = document.getElementById('detailCheck');
  const label = document.getElementById('detailStatusLabel');
  check.className = 'custom-check' + (task.done ? ' checked' : '');
  label.textContent = task.done ? 'Completed' : 'Pending';

  // priority badge
  const badge = document.getElementById('detailPriorityBadge');
  const labels = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };
  badge.textContent  = labels[task.priority] || '🟡 Medium';
  badge.className    = 'detail-badge ' + (task.priority || 'medium');

  // transition
  const mainPage   = document.getElementById('mainPage');
  const detailPage = document.getElementById('detailPage');
  mainPage.classList.add('slide-out');
  setTimeout(() => {
    mainPage.style.display = 'none';
    mainPage.classList.remove('slide-out');
    detailPage.style.display = 'flex';
    requestAnimationFrame(() => detailPage.classList.add('active'));
  }, 320);
}

function showMain() {
  const mainPage   = document.getElementById('mainPage');
  const detailPage = document.getElementById('detailPage');

  detailPage.classList.remove('active');
  setTimeout(() => {
    detailPage.style.display = 'none';
    mainPage.style.display   = 'flex';
    requestAnimationFrame(() => mainPage.classList.remove('hidden'));
    render();
  }, 320);
  activeTaskId = null;
}

/* ── BACK BUTTON ─────────────────────────────────────────── */
document.getElementById('backBtn').addEventListener('click', showMain);

/* ── DETAIL CHECK TOGGLE ─────────────────────────────────── */
document.getElementById('detailCheck').addEventListener('click', () => {
  const task = tasks.find(t => t.id === activeTaskId);
  if (!task) return;
  task.done = !task.done;
  const check = document.getElementById('detailCheck');
  const label = document.getElementById('detailStatusLabel');
  check.className   = 'custom-check' + (task.done ? ' checked' : '');
  label.textContent = task.done ? 'Completed' : 'Pending';
  save();
});

/* ── DETAIL PRIORITY CHANGE → update badge live ──────────── */
document.getElementById('detailPriority').addEventListener('change', e => {
  const val = e.target.value;
  const badge  = document.getElementById('detailPriorityBadge');
  const labels = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };
  badge.textContent = labels[val];
  badge.className   = 'detail-badge ' + val;
});

/* ── SAVE CHANGES ────────────────────────────────────────── */
document.getElementById('detailSaveBtn').addEventListener('click', () => {
  const task = tasks.find(t => t.id === activeTaskId);
  if (!task) return;

  const newText = document.getElementById('detailTitle').value.trim();
  if (!newText) {
    document.getElementById('detailTitle').focus();
    return;
  }

  task.text     = newText;
  task.notes    = document.getElementById('detailNotes').value.trim();
  task.due      = document.getElementById('detailDue').value;
  task.priority = document.getElementById('detailPriority').value;

  save();

  // brief visual feedback
  const btn = document.getElementById('detailSaveBtn');
  btn.textContent = '✓ Saved!';
  btn.classList.add('saved');
  setTimeout(() => {
    btn.textContent = 'Save Changes';
    btn.classList.remove('saved');
  }, 1500);
});

/* ── DELETE FROM DETAIL ──────────────────────────────────── */
document.getElementById('detailDelBtn').addEventListener('click', () => {
  if (!confirm('Delete this task?')) return;
  tasks = tasks.filter(t => t.id !== activeTaskId);
  save();
  showMain();
});

/* ══════════════════════════════════════════════════════════
   MAIN PAGE – RENDER
══════════════════════════════════════════════════════════ */
function render() {
  const list    = document.getElementById('taskList');
  const total   = tasks.length;
  const done    = tasks.filter(t => t.done).length;
  const pending = total - done;
  const pct     = total ? Math.round((done / total) * 100) : 0;

  document.getElementById('totalCount').textContent   = total;
  document.getElementById('doneCount').textContent    = done;
  document.getElementById('pendingCount').textContent = pending;
  document.getElementById('progressBar').style.width  = pct + '%';
  document.getElementById('progressPct').textContent  = pct + '%';

  const bottomBar = document.getElementById('bottomBar');
  if (total) {
    bottomBar.style.display = 'flex';
    document.getElementById('bottomCount').textContent =
      `${pending} item${pending !== 1 ? 's' : ''} left`;
  } else {
    bottomBar.style.display = 'none';
  }

  const filtered = tasks.filter(t => {
    const matchFilter =
      currentFilter === 'all'       ? true :
      currentFilter === 'completed' ? t.done :
      currentFilter === 'pending'   ? !t.done :
      t.priority === currentFilter;
    const matchSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  list.innerHTML = '';

  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${tasks.length ? '🔎' : '✨'}</div>
        <div class="empty-title">${tasks.length ? 'No matches found' : 'Nothing here yet'}</div>
        <div class="empty-sub">${tasks.length ? 'Try a different filter or search term' : 'Add a task above to get started'}</div>
      </div>`;
    return;
  }

  const order  = { high: 0, medium: 1, low: 2 };
  const sorted = [...filtered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
  });

  const today = new Date();
  today.setHours(0,0,0,0);

  sorted.forEach(task => {
    const li = document.createElement('li');
    li.className    = 'task-item' + (task.done ? ' done' : '');
    li.dataset.id   = task.id;

    // due date display
    let dueHtml = '';
    if (task.due) {
      const dueDate = new Date(task.due + 'T00:00:00');
      const isOverdue = !task.done && dueDate < today;
      const fmtDue = dueDate.toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'});
      dueHtml = `<div class="task-due ${isOverdue ? 'overdue' : ''}">
        ${isOverdue ? '⚠️' : '📅'} Due ${fmtDue}
      </div>`;
    }

    li.innerHTML = `
      <div class="custom-check ${task.done ? 'checked' : ''}" data-id="${task.id}" title="Toggle done"></div>
      <div class="priority-dot ${task.priority}" title="${task.priority} priority"></div>
      <div class="task-content" data-id="${task.id}" title="Click to view details">
        <div class="task-text">${escHtml(task.text)}</div>
        <div class="task-meta">${fmt(task.createdAt)}</div>
        ${dueHtml}
      </div>
      <div class="task-actions">
        <button class="act-btn edit-btn" data-id="${task.id}" title="Edit">✏️</button>
        <button class="act-btn del del-btn" data-id="${task.id}" title="Delete">🗑</button>
      </div>`;
    list.appendChild(li);
  });
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════════════════════════
   ADD TASK
══════════════════════════════════════════════════════════ */
function addTask() {
  const input = document.getElementById('taskInput');
  const text  = input.value.trim();
  if (!text) { input.focus(); return; }
  const priority = document.getElementById('prioritySelect').value;
  tasks.unshift({
    id: uid(),
    text,
    priority,
    done: false,
    createdAt: Date.now(),
    notes: '',
    due: ''
  });
  input.value = '';
  save(); render();
}

document.getElementById('addBtn').addEventListener('click', addTask);
document.getElementById('taskInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

/* ══════════════════════════════════════════════════════════
   TASK LIST EVENTS (check / delete / edit / open detail)
══════════════════════════════════════════════════════════ */
document.getElementById('taskList').addEventListener('click', e => {
  const check       = e.target.closest('.custom-check');
  const delBtn      = e.target.closest('.del-btn');
  const editBtn     = e.target.closest('.edit-btn');
  const taskContent = e.target.closest('.task-content');

  // toggle done
  if (check) {
    const t = tasks.find(t => t.id === check.dataset.id);
    if (t) { t.done = !t.done; save(); render(); }
    return;
  }

  // delete
  if (delBtn) {
    const li = document.querySelector(`.task-item[data-id="${delBtn.dataset.id}"]`);
    li.classList.add('removing');
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== delBtn.dataset.id);
      save(); render();
    }, 240);
    return;
  }

  // inline edit
  if (editBtn) {
    const taskId = editBtn.dataset.id;
    const t      = tasks.find(t => t.id === taskId);
    const textEl = document.querySelector(`.task-item[data-id="${taskId}"] .task-text`);
    if (!t || !textEl) return;
    const inp = document.createElement('input');
    inp.className = 'task-edit-input';
    inp.value     = t.text;
    textEl.replaceWith(inp);
    inp.focus(); inp.select();
    const commit = () => {
      const val = inp.value.trim();
      if (val) t.text = val;
      save(); render();
    };
    inp.addEventListener('blur',    commit);
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter')  commit();
      if (e.key === 'Escape') render();
    });
    return;
  }

  // open detail page (clicking task text / content area)
  if (taskContent) {
    showDetail(taskContent.dataset.id);
  }
});

/* ══════════════════════════════════════════════════════════
   FILTERS & SEARCH
══════════════════════════════════════════════════════════ */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

document.getElementById('searchInput').addEventListener('input', e => {
  searchQuery = e.target.value;
  render();
});

/* ══════════════════════════════════════════════════════════
   CLEAR BUTTONS
══════════════════════════════════════════════════════════ */
document.getElementById('clearDone').addEventListener('click', () => {
  tasks = tasks.filter(t => !t.done);
  save(); render();
});

document.getElementById('clearAllBtn').addEventListener('click', () => {
  if (!tasks.length) return;
  if (confirm('Delete ALL tasks?')) {
    tasks = [];
    save(); render();
  }
});

/* ── INIT ───────────────────────────────────────────────── */
// Ensure detail page is hidden at start
document.getElementById('detailPage').style.display = 'none';
render();