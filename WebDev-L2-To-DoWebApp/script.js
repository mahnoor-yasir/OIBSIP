/* =====================================================
   Lumen Tasks — Vanilla JS (ES6)
   Full offline productivity app
   ===================================================== */
(() => {
  'use strict';

  // ---------- Storage keys ----------
  const K = {
    tasks: 'lumen.tasks',
    cats: 'lumen.categories',
    settings: 'lumen.settings',
    history: 'lumen.history',
  };

  // ---------- State ----------
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  let state = {
    tasks: load(K.tasks, []),
    categories: load(K.cats, [
      { id: 'personal', name: 'Personal', color: '#f5b8d0' },
      { id: 'work',     name: 'Work',     color: '#8fd0f0' },
      { id: 'shopping', name: 'Shopping', color: '#a4e8e0' },
      { id: 'health',   name: 'Health',   color: '#a8e6c1' },
    ]),
    settings: Object.assign({
      theme: 'light', accent: 'lavender', font: 'md',
      compact: false, anim: true,
    }, load(K.settings, {})),
    history: load(K.history, []), // dashboard: completion events
    view: 'all',
    search: '',
    sort: 'newest',
    filterPriority: '',
    bulkMode: false,
    selected: new Set(),
    editingId: null,
    lastDeleted: null,
  };

  const persist = () => {
    save(K.tasks, state.tasks);
    save(K.cats, state.categories);
    save(K.settings, state.settings);
    save(K.history, state.history);
  };

  // ---------- DOM helpers ----------
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, props = {}, ...children) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'dataset') Object.assign(e.dataset, v);
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  };
  const esc = (s) => (s ?? '').toString().replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // ---------- Toasts ----------
  const toastStack = $('#toastStack');
  const toast = (msg, type = 'info', action) => {
    const t = el('div', { class: `toast ${type}`, role: 'status' });
    t.appendChild(document.createTextNode(msg));
    if (action) {
      const b = el('button', { onclick: () => { action.fn(); dismiss(); } }, action.label);
      t.appendChild(b);
    }
    const close = el('button', { 'aria-label': 'Dismiss', onclick: () => dismiss() }, '✕');
    close.style.marginLeft = 'auto';
    close.style.color = 'var(--muted)';
    t.appendChild(close);
    toastStack.appendChild(t);
    const timer = setTimeout(dismiss, 4200);
    function dismiss() {
      clearTimeout(timer);
      t.classList.add('out');
      setTimeout(() => t.remove(), 300);
    }
  };

  // ---------- Confirm ----------
  const confirmModal = $('#confirmModal');
  const confirmDialog = (msg, title = 'Are you sure?') => new Promise((resolve) => {
    $('#confirmTitle').textContent = title;
    $('#confirmMsg').textContent = msg;
    confirmModal.classList.remove('hidden');
    const cleanup = (v) => {
      confirmModal.classList.add('hidden');
      $('#confirmOk').onclick = null;
      $('#confirmCancel').onclick = null;
      resolve(v);
    };
    $('#confirmOk').onclick = () => cleanup(true);
    $('#confirmCancel').onclick = () => cleanup(false);
  });

  // ---------- Settings application ----------
  const applySettings = () => {
    const app = $('#app');
    app.dataset.theme = state.settings.theme;
    app.dataset.accent = state.settings.accent;
    app.dataset.font = state.settings.font;
    app.dataset.compact = state.settings.compact ? 'on' : 'off';
    app.dataset.anim = state.settings.anim ? 'on' : 'off';
    // reflect settings modal controls when open
    $('#setTheme').value = state.settings.theme;
    $('#setFont').value = state.settings.font;
    $('#setCompact').checked = !!state.settings.compact;
    $('#setAnim').checked = !!state.settings.anim;
    $$('#accentSwatches button').forEach(b => b.classList.toggle('active', b.dataset.accent === state.settings.accent));
  };

  // ---------- Categories ----------
  const renderCategoryOptions = () => {
    const opts = state.categories.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    $('#taskCategory').innerHTML = `<option value="">No category</option>${opts}`;
    $('#editCategory').innerHTML = `<option value="">No category</option>${opts}`;
  };
  const renderCategorySidebar = () => {
    const list = $('#categoryList');
    list.innerHTML = '';
    if (!state.categories.length) {
      list.appendChild(el('li', { class: 'muted', style: 'font-size:12px;padding:6px 10px' }, 'No categories yet'));
      return;
    }
    state.categories.forEach(cat => {
      const count = state.tasks.filter(t => t.category === cat.id && !t.archived).length;
      const btn = el('button', {
        class: 'nav-item' + (state.view === `cat:${cat.id}` ? ' active' : ''),
        onclick: () => setView(`cat:${cat.id}`),
      },
        el('span', { class: 'cat-dot', style: `background:${cat.color}` }),
        el('span', {}, cat.name),
        el('span', { class: 'badge' }, String(count)),
        el('span', {
          class: 'cat-del', title: 'Delete category',
          onclick: (e) => { e.stopPropagation(); deleteCategory(cat.id); },
        }, '×'),
      );
      list.appendChild(el('li', {}, btn));
    });
  };
  const addCategory = () => {
    const name = prompt('Category name');
    if (!name || !name.trim()) return;
    const palette = ['#f5b8d0', '#8fd0f0', '#c9b8f5', '#a4e8e0', '#a8e6c1', '#f5c9a4'];
    state.categories.push({ id: uid(), name: name.trim(), color: palette[state.categories.length % palette.length] });
    persist(); render();
    toast('Category added', 'success');
  };
  const deleteCategory = async (id) => {
    if (!(await confirmDialog('Tasks in this category will keep their tasks but lose the category label.'))) return;
    state.categories = state.categories.filter(c => c.id !== id);
    state.tasks.forEach(t => { if (t.category === id) t.category = ''; });
    if (state.view === `cat:${id}`) state.view = 'all';
    persist(); render();
    toast('Category deleted', 'info');
  };

  // ---------- Task CRUD ----------
  const createTaskFromForm = () => {
    const title = $('#taskInput').value.trim();
    if (!title) return;
    const task = {
      id: uid(),
      title,
      description: '',
      notes: $('#taskNotes').value.trim(),
      priority: $('#taskPriority').value,
      category: $('#taskCategory').value,
      due: $('#taskDue').value || '',
      repeat: $('#taskRepeat').value,
      tags: $('#taskTags').value.split(',').map(s => s.trim()).filter(Boolean),
      completed: false,
      completedAt: null,
      archived: false,
      pinned: false,
      favorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    state.tasks.unshift(task);
    persist();
    $('#addForm').reset();
    $('#taskPriority').value = 'medium';
    renderCategoryOptions();
    render();
    toast('Task added', 'success');
  };

  const toggleComplete = (id) => {
    const t = state.tasks.find(x => x.id === id);
    if (!t) return;
    t.completed = !t.completed;
    t.completedAt = t.completed ? Date.now() : null;
    t.updatedAt = Date.now();
    if (t.completed) {
      state.history.push({ id: t.id, at: t.completedAt, createdAt: t.createdAt });
      // Recurring: spawn next instance
      if (t.repeat && t.repeat !== 'none') spawnRecurring(t);
    }
    persist(); render();
  };

  const spawnRecurring = (t) => {
    const map = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };
    const delta = map[t.repeat] * 86400000;
    const nextDue = t.due ? new Date(new Date(t.due).getTime() + delta).toISOString().slice(0, 16) : '';
    const clone = { ...t, id: uid(), completed: false, completedAt: null, due: nextDue, createdAt: Date.now(), updatedAt: Date.now() };
    state.tasks.unshift(clone);
  };

  const deleteTask = (id, silent = false) => {
    const idx = state.tasks.findIndex(t => t.id === id);
    if (idx < 0) return;
    const [removed] = state.tasks.splice(idx, 1);
    state.lastDeleted = { task: removed, index: idx };
    persist(); render();
    if (!silent) toast('Task deleted', 'info', { label: 'Undo', fn: undoDelete });
  };
  const undoDelete = () => {
    if (!state.lastDeleted) return;
    state.tasks.splice(state.lastDeleted.index, 0, state.lastDeleted.task);
    state.lastDeleted = null;
    persist(); render();
  };

  const duplicateTask = (id) => {
    const t = state.tasks.find(x => x.id === id);
    if (!t) return;
    const clone = { ...t, id: uid(), title: t.title + ' (copy)', completed: false, completedAt: null, createdAt: Date.now(), updatedAt: Date.now() };
    state.tasks.unshift(clone);
    persist(); render();
    toast('Task duplicated', 'success');
  };

  const togglePin = (id) => {
    const t = state.tasks.find(x => x.id === id); if (!t) return;
    t.pinned = !t.pinned; t.updatedAt = Date.now(); persist(); render();
  };
  const toggleFavorite = (id) => {
    const t = state.tasks.find(x => x.id === id); if (!t) return;
    t.favorite = !t.favorite; t.updatedAt = Date.now(); persist(); render();
  };
  const archiveTask = (id) => {
    const t = state.tasks.find(x => x.id === id); if (!t) return;
    t.archived = !t.archived; t.updatedAt = Date.now(); persist(); render();
    toast(t.archived ? 'Task archived' : 'Task restored', 'info');
  };

  // ---------- Edit modal ----------
  const openEdit = (id) => {
    const t = state.tasks.find(x => x.id === id); if (!t) return;
    state.editingId = id;
    renderCategoryOptions();
    $('#editTitleInput').value = t.title;
    $('#editDesc').value = t.description || '';
    $('#editPriority').value = t.priority;
    $('#editCategory').value = t.category || '';
    $('#editDue').value = t.due || '';
    $('#editRepeat').value = t.repeat || 'none';
    $('#editTags').value = (t.tags || []).join(', ');
    $('#editNotes').value = t.notes || '';
    openModal('#editModal');
    setTimeout(() => $('#editTitleInput').focus(), 60);
  };
  const saveEdit = (e) => {
    e.preventDefault();
    const t = state.tasks.find(x => x.id === state.editingId); if (!t) return;
    t.title = $('#editTitleInput').value.trim() || t.title;
    t.description = $('#editDesc').value.trim();
    t.priority = $('#editPriority').value;
    t.category = $('#editCategory').value;
    t.due = $('#editDue').value;
    t.repeat = $('#editRepeat').value;
    t.tags = $('#editTags').value.split(',').map(s => s.trim()).filter(Boolean);
    t.notes = $('#editNotes').value.trim();
    t.updatedAt = Date.now();
    persist(); closeModal('#editModal'); render();
    toast('Task updated', 'success');
  };

  // ---------- Bulk ----------
  const toggleBulk = () => {
    state.bulkMode = !state.bulkMode;
    state.selected.clear();
    $('#app').dataset.bulk = state.bulkMode ? 'on' : 'off';
    $('#bulkBtn').setAttribute('aria-pressed', String(state.bulkMode));
    $('#bulkBtn').textContent = state.bulkMode ? 'Done' : 'Select';
    render();
  };
  const doBulk = async (action) => {
    if (action === 'cancel') { toggleBulk(); return; }
    if (!state.selected.size) { toast('No tasks selected', 'error'); return; }
    if (action === 'delete') {
      if (!(await confirmDialog(`Delete ${state.selected.size} task(s)?`))) return;
      state.tasks = state.tasks.filter(t => !state.selected.has(t.id));
      toast('Tasks deleted', 'info');
    } else if (action === 'complete') {
      state.tasks.forEach(t => {
        if (state.selected.has(t.id) && !t.completed) {
          t.completed = true; t.completedAt = Date.now();
          state.history.push({ id: t.id, at: t.completedAt, createdAt: t.createdAt });
        }
      });
      toast('Tasks completed', 'success');
    } else if (action === 'restore') {
      state.tasks.forEach(t => {
        if (state.selected.has(t.id)) { t.completed = false; t.completedAt = null; t.archived = false; }
      });
      toast('Tasks restored', 'success');
    }
    state.selected.clear();
    persist(); render();
  };

  // ---------- Views / filtering ----------
  const setView = (v) => { state.view = v; render(); };

  const isSameDay = (a, b) => { const x = new Date(a), y = new Date(b); return x.toDateString() === y.toDateString(); };
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const dayDiff = (a, b) => Math.floor((startOfDay(a) - startOfDay(b)) / 86400000);

  const matchesView = (t) => {
    const now = new Date();
    if (state.view !== 'archived' && t.archived) return false;
    switch (state.view) {
      case 'all': return !t.archived;
      case 'pending': return !t.completed;
      case 'completed': return t.completed;
      case 'today': return t.due && isSameDay(t.due, now);
      case 'upcoming': return t.due && new Date(t.due) > now && !t.completed;
      case 'overdue': return t.due && new Date(t.due) < now && !t.completed;
      case 'pinned': return t.pinned;
      case 'favorites': return t.favorite;
      case 'archived': return t.archived;
      default:
        if (state.view.startsWith('cat:')) return t.category === state.view.slice(4);
        return true;
    }
  };

  const filteredSortedTasks = () => {
    let list = state.tasks.filter(matchesView);
    if (state.filterPriority) list = list.filter(t => t.priority === state.filterPriority);
    if (state.search) {
      const q = state.search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(q))
      );
    }
    const prioRank = { urgent: 0, high: 1, medium: 2, low: 3 };
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      switch (state.sort) {
        case 'oldest': return a.createdAt - b.createdAt;
        case 'alpha': return a.title.localeCompare(b.title);
        case 'priority': return prioRank[a.priority] - prioRank[b.priority];
        case 'due':
          if (!a.due && !b.due) return 0;
          if (!a.due) return 1; if (!b.due) return -1;
          return new Date(a.due) - new Date(b.due);
        case 'newest':
        default: return b.createdAt - a.createdAt;
      }
    });
    return list;
  };

  // ---------- Rendering ----------
  const fmtDue = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const diff = dayDiff(d, new Date());
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff === 0) return `Today · ${time}`;
    if (diff === 1) return `Tomorrow · ${time}`;
    if (diff === -1) return `Yesterday · ${time}`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + time;
  };
  const fmtRelative = (ts) => {
    const d = Math.floor((Date.now() - ts) / 1000);
    if (d < 60) return 'just now';
    if (d < 3600) return `${Math.floor(d / 60)}m ago`;
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
    if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  const viewMeta = {
    all: ['All Tasks', 'A calm, focused workspace for what matters today.'],
    today: ['Today', "Everything that's due today."],
    upcoming: ['Upcoming', "What's next on your horizon."],
    pending: ['Pending', 'Tasks still in progress.'],
    completed: ['Completed', 'A history of your wins.'],
    pinned: ['Pinned', 'Tasks you keep close.'],
    favorites: ['Favorites', 'The ones you love.'],
    overdue: ['Overdue', 'Give these your attention.'],
    archived: ['Archived', 'Out of the way, not forgotten.'],
  };

  const renderTask = (t) => {
    const cat = state.categories.find(c => c.id === t.category);
    const overdue = t.due && new Date(t.due) < new Date() && !t.completed;
    const wrap = el('article', {
      class: `task ${t.completed ? 'completed' : ''} ${t.pinned ? 'pinned' : ''} ${overdue ? 'overdue' : ''}`,
      dataset: { id: t.id },
    });
    // select checkbox (bulk)
    if (state.bulkMode) {
      const sel = el('input', {
        type: 'checkbox', class: 'task-select',
        'aria-label': 'Select task',
        onchange: (e) => {
          if (e.target.checked) state.selected.add(t.id); else state.selected.delete(t.id);
          $('#bulkCount').textContent = state.selected.size;
        },
      });
      if (state.selected.has(t.id)) sel.checked = true;
      wrap.appendChild(sel);
    }
    // check circle
    const check = el('button', {
      class: 'task-check', 'aria-label': t.completed ? 'Mark incomplete' : 'Mark complete',
      onclick: () => toggleComplete(t.id),
      html: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4L19 6"/></svg>',
    });
    wrap.appendChild(check);

    // body
    const body = el('div', { class: 'task-body' });
    body.appendChild(el('div', { class: 'task-title' }, t.title));
    if (t.description) body.appendChild(el('div', { class: 'task-desc' }, t.description));
    else if (t.notes)   body.appendChild(el('div', { class: 'task-desc' }, t.notes));

    const meta = el('div', { class: 'task-meta' });
    meta.appendChild(el('span', { class: `prio prio-${t.priority}` }, t.priority));
    if (cat) {
      const dot = el('span', { class: 'cat-dot', style: `background:${cat.color}` });
      const catSpan = el('span', {}, dot, ' ' + cat.name);
      meta.appendChild(catSpan);
    }
    if (t.due) meta.appendChild(el('span', { class: 'due' }, '📅 ' + fmtDue(t.due)));
    if (t.repeat && t.repeat !== 'none') meta.appendChild(el('span', {}, '🔁 ' + t.repeat));
    if (t.pinned) meta.appendChild(el('span', {}, '📌 Pinned'));
    if (t.favorite) meta.appendChild(el('span', {}, '❤️ Favorite'));
    (t.tags || []).forEach(tag => meta.appendChild(el('span', { class: 'tag' }, '#' + tag)));
    meta.appendChild(el('span', {}, '· ' + fmtRelative(t.createdAt)));
    body.appendChild(meta);
    wrap.appendChild(body);

    // actions
    const actBtn = (label, svg, fn) => el('button', {
      class: 'icon-btn', 'aria-label': label, title: label, onclick: fn,
      html: svg,
    });
    const svgEdit = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    const svgDel  = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
    const svgDup  = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    const svgPin  = t.pinned
      ? '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 2l2 6h6l-5 4 2 7-5-3-5 3 2-7-5-4h6z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2 6h6l-5 4 2 7-5-3-5 3 2-7-5-4h6z"/></svg>';
    const svgFav  = t.favorite ? '❤️' : '🤍';
    const svgArch = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="5" rx="1"/><path d="M4 9v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"/><line x1="10" y1="13" x2="14" y2="13"/></svg>';

    const actions = el('div', { class: 'task-actions' },
      actBtn(t.pinned ? 'Unpin' : 'Pin', svgPin, () => togglePin(t.id)),
      actBtn(t.favorite ? 'Unfavorite' : 'Favorite', svgFav, () => toggleFavorite(t.id)),
      actBtn('Duplicate', svgDup, () => duplicateTask(t.id)),
      actBtn(t.archived ? 'Restore' : 'Archive', svgArch, () => archiveTask(t.id)),
      actBtn('Edit', svgEdit, () => openEdit(t.id)),
      actBtn('Delete', svgDel, async () => {
        if (await confirmDialog('Delete this task?')) deleteTask(t.id);
      }),
    );
    wrap.appendChild(actions);
    return wrap;
  };

  const updateCounts = () => {
    const now = new Date();
    const c = {
      all: state.tasks.filter(t => !t.archived).length,
      today: state.tasks.filter(t => !t.archived && t.due && isSameDay(t.due, now)).length,
      upcoming: state.tasks.filter(t => !t.archived && t.due && new Date(t.due) > now && !t.completed).length,
      pending: state.tasks.filter(t => !t.archived && !t.completed).length,
      completed: state.tasks.filter(t => !t.archived && t.completed).length,
      pinned: state.tasks.filter(t => !t.archived && t.pinned).length,
      favorites: state.tasks.filter(t => !t.archived && t.favorite).length,
      overdue: state.tasks.filter(t => !t.archived && t.due && new Date(t.due) < now && !t.completed).length,
      archived: state.tasks.filter(t => t.archived).length,
    };
    $$('#smartLists [data-count]').forEach(el => {
      el.textContent = c[el.dataset.count] ?? 0;
    });
    $('#statPending').textContent = c.pending;
    $('#statCompleted').textContent = c.completed;
    $('#statTotal').textContent = c.all;

    const pct = c.all ? Math.round(c.completed / c.all * 100) : 0;
    const circumference = 2 * Math.PI * 16;
    const ring = $('#ringFg');
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference * (1 - pct / 100);
    $('#ringLabel').textContent = pct + '%';
  };

  const render = () => {
    // sync active nav
    $$('#smartLists .nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
    renderCategorySidebar();

    const [title, sub] = viewMeta[state.view] || (() => {
      if (state.view.startsWith('cat:')) {
        const c = state.categories.find(x => x.id === state.view.slice(4));
        return c ? [c.name, 'Category view'] : ['Tasks', ''];
      }
      return ['Tasks', ''];
    })();
    $('#viewTitle').textContent = title;
    $('#viewSubtitle').textContent = sub;

    updateCounts();

    const list = $('#taskList');
    list.innerHTML = '';
    const tasks = filteredSortedTasks();
    tasks.forEach(t => list.appendChild(renderTask(t)));

    $('#emptyState').classList.toggle('hidden', tasks.length > 0);
    $('#bulkBar').classList.toggle('hidden', !state.bulkMode);
    $('#bulkCount').textContent = state.selected.size;
  };

  // ---------- Modals ----------
  const openModal  = (sel) => { $(sel).classList.remove('hidden'); };
  const closeModal = (sel) => { $(sel).classList.add('hidden'); };
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-close-modal]') || e.target.classList.contains('modal-backdrop')) {
      const m = e.target.closest('.modal-backdrop');
      if (m) m.classList.add('hidden');
    }
  });

  // ---------- Dashboard ----------
  const renderDashboard = () => {
    const total = state.tasks.length;
    const done = state.tasks.filter(t => t.completed).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    $('#dashPct').textContent = pct + '%';
    $('#dashRatio').textContent = `${done} of ${total}`;

    // streak: consecutive days ending today with >=1 completion in history
    const days = new Set(state.history.map(h => startOfDay(h.at).getTime()));
    let streak = 0; let cur = startOfDay(new Date()).getTime();
    while (days.has(cur)) { streak++; cur -= 86400000; }
    $('#dashStreak').textContent = streak;

    // best day (of week)
    const dow = [0, 0, 0, 0, 0, 0, 0];
    state.history.forEach(h => dow[new Date(h.at).getDay()]++);
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const maxIdx = dow.indexOf(Math.max(...dow));
    $('#dashBestDay').textContent = dow[maxIdx] ? names[maxIdx] : '—';
    $('#dashBestDayCount').textContent = `${dow[maxIdx]} tasks`;

    // avg completion time
    const durations = state.history.map(h => (h.at - h.createdAt)).filter(x => x > 0);
    if (durations.length) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const h = Math.floor(avg / 3600000);
      const m = Math.floor((avg % 3600000) / 60000);
      $('#dashAvgTime').textContent = h > 24 ? `${Math.round(h / 24)}d` : h ? `${h}h ${m}m` : `${m}m`;
    } else $('#dashAvgTime').textContent = '—';

    // 7-day bar chart
    const chart = $('#barChart');
    chart.innerHTML = '';
    const today = startOfDay(new Date()).getTime();
    const counts = [];
    for (let i = 6; i >= 0; i--) {
      const day = today - i * 86400000;
      const n = state.history.filter(h => startOfDay(h.at).getTime() === day).length;
      counts.push({ day, n });
    }
    const max = Math.max(1, ...counts.map(c => c.n));
    counts.forEach(({ day, n }) => {
      const col = el('div', { class: 'bar-col' });
      col.appendChild(el('div', { class: 'bar-val' }, String(n)));
      const bar = el('div', { class: 'bar', style: `height:${(n / max) * 100}%` });
      col.appendChild(bar);
      col.appendChild(el('div', { class: 'bar-label' }, new Date(day).toLocaleDateString([], { weekday: 'short' })));
      chart.appendChild(col);
    });

    const nowD = new Date();
    $('#dashDaily').textContent = state.history.filter(h => isSameDay(h.at, nowD)).length;
    const weekAgo = Date.now() - 7 * 86400000;
    const monthAgo = Date.now() - 30 * 86400000;
    $('#dashWeekly').textContent = state.history.filter(h => h.at >= weekAgo).length;
    $('#dashMonthly').textContent = state.history.filter(h => h.at >= monthAgo).length;
    $('#dashOverdue').textContent = state.tasks.filter(t => t.due && new Date(t.due) < nowD && !t.completed && !t.archived).length;
  };

  // ---------- Import / Export ----------
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({
      tasks: state.tasks, categories: state.categories,
      settings: state.settings, history: state.history,
      exportedAt: new Date().toISOString(),
    }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lumen-tasks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
    toast('Exported', 'success');
  };
  const importJSON = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data.tasks)) state.tasks = data.tasks;
        if (Array.isArray(data.categories)) state.categories = data.categories;
        if (data.settings) state.settings = Object.assign(state.settings, data.settings);
        if (Array.isArray(data.history)) state.history = data.history;
        persist(); applySettings(); renderCategoryOptions(); render();
        toast('Import complete', 'success');
      } catch { toast('Invalid file', 'error'); }
    };
    reader.readAsText(file);
  };

  // ---------- Wire events ----------
  const wire = () => {
    $('#addForm').addEventListener('submit', (e) => { e.preventDefault(); createTaskFromForm(); });

    $('#searchInput').addEventListener('input', (e) => { state.search = e.target.value.trim(); render(); });
    $('#filterPriority').addEventListener('change', (e) => { state.filterPriority = e.target.value; render(); });
    $('#sortBy').addEventListener('change', (e) => { state.sort = e.target.value; render(); });

    $$('#smartLists .nav-item').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
    $('#addCategoryBtn').addEventListener('click', addCategory);

    $('#themeToggle').addEventListener('click', () => {
      state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
      persist(); applySettings();
    });

    $('#bulkBtn').addEventListener('click', toggleBulk);
    $$('#bulkBar [data-bulk]').forEach(b => b.addEventListener('click', () => doBulk(b.dataset.bulk)));

    $('#editForm').addEventListener('submit', saveEdit);

    $('#openSettings').addEventListener('click', () => openModal('#settingsModal'));
    $('#openDashboard').addEventListener('click', () => { renderDashboard(); openModal('#dashboardModal'); });

    $('#setTheme').addEventListener('change', (e) => { state.settings.theme = e.target.value; persist(); applySettings(); });
    $('#setFont').addEventListener('change', (e) => { state.settings.font = e.target.value; persist(); applySettings(); });
    $('#setCompact').addEventListener('change', (e) => { state.settings.compact = e.target.checked; persist(); applySettings(); });
    $('#setAnim').addEventListener('change', (e) => { state.settings.anim = e.target.checked; persist(); applySettings(); });
    $$('#accentSwatches button').forEach(b => b.addEventListener('click', () => {
      state.settings.accent = b.dataset.accent; persist(); applySettings();
    }));
    $('#resetData').addEventListener('click', async () => {
      if (!(await confirmDialog('This will erase all tasks, categories, history and settings.'))) return;
      localStorage.clear();
      location.reload();
    });

    $('#exportBtn').addEventListener('click', exportJSON);
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', (e) => { if (e.target.files[0]) importJSON(e.target.files[0]); e.target.value = ''; });
    $('#printBtn').addEventListener('click', () => window.print());

    // Mobile sidebar
    $('#menuBtn').addEventListener('click', () => $('#app').dataset.sidebar = 'open');
    $('#sidebarClose').addEventListener('click', () => $('#app').dataset.sidebar = 'closed');
    $('#fab').addEventListener('click', () => { $('#taskInput').focus(); $('#taskInput').scrollIntoView({ behavior: 'smooth' }); });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        $$('.modal-backdrop:not(.hidden)').forEach(m => m.classList.add('hidden'));
      }
      if (e.target.matches('input,textarea,select')) return;
      if (e.key === '/') { e.preventDefault(); $('#searchInput').focus(); }
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); $('#taskInput').focus(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undoDelete(); }
    });

    // Overdue re-check tick every minute
    setInterval(() => { if (state.view === 'overdue' || state.view === 'today') render(); }, 60000);
  };

  // ---------- Init ----------
  const init = () => {
    applySettings();
    renderCategoryOptions();
    wire();
    render();
  };
  document.addEventListener('DOMContentLoaded', init);
})();