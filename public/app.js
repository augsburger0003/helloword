const state = {
  user: null,
  dashboard: null,
  projects: [],
  tasks: [],
  activeFilter: "all",
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir a ação.");
  return data;
}

function initials(name = "A") {
  return name
    .split(/[ ._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[character]));
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("visible"), 3200);
}

function setUserDetails(user) {
  const name = user.username || "Admin";
  const avatar = initials(name);
  $("#greeting-name").textContent = name;
  $("#sidebar-username").textContent = name;
  $("#sidebar-avatar").textContent = avatar;
  $("#top-avatar").textContent = avatar;
}

function formatDate(date) {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return date;
  const elapsed = Date.now() - value.getTime();
  if (elapsed < 3600000) return "agora";
  if (elapsed < 86400000) return `há ${Math.floor(elapsed / 3600000)}h`;
  if (elapsed < 172800000) return "ontem";
  return value.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

function renderStats(stats) {
  $("#stat-projects").textContent = stats.projects;
  $("#stat-open").textContent = stats.open_tasks;
  $("#stat-completed").textContent = stats.completed_tasks;
  $("#stat-members").textContent = stats.team_members;
  $("#project-count").textContent = stats.projects;
  $("#task-count").textContent = stats.open_tasks;
}

function renderProgress(projects) {
  const colors = ["", "blue"];
  $("#project-progress-list").innerHTML = projects.length
    ? projects.slice(0, 4).map((project, index) => `
      <div class="progress-item">
        <div class="progress-meta"><span class="project-name">${escapeHtml(project.name)}</span><span class="progress-percent">${project.progress}%</span></div>
        <div class="progress-track"><div class="progress-bar ${colors[index % colors.length]}" style="width:${project.progress}%"></div></div>
      </div>`).join("")
    : `<div class="empty-inline">Crie seu primeiro projeto para acompanhar o progresso.</div>`;
}

function taskMarkup(task, compact = false) {
  const statusLabel = { todo: "A fazer", in_progress: "Em andamento", done: "Concluída" }[task.status];
  return `<div class="task-row" data-task-id="${task.id}">
    <button class="task-check ${task.status === "done" ? "done" : ""}" data-task-status="${task.status}" aria-label="Atualizar tarefa">${task.status === "done" ? "✓" : ""}</button>
    <div class="task-info"><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.projectName || "Sem projeto")} · ${escapeHtml(task.assignee || "Você")}</small></div>
    <span class="priority ${task.priority}" title="Prioridade ${task.priority}"></span>
    ${compact ? `<span class="task-date">${escapeHtml(task.dueDate || statusLabel)}</span>` : `<span class="task-status">${statusLabel}</span><span class="task-date">${escapeHtml(task.dueDate || "Sem prazo")}</span>`}
  </div>`;
}

function renderTasks(tasks) {
  $("#task-list").innerHTML = tasks.length
    ? tasks.slice(0, 4).map((task) => taskMarkup(task, true)).join("")
    : `<div class="empty-inline">Nenhuma tarefa encontrada.</div>`;
  const filtered = state.activeFilter === "all"
    ? tasks : tasks.filter((task) => task.status === state.activeFilter);
  $("#all-task-list").innerHTML = filtered.length
    ? filtered.map((task) => taskMarkup(task)).join("")
    : `<div class="empty-inline">Nenhuma tarefa nesta categoria.</div>`;
  $$(".task-check").forEach((button) => button.addEventListener("click", updateTaskStatus));
}

function renderActivity(activity) {
  const icons = { project: "▣", task: "✓", team: "♧", milestone: "✦" };
  $("#activity-list").innerHTML = activity.length
    ? activity.map((item) => `<div class="activity-row">
      <span class="activity-icon ${item.type}">${icons[item.type] || "•"}</span>
      <div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description)}</p><time>${formatDate(item.createdAt)}</time></div>
    </div>`).join("")
    : `<div class="empty-inline">As atividades aparecerão aqui.</div>`;
}

function renderProjects(projects) {
  $("#projects-grid").innerHTML = projects.length
    ? projects.map((project) => `<article class="project-card">
      <div class="project-card-top"><span class="project-key">${escapeHtml(project.projectKey)}</span><button class="more-button">•••</button></div>
      <h2>${escapeHtml(project.name)}</h2><p>${escapeHtml(project.description || "Sem descrição.")}</p>
      <div class="card-progress"><div class="progress-meta"><span class="project-name">Progresso</span><span class="progress-percent">${project.progress}%</span></div><div class="progress-track"><div class="progress-bar" style="width:${project.progress}%"></div></div></div>
      <div class="card-bottom"><span>${project.completedTasks || 0} de ${project.taskCount || 0} tarefas</span><span class="status-pill">${project.status === "planning" ? "Planejando" : "Ativo"}</span></div>
    </article>`).join("")
    : `<div class="empty-state"><span class="empty-icon">▣</span><h2>Nenhum projeto ainda</h2><p>Comece adicionando uma iniciativa ao seu workspace.</p></div>`;
}

function renderTeam(members) {
  const palette = ["#7161db", "#e88d72", "#53ae9a", "#5e8fd8", "#bc79ba"];
  $("#team-grid").innerHTML = members.map((member, index) => `<article class="member-card">
    <span class="member-avatar" style="background:${palette[index % palette.length]}">${initials(member.username)}</span>
    <span class="member-info"><strong>${escapeHtml(member.username)}</strong><span>${escapeHtml(member.email)}</span></span>
  </article>`).join("");
}

function render(data) {
  state.dashboard = data;
  state.projects = data.projects || [];
  state.tasks = data.tasks || [];
  renderStats(data.stats);
  renderProgress(state.projects);
  renderTasks(state.tasks);
  renderActivity(data.activity || []);
  renderProjects(state.projects);
  renderTeam(data.members || []);
  setUserDetails(data.user || state.user);
  const projectSelect = $("#task-project");
  projectSelect.innerHTML = state.projects.map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`).join("");
}

async function loadDashboard() {
  const data = await api("/api/dashboard");
  render(data);
}

function showDashboard() {
  $("#auth-screen").hidden = true;
  $("#dashboard-shell").hidden = false;
}

function showAuth() {
  $("#auth-screen").hidden = false;
  $("#dashboard-shell").hidden = true;
}

function openModal() {
  if (!state.projects.length) {
    showToast("Crie um projeto antes de adicionar tarefas.");
    navigate("projects");
    return;
  }
  $("#task-error").textContent = "";
  $("#task-form").reset();
  $("#modal-backdrop").hidden = false;
  $("#task-title").focus();
}

function closeModal() {
  $("#modal-backdrop").hidden = true;
}

async function submitLogin(event) {
  event.preventDefault();
  const button = $(".login-button");
  const error = $("#login-error");
  error.textContent = "";
  button.disabled = true;
  button.firstChild.textContent = "Entrando… ";
  try {
    const result = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: $("#identifier").value,
        password: $("#password").value,
      }),
    });
    state.user = result.user;
    showDashboard();
    await loadDashboard();
    navigate(window.location.hash.slice(1) || "overview");
  } catch (requestError) {
    error.textContent = requestError.message;
  } finally {
    button.disabled = false;
    button.firstChild.textContent = "Entrar no painel ";
  }
}

async function submitTask(event) {
  event.preventDefault();
  const error = $("#task-error");
  error.textContent = "";
  try {
    await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: $("#task-title").value,
        projectId: Number($("#task-project").value),
        priority: $("#task-priority").value,
        assignee: $("#task-assignee").value,
        dueDate: $("#task-due").value,
      }),
    });
    closeModal();
    await loadDashboard();
    showToast("Tarefa criada com sucesso.");
  } catch (requestError) {
    error.textContent = requestError.message;
  }
}

async function updateTaskStatus(event) {
  const row = event.currentTarget.closest("[data-task-id]");
  const task = state.tasks.find((item) => item.id === Number(row.dataset.taskId));
  if (!task) return;
  const nextStatus = task.status === "done" ? "todo" : task.status === "todo" ? "in_progress" : "done";
  try {
    await api(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
    await loadDashboard();
    showToast(nextStatus === "done" ? "Tarefa concluída." : "Status atualizado.");
  } catch (requestError) {
    showToast(requestError.message);
  }
}

async function submitProject() {
  const name = window.prompt("Nome do projeto");
  if (!name) return;
  const projectKey = window.prompt("Chave curta do projeto (ex.: WEB)");
  if (!projectKey) return;
  try {
    await api("/api/projects", { method: "POST", body: JSON.stringify({ name, projectKey }) });
    await loadDashboard();
    showToast("Projeto criado com sucesso.");
    navigate("projects");
  } catch (requestError) {
    showToast(requestError.message);
  }
}

function navigate(view) {
  const knownView = $(`#${view}-view`) ? view : "overview";
  $$(".view").forEach((item) => item.classList.toggle("active-view", item.id === `${knownView}-view`));
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === knownView));
  $("#breadcrumb-current").textContent = { overview: "Visão geral", projects: "Projetos", tasks: "Tarefas", team: "Equipe", settings: "Configurações", help: "Central de ajuda" }[knownView];
  if (window.location.hash.slice(1) !== knownView) history.replaceState(null, "", `#${knownView}`);
  $(".sidebar").classList.remove("open");
}

