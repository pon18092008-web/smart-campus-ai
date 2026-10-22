// Devices: список IoT-устройств, поиск, фильтры, смена online/offline.
if (renderLayout("Устройства")) {
  const search = document.getElementById("deviceSearch");
  const type = document.getElementById("typeFilter");
  const status = document.getElementById("deviceStatusFilter");

  search.value = new URLSearchParams(location.search).get("q") || "";

  [...new Set(getDevices().map(d => d.type))].sort().forEach(t => {
    type.insertAdjacentHTML("beforeend", `<option>${t}</option>`);
  });

  function render() {
    const all = getDevices();
    const online = all.filter(d => d.status === "online").length;
    document.getElementById("deviceKpis").innerHTML = `
      <div class="kpi"><small>Всего устройств</small><b>${all.length}</b></div>
      <div class="kpi good"><small>В сети</small><b>${online}</b></div>
      <div class="kpi bad"><small>Не в сети</small><b>${all.length - online}</b></div>`;

    const q = search.value.trim().toLowerCase();
    const devices = all.filter(d =>
      (!q || `${d.id} ${d.room}`.toLowerCase().includes(q)) &&
      (!type.value || d.type === type.value) &&
      (!status.value || d.status === status.value));

    document.getElementById("deviceCount").textContent = `Найдено устройств: ${devices.length}`;
    document.getElementById("devicesBody").innerHTML = devices.map(d => `
      <tr>
        <td><b>${d.id}</b></td><td>${d.room}</td><td>${d.type}</td>
        <td>${d.status === "online" ? `${d.value} ${d.unit}` : "—"}</td>
        <td>${badge(d.status)}</td><td>${d.updatedAt}</td>
        <td><button class="btn small secondary" data-id="${d.id}">${d.status === "online" ? "Отключить" : "Включить"}</button></td>
      </tr>`).join("") || '<tr><td colspan="7" class="muted">Ничего не найдено</td></tr>';
  }

  document.getElementById("devicesBody").addEventListener("click", e => {
    const id = e.target.dataset.id;
    if (!id) return;
    const devices = getDevices().map(d => d.id === id ? { ...d, status: d.status === "online" ? "offline" : "online" } : d);
    saveData(KEYS.devices, devices);
    render();
  });

  [search, type, status].forEach(el => el.addEventListener("input", render));
  render();
}
