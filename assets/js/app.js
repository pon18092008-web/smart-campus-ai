// Общая часть всех страниц: тема, проверка входа, sidebar, topbar, уведомления.

const NAV = [
  { href: "dashboard.html", icon: "📊", title: "Панель управления" },
  { href: "rooms.html", icon: "🏫", title: "Помещения" },
  { href: "devices.html", icon: "📡", title: "Устройства" },
  { href: "incidents.html", icon: "🛠", title: "Заявки" },
  { href: "analytics.html", icon: "🧠", title: "Аналитика" },
  { href: "settings.html", icon: "⚙️", title: "Настройки" }
];

const ROLE_NAMES = { admin: "Администратор", engineer: "Инженер", operator: "Оператор" };

const STATUS_LABELS = {
  normal: "Норма", warning: "Внимание", critical: "Критично",
  online: "В сети", offline: "Не в сети",
  open: "Открыта", in_progress: "В работе", resolved: "Решена",
  high: "Высокий", medium: "Средний", low: "Низкий"
};

function badge(value) {
  return `<span class="badge badge-${value}">${STATUS_LABELS[value] || value}</span>`;
}

// Экранирование пользовательского текста перед вставкой в HTML.
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

// ---------- Тема ----------
function applyTheme() {
  document.body.classList.toggle("light", localStorage.getItem(KEYS.theme) === "light");
}

function toggleTheme() {
  document.body.classList.toggle("light");

  const theme =
    document.body.classList.contains("light")
      ? "light"
      : "dark";

  localStorage.setItem(KEYS.theme, theme);
  document.dispatchEvent(new Event("themechange"));
}

// ---------- Вход (учебная имитация) ----------
function requireSession() {
  let session = getSession();
  // ?demo — быстрый вход администратором для демонстрации/скриншотов
  if (!session && new URLSearchParams(location.search).has("demo")) {
    session = { email: "admin@campus.kg", role: "admin", name: "Эсенканов Н.А." };
    saveData(KEYS.session, session);
  }
  if (!session) {
    location.href = "index.html";
    return null;
  }
  return session;
}

function logout() {
  localStorage.removeItem(KEYS.session);
  location.href = "index.html";
}

// ---------- Layout ----------
function renderLayout(pageTitle) {
  const session = requireSession();
  if (!session) return false;

  const current = location.pathname.split("/").pop() || "dashboard.html";
  const settings = getSettings();
  const notes = buildNotifications(getRooms(), getDevices());

  const sidebar = document.createElement("aside");
  sidebar.className = "sidebar";
  sidebar.id = "sidebar";
  sidebar.innerHTML = `
    <div class="logo"><span class="logo-mark">УК</span><div><b>Умный кампус AI</b><small>${escapeHtml(settings.campusName || "")}</small></div></div>
    <nav>${NAV.map(n => `<a href="${n.href}" class="${n.href === current ? "active" : ""}"><span>${n.icon}</span>${n.title}</a>`).join("")}</nav>
    <div class="sidebar-foot"><span class="dot"></span> AI-аналитика работает</div>`;

  const topbar = document.createElement("header");
  topbar.className = "topbar";
  topbar.innerHTML = `
    <button class="icon-btn menu-btn" id="menuBtn" aria-label="Меню">☰</button>
    <h1>${pageTitle}</h1>
    <form class="search" id="globalSearch"><input type="search" placeholder="Поиск по кампусу…" id="globalSearchInput"></form>
    <button class="icon-btn" id="themeButton" title="Сменить тему" aria-label="Сменить тему">◐</button>
    <div class="notif">
      <button class="icon-btn" id="notifBtn" aria-label="Уведомления">🔔${notes.length ? `<span class="count">${notes.length}</span>` : ""}</button>
      <div class="notif-panel" id="notifPanel">
        <b>Уведомления (${notes.length})</b>
        ${notes.map(n => `<div class="notif-item ${n.level}">${escapeHtml(n.text)}</div>`).join("") || "<p>Нет предупреждений</p>"}
      </div>
    </div>
    <div class="profile"><span class="avatar">${escapeHtml(session.name || session.email).charAt(0)}</span>
      <div><b>${escapeHtml(session.name || session.email)}</b><small>${ROLE_NAMES[session.role]}</small></div>
      <button class="icon-btn" id="logoutBtn" title="Выйти" aria-label="Выйти">⏻</button></div>`;

  const main = document.querySelector("main");
  document.body.prepend(sidebar);
  main.prepend(topbar);

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  document.body.append(overlay);

  document.getElementById("menuBtn").addEventListener("click", () => document.body.classList.toggle("menu-open"));
  overlay.addEventListener("click", () => document.body.classList.remove("menu-open"));
  document.getElementById("themeButton").addEventListener("click", toggleTheme);
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("notifBtn").addEventListener("click", e => {
    e.stopPropagation();
    document.getElementById("notifPanel").classList.toggle("open");
  });
  document.addEventListener("click", () => document.getElementById("notifPanel").classList.remove("open"));

  // Глобальный поиск: переходим на Rooms или Devices с запросом в URL.
  document.getElementById("globalSearch").addEventListener("submit", e => {
    e.preventDefault();
    const q = document.getElementById("globalSearchInput").value.trim();
    if (!q) return;
    const isDevice = getDevices().some(d => d.id.toLowerCase().includes(q.toLowerCase()));
    location.href = `${isDevice ? "devices" : "rooms"}.html?q=${encodeURIComponent(q)}`;
  });

  return true;
}

// Цвета графиков берём из CSS-переменных, чтобы они менялись вместе с темой.
function cssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function chartDefaults() {
  if (!window.Chart) return;
  Chart.defaults.color = cssVar("--muted");
  Chart.defaults.borderColor = cssVar("--line");
  Chart.defaults.font.family = "Inter, Segoe UI, Arial, sans-serif";
}

applyTheme();