async function bootstrap() {
  $("#login-form").addEventListener("submit", submitLogin);
  $(".password-toggle").addEventListener("click", () => {
    const input = $("#password");
    input.type = input.type === "password" ? "text" : "password";
  });
  $("#modal-close").addEventListener("click", closeModal);
  $("#task-cancel").addEventListener("click", closeModal);
  $("#modal-backdrop").addEventListener("click", (event) => { if (event.target.id === "modal-backdrop") closeModal(); });
  $("#task-form").addEventListener("submit", submitTask);
  $("#new-task-button").addEventListener("click", openModal);
  $("#new-task-button-page").addEventListener("click", openModal);
  $("#new-project-button").addEventListener("click", submitProject);
  $("#invite-button").addEventListener("click", () => showToast("Convites estarão disponíveis em breve."));
  $("#mobile-menu").addEventListener("click", () => $(".sidebar").classList.toggle("open"));
  $("#logout-button").addEventListener("click", async () => { await api("/api/auth/logout", { method: "POST" }); showAuth(); });
  $$(".nav-item,[data-view='projects'],[data-view='tasks'],[data-view='team']").forEach((item) => item.addEventListener("click", (event) => { event.preventDefault(); navigate(item.dataset.view); }));
  $$(".filter").forEach((button) => button.addEventListener("click", () => {
    $$(".filter").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.activeFilter = button.dataset.filter;
    renderTasks(state.tasks);
  }));

  try {
    const session = await api("/api/auth/me");
    state.user = session.user;
    showDashboard();
    await loadDashboard();
    navigate(window.location.hash.slice(1) || "overview");
  } catch {
    showAuth();
  }
}

bootstrap();