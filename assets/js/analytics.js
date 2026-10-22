// Analytics: аномалии, z-score график, рекомендации AI.
if (renderLayout("Аналитика")) {
  let chart;
  const riskFilter = document.getElementById("riskFilter");
  const RISK = { high: "high", medium: "medium", low: "low" };

  function render() {
    const rooms = getRooms();
    const anomalies = detectAnomalies(rooms);
    const shown = anomalies.filter(a => !riskFilter.value || a.risk === riskFilter.value);
    const roomsWithIssues = new Set(anomalies.map(a => a.room));

    document.getElementById("aiKpis").innerHTML = `
      <div class="kpi"><small>Проанализировано</small><b>${rooms.length}</b><span>помещений × 3 параметра</span></div>
      <div class="kpi warn"><small>Аномалий найдено</small><b>${anomalies.length}</b><span>в ${roomsWithIssues.size} помещениях</span></div>
      <div class="kpi bad"><small>Высокий риск</small><b>${anomalies.filter(a => a.risk === "high").length}</b></div>
      <div class="kpi"><small>Средний риск</small><b>${anomalies.filter(a => a.risk === "medium").length}</b></div>
      <div class="kpi good"><small>Низкий риск</small><b>${anomalies.filter(a => a.risk === "low").length}</b></div>
      <div class="kpi"><small>Порог z-score</small><b>2.0</b><span>|x − μ| / σ</span></div>`;

    document.getElementById("anomaliesBody").innerHTML = shown.map(a => `
      <tr>
        <td><b>${a.room}</b></td><td>${a.paramName}</td><td>${a.value}</td><td>${a.z}</td>
        <td class="wrap">${a.reason}</td><td>${badge(RISK[a.risk])}</td><td class="wrap">${a.recommendation}</td>
        <td><a class="btn small secondary" href="incidents.html?room=${a.room}&priority=${a.risk}&title=${encodeURIComponent(`${a.paramName}: аномалия`)}&comment=${encodeURIComponent(a.recommendation)}">+ Заявка</a></td>
      </tr>`).join("") || '<tr><td colspan="8" class="muted">Аномалий не обнаружено</td></tr>';

    // Одна рекомендация на помещение, самые рискованные сверху.
    const seen = new Set();
    const recs = anomalies.filter(a => !seen.has(a.room) && seen.add(a.room)).slice(0, 6);
    document.getElementById("recommendations").innerHTML = recs.map(a => `
      <div class="rec"><b>${a.room} · ${a.building} ${badge(RISK[a.risk])}</b>${a.recommendation}</div>`).join("") ||
      '<p class="muted">Параметры всех помещений в норме.</p>';

    chartDefaults();
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById("zChart"), {
      type: "bar",
      data: {
        labels: rooms.map(r => r.id),
        datasets: [
          { label: "z-score температуры", data: rooms.map(r => +zScore(r.history.temperature, r.temperature).toFixed(2)), backgroundColor: cssVar("--yellow"), borderRadius: 4 },
          { label: "z-score CO2", data: rooms.map(r => +zScore(r.history.co2, r.co2).toFixed(2)), backgroundColor: cssVar("--accent"), borderRadius: 4 }
        ]
      },
      options: {
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, suggestedMax: 4 } },
        plugins: { subtitle: { display: true, text: "Аномалия при z > 2" } }
      }
    });
  }

  document.getElementById("simulateBtn").addEventListener("click", () => {
    runSimulation();
    location.reload();
  });
  riskFilter.addEventListener("input", render);
  document.addEventListener("themechange", render);
  render();
}
