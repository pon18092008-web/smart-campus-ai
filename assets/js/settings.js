// Settings: тема, параметры кампуса, сброс тестовых данных.
if (renderLayout("Настройки")) {
  const settings = getSettings();
  const nameInput = document.getElementById("campusName");
  const autoRefresh = document.getElementById("autoRefresh");

  nameInput.value = settings.campusName || "";
  autoRefresh.checked = !!settings.autoRefresh;

  function setTheme(theme) {
    if (document.body.classList.contains("light") !== (theme === "light")) toggleTheme();
  }

  document.getElementById("darkBtn").addEventListener("click", () => setTheme("dark"));
  document.getElementById("lightBtn").addEventListener("click", () => setTheme("light"));

  function showInfo() {
    document.getElementById("dataInfo").textContent =
      `Сейчас в localStorage: помещений — ${getRooms().length}, устройств — ${getDevices().length}, заявок — ${getIncidents().length}.`;
  }

  document.getElementById("settingsForm").addEventListener("submit", e => {
    e.preventDefault();
    saveData(KEYS.settings, { ...getSettings(), campusName: nameInput.value.trim(), autoRefresh: autoRefresh.checked });
    location.reload();
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Вернуть все помещения, устройства и заявки к исходным тестовым данным?")) {
      resetData();
      location.reload();
    }
  });

  showInfo();
}
