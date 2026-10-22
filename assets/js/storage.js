// Слой хранения данных в localStorage браузера.
const KEYS = {
  rooms: "sc_rooms",
  devices: "sc_devices",
  incidents: "sc_incidents",
  settings: "sc_settings",
  session: "sc_session",
  tempTrend: "sc_temp_trend",
  theme: "theme"
};

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key, fallback = []) {
  const raw = localStorage.getItem(key);

  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Глубокая копия, чтобы не портить исходные массивы из data.js.
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// Версия структуры данных: при её смене старые данные в браузере заменяются новыми.
const DATA_VERSION = "3";

// При первом запуске записываем тестовые данные в localStorage.
function initData() {
  if (localStorage.getItem("sc_version") !== DATA_VERSION) {
    [KEYS.rooms, KEYS.devices, KEYS.incidents, KEYS.tempTrend].forEach(k => localStorage.removeItem(k));
    localStorage.setItem("sc_version", DATA_VERSION);
  }
  if (!localStorage.getItem(KEYS.rooms)) saveData(KEYS.rooms, clone(DEFAULT_ROOMS));
  if (!localStorage.getItem(KEYS.devices)) saveData(KEYS.devices, clone(DEFAULT_DEVICES));
  if (!localStorage.getItem(KEYS.incidents)) saveData(KEYS.incidents, clone(DEFAULT_INCIDENTS));
  if (!localStorage.getItem(KEYS.settings)) {
    saveData(KEYS.settings, { campusName: "МУКР · Политехнический колледж", autoRefresh: false });
  }
  if (!localStorage.getItem(KEYS.tempTrend)) {
    const rooms = loadData(KEYS.rooms);
    const trend = rooms[0].history.temperature.map((_, i) =>
      +(rooms.reduce((s, r) => s + r.history.temperature[i], 0) / rooms.length).toFixed(1));
    saveData(KEYS.tempTrend, trend);
  }
}

// Сброс всех учебных данных (сессия и тема сохраняются).
function resetData() {
  [KEYS.rooms, KEYS.devices, KEYS.incidents, KEYS.settings, KEYS.tempTrend]
    .forEach(k => localStorage.removeItem(k));
  initData();
}

const getRooms = () => loadData(KEYS.rooms);
const getDevices = () => loadData(KEYS.devices);
const getIncidents = () => loadData(KEYS.incidents);
const getSettings = () => loadData(KEYS.settings, {});
const getSession = () => loadData(KEYS.session, null);

initData();
