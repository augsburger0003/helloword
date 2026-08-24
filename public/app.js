const state = { dashboard: null };

const $ = (selector) => document.querySelector(selector);

function initials(name = "You") {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[character]));
}

function relativeTime(date) {
  const difference = Math.max(0, Date.now() - new Date(date).getTime());
  const minutes = Math.floor(difference / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function render(data) {
  state.dashboard = data;
  const { summary, projects, activities } = data;
  $("#project-count").textContent = summary.projects;
  $("#task-count").textContent = summary.openTasks;
  $("#completed-count").textContent = summary.completedTasks;
  $("#completion-rate").textContent = `${summary.completion}%`;
  $("#nav-project-count").textContent = summary.projects;
  $("#nav-task-count").textContent = summary.openTasks;

  $("#project-grid").innerHTML = projects.length ? projects.map((project) => {
    const completed = project.tasks.filter((task) => task.status === "done").length;
    const progress = project.tasks.length ? Math.round((completed / project.tasks.length) * 100) : 0;
    const status = project.status === "completed" ? "Completed" : "Active";
    return `<article class="project-card">
      <div><span class="project-color" style="background:${escapeHtml(project.color)}"></span><h3>${escapeHtml(project.title)}</h3></div>
      <p class="project-description">${escapeHtml(project.description || "No description yet.")}</p>
      <div class="project-meta"><span><strong>${completed}/${project.tasks.length}</strong> tasks</span><span class="status-pill ${project.status === "completed" ? "completed" : ""}">${status}</span></div>
      <div class="mini-progress"><span style="width:${progress}%;background:${escapeHtml(project.color)}"></span></div>
    </article>`;
  }).join("") : `<div class="empty-state">No projects yet. Create your first one above.</div>`;

  const tasks = projects.flatMap((project) => project.tasks.map((task) => ({ ...task, projectTitle: project.title }))).slice(0, 5);
  $("#task-list").innerHTML = tasks.length ? tasks.map((task) => `<div class="task-row">
    <button class="task-check ${task.status === "done" ? "done" : ""}" type="button" data-task-id="${task.id}" aria-label="Mark ${escapeHtml(task.title)} done">${task.status === "done" ? "✓" : ""}</button>
    <div class="task-info"><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.projectTitle)}</span></div>
    <span class="priority ${task.priority}">${escapeHtml(task.priority)}</span>
  </div>`).join("") : `<div class="empty-state">Nothing on your task list yet.</div>`;

  $("#activity-list").innerHTML = activities.length ? activities.slice(0, 5).map((activity) => `<div class="activity-row">
    <div class="activity-avatar ${activity.actor === "You" ? "purple" : ""}">${initials(activity.actor)}</div>
    <div class="activity-copy"><strong>${escapeHtml(activity.message)}</strong><span>${relativeTime(activity.createdAt)}</span></div>
  </div>`).join("") : `<div class="empty-state">Your latest activity will appear here.</div>`;
}

async function loadDashboard() {
  try {
    const response = await fetch("/api/dashboard");
    if (!response.ok) throw new Error("Dashboard unavailable");
    render(await response.json());
  } catch (error) {
    $("#project-grid").innerHTML = `<div class="empty-state">Could not load your workspace. Please refresh.</div>`;
    console.error(error);
  }
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  window.clearTimeout(toast.timeout);
  toast.timeout = window.setTimeout(() => element.classList.remove("show"), 2600);
}

function setModal(open) {
  $("#project-modal").hidden = !open;
  if (open) $("#project-form input").focus();
}

$("#open-project-modal").addEventListener("click", () => setModal(true));
$("#close-project-modal").addEventListener("click", () => setModal(false));
$("#project-modal").addEventListener("click", (event) => {
  if (event.target.id === "project-modal") setModal(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setModal(false);
});

$("#project-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const submit = event.currentTarget.querySelector("button[type=submit]");
  submit.disabled = true;
  try {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.get("title"), description: form.get("description") }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not create project");
    event.currentTarget.reset();
    setModal(false);
    toast("Project created");
    await loadDashboard();
  } catch (error) {
    toast(error.message);
  } finally {
    submit.disabled = false;
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-task-id]");
  if (!button) return;
  const task = state.dashboard?.projects.flatMap((project) => project.tasks).find((item) => item.id === button.dataset.taskId);
  if (!task) return;
  const nextStatus = task.status === "done" ? "todo" : "done";
  const response = await fetch(`/api/tasks/${task.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: nextStatus }),
  });
  if (response.ok) {
    toast(nextStatus === "done" ? "Nice work — task completed" : "Task moved back to your list");
    loadDashboard();
  }
});

document.querySelectorAll("[data-toast]").forEach((button) => {
  button.addEventListener("click", () => toast(button.dataset.toast));
});

loadDashboard();