// Rooms: таблица помещений, поиск и фильтры.
if (renderLayout("Помещения")) {
  const search = document.getElementById("roomSearch");
  const building = document.getElementById("buildingFilter");
  const status = document.getElementById("statusFilter");

  // Запрос из глобального поиска (rooms.html?q=...)
  search.value = new URLSearchParams(location.search).get("q") || "";

  function render() {
    const q = search.value.trim().toLowerCase();
    const rooms = getRooms().filter(r => {
      const text = `${r.id} ${r.type} ${r.building}`.toLowerCase();
      return (!q || text.includes(q)) &&
        (!building.value || r.building === building.value) &&
        (!status.value || roomStatus(r) === status.value);
    });

    document.getElementById("roomCount").textContent = `Найдено помещений: ${rooms.length}`;
    document.getElementById("roomsBody").innerHTML = rooms.map(r => `
      <tr>
        <td><b>${r.id}</b></td><td>${r.building}</td><td>${r.floor}</td><td>${r.type}</td>
        <td>${r.temperature} °C</td><td>${r.co2} ppm</td><td>${r.energy} кВт·ч</td>
        <td>${r.occupancy} / ${r.capacity}</td><td>${badge(roomStatus(r))}</td>
      </tr>`).join("") || '<tr><td colspan="9" class="muted">Ничего не найдено</td></tr>';
  }

  [search, building, status].forEach(el => el.addEventListener("input", render));
  render();
}
