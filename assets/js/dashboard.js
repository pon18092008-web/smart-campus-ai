// Dashboard: KPI, графики, уведомления, проблемные помещения.
if (renderLayout("Панель управления")) {
  const charts = {};

  function render() {
    const rooms = getRooms();
    const devices = getDevices();
    const incidents = getIncidents();
    const notes = buildNotifications(rooms, devices);
    const online = devices.filter(d => d.status === "online").length;
    const openIncidents = incidents.filter(i => i.status !== "resolved").length;
    const energy = rooms.reduce((s, r) => s + r.energy, 0);
    const problem = rooms.filter(r => roomStatus(r) !== "normal");
    const anomalies = detectAnomalies(rooms);

    document.getElementById("kpis").innerHTML = `
      <div class="kpi"><small>Помещений</small><b>${rooms.length}</b><span>${rooms.length - problem.length} в норме</span></div>
      <div class="kpi good"><small>Устройств в сети</small><b>${online}/${devices.length}</b><span>${devices.length - online} не в сети</span></div>
      <div class="kpi ${openIncidents ? "warn" : ""}"><small>Открытых заявок</small><b>${openIncidents}</b><span>всего ${incidents.length}</span></div>
      <div class="kpi"><small>Энергия сейчас</small><b>${energy.toFixed(1)}</b><span>кВт·ч в час</span></div>
      <div class="kpi ${notes.length ? "bad" : "good"}"><small>Предупреждений</small><b>${notes.length}</b><span>уведомлений</span></div>
      <div class="kpi ${anomalies.length ? "warn" : "good"}"><small>AI-аномалий</small><b>${anomalies.length}</b><span><a href="analytics.html">открыть анализ</a></span></div>`;

    document.getElementById("notifications").innerHTML =
      notes.slice(0, 7).map(n => `<div class="list-item ${n.level}">${escapeHtml(n.text)}</div>`).join("") ||
      '<p class="muted">Все параметры в норме</p>';

    document.getElementById("problemRooms").innerHTML = problem.map(r => `
      <tr><td><b>${r.id}</b></td><td>${r.building}</td><td>${r.temperature} °C</td><td>${r.co2} ppm</td>
      <td>${r.energy} кВт·ч</td><td>${badge(roomStatus(r))}</td><td class="wrap">${getRecommendation(r)}</td></tr>`).join("") ||
      '<tr><td colspan="7" class="muted">Проблемных помещений нет</td></tr>';

    drawCharts(rooms, devices);
  }

  function drawCharts(rooms, devices) {
    chartDefaults();
    Object.values(charts).forEach(c => c.destroy());

    const buildings = ["Корпус A", "Корпус B", "Корпус C"];
    const energyBy = buildings.map(b => +rooms.filter(r => r.building === b).reduce((s, r) => s + r.energy, 0).toFixed(1));
    const baseBy = buildings.map(b => +rooms.filter(r => r.building === b).reduce((s, r) => s + r.baseline, 0).toFixed(1));

    charts.energy = new Chart(document.getElementById("energyChart"), {
      type: "bar",
      data: {
        labels: buildings,
        datasets: [
          { label: "Текущее, кВт·ч", data: energyBy, backgroundColor: cssVar("--accent"), borderRadius: 6 },
          { label: "Базовая линия, кВт·ч", data: baseBy, backgroundColor: cssVar("--line"), borderRadius: 6 }
        ]
      },
      options: { maintainAspectRatio: false }
    });

    const online = devices.filter(d => d.status === "online").length;
    charts.devices = new Chart(document.getElementById("deviceChart"), {
      type: "doughnut",
      data: {
        labels: ["В сети", "Не в сети"],
        datasets: [{ data: [online, devices.length - online], backgroundColor: [cssVar("--green"), cssVar("--red")], borderWidth: 0 }]
      },
      options: { maintainAspectRatio: false, cutout: "65%", plugins: { legend: { position: "bottom" } } }
    });

    const trend = loadData(KEYS.tempTrend, []);
    charts.temp = new Chart(document.getElementById("tempChart"), {
      type: "line",
      data: {
        labels: trend.map((_, i) => i === trend.length - 1 ? "сейчас" : `-${trend.length - 1 - i}`),
        datasets: [{ label: "Средняя температура, °C", data: trend, borderColor: cssVar("--yellow"), backgroundColor: "rgba(255,200,87,.15)", fill: true, tension: .35 }]
      },
      options: { maintainAspectRatio: false }
    });

    charts.week = new Chart(document.getElementById("weekChart"), {
      type: "line",
      data: {
        labels: ENERGY_WEEK.labels,
        datasets: [{ label: "кВт·ч за сутки", data: ENERGY_WEEK.values, borderColor: cssVar("--accent"), tension: .3, pointRadius: 4 }]
      },
      options: { maintainAspectRatio: false }
    });
  }

  document.getElementById("simulateBtn").addEventListener("click", () => {
    runSimulation();
    location.reload(); // перерисовываем и уведомления в topbar
  });

  document.addEventListener("themechange", render);

  if (getSettings().autoRefresh) {
    setInterval(() => { runSimulation(); render(); }, 10000);
  }

  render();
}
