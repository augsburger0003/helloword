const state = { dashboard: null, filter: 'all' };
const $ = (selector) => document.querySelector(selector);
const taskList = $('#task-list');
const dialog = $('#task-dialog');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[character]));
}

function relativeTime(iso) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 1440)}d ago`;
}

function formatDueDate(date) {
  if (!date) return 'No date';
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? 'No date' : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

async function request(url, options) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Something went wrong.');
  }
  return response.status === 204 ? null : response.json();
}

function renderMetrics(metrics) {
  $('#completion-rate').textContent = `${metrics.completionRate}%`;
  $('#completion-bar').style.width = `${metrics.completionRate}%`;
  $('#completion-copy').textContent = `${metrics.completed} of ${metrics.total} tasks complete`;
  $('#active-count').textContent = metrics.active;
  $('#total-count').textContent = metrics.total;
  $('#nav-count').textContent = metrics.total;
}

function renderTasks() {
  const tasks = state.dashboard.tasks.filter((task) => state.filter === 'all' || task.status === state.filter);
  if (!tasks.length) {
    taskList.innerHTML = '<p class="empty-state">Nothing here yet. Add a small next step.</p>';
    return;
  }
  taskList.innerHTML = tasks.map((task) => `
    <article class="task ${task.status === 'done' ? 'done' : ''}" data-id="${task.id}">
      <button class="task-toggle" data-action="toggle" aria-label="Mark ${escapeHtml(task.title)} as ${task.status === 'done' ? 'not done' : 'done'}"></button>
      <div class="task-main">
        <button class="task-title" data-action="details" title="${escapeHtml(task.description || task.title)}">${escapeHtml(task.title)}</button>
        <div class="task-meta"><span class="priority-dot priority-${task.priority}"></span><span>${escapeHtml(task.owner || 'Unassigned')}</span><span>·</span><span>${formatDueDate(task.dueDate)}</span></div>
      </div>
      <span class="task-category" style="color:${escapeHtml(task.categoryColor)};background:${escapeHtml(task.categoryColor)}18">${escapeHtml(task.category)}</span>
      <button class="more-button" data-action="delete" aria-label="Delete ${escapeHtml(task.title)}">×</button>
    </article>
  `).join('');
}

function renderActivity(activity) {
  $('#activity-list').innerHTML = activity.length ? activity.map((item) => `
    <div class="activity"><span class="activity-icon">✦</span><div><p>${escapeHtml(item.message)}</p><time>${relativeTime(item.createdAt)}</time></div></div>
  `).join('') : '<p class="empty-state">Your activity will appear here.</p>';
}

function populateCategories(categories) {
  $('#category-select').innerHTML = categories.map((category) =>
    `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`
  ).join('');
}

async function loadDashboard() {
  try {
    state.dashboard = await request('/api/dashboard');
    renderMetrics(state.dashboard.metrics);
    renderTasks();
    renderActivity(state.dashboard.activity);
    populateCategories(state.dashboard.categories);
  } catch (error) {
    taskList.innerHTML = `<p class="empty-state">${escapeHtml(error.message)} Refresh to try again.</p>`;
  }
}

async function updateTask(id, changes) {
  try {
    await request(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });
    await loadDashboard();
  } catch (error) {
    showToast(error.message);
  }
}

$('#filters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  state.filter = button.dataset.filter;
  document.querySelectorAll('.filter').forEach((filter) => filter.classList.toggle('active', filter === button));
  renderTasks();
});

taskList.addEventListener('click', async (event) => {
  const action = event.target.closest('[data-action]');
  if (!action) return;
  const task = action.closest('.task');
  const item = state.dashboard.tasks.find((candidate) => candidate.id === Number(task.dataset.id));
  if (!item) return;
  if (action.dataset.action === 'toggle') {
    updateTask(item.id, { status: item.status === 'done' ? 'todo' : 'done' });
  } else if (action.dataset.action === 'details') {
    showToast(item.description || 'No notes have been added to this task.');
  } else if (action.dataset.action === 'delete' && window.confirm(`Remove “${item.title}”?`)) {
    try {
      await request(`/api/tasks/${item.id}`, { method: 'DELETE' });
      await loadDashboard();
      showToast('Task removed.');
    } catch (error) {
      showToast(error.message);
    }
  }
});

function openDialog() {
  $('#form-error').textContent = '';
  $('#task-form').reset();
  dialog.showModal();
  window.setTimeout(() => $('#task-form [name="title"]').focus(), 50);
}
$('#open-task-dialog').addEventListener('click', openDialog);
$('#close-task-dialog').addEventListener('click', () => dialog.close());
$('#cancel-task').addEventListener('click', () => dialog.close());
$('#focus-first').addEventListener('click', () => {
  const task = state.dashboard.tasks.find((item) => item.status !== 'done');
  if (task) updateTask(task.id, { status: 'in_progress' }).then(() => showToast(`Focusing on “${task.title}”`));
});
$('#show-all').addEventListener('click', () => {
  state.filter = 'all';
  document.querySelectorAll('.filter').forEach((filter) => filter.classList.toggle('active', filter.dataset.filter === 'all'));
  renderTasks();
  $('#work').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#menu-button').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
document.querySelector('.sidebar nav').addEventListener('click', () => document.querySelector('.sidebar').classList.remove('open'));

$('#task-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  const values = Object.fromEntries(new FormData(form));
  submit.disabled = true;
  $('#form-error').textContent = '';
  try {
    await request('/api/tasks', { method: 'POST', body: JSON.stringify(values) });
    dialog.close();
    await loadDashboard();
    showToast('A new task is ready when you are.');
  } catch (error) {
    $('#form-error').textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});

loadDashboard();