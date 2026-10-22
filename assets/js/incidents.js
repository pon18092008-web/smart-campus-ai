// Incidents: CRUD заявок (создание, просмотр, изменение, удаление).
if (renderLayout("Заявки")) {
  const form = document.getElementById("incidentForm");
  const fields = ["incidentId", "title", "room", "priority", "status", "assignee", "comment"]
    .reduce((acc, id) => ({ ...acc, [id]: document.getElementById(id) }), {});
  const search = document.getElementById("incidentSearch");
  const statusFilter = document.getElementById("incidentStatusFilter");

  fields.room.innerHTML = getRooms().map(r => `<option value="${r.id}">${r.id} — ${r.type}</option>`).join("");

  function toast(text) {
    const t = document.getElementById("toast");
    t.textContent = text;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1800);
  }

  function render() {
    const all = getIncidents();
    const count = s => all.filter(i => i.status === s).length;
    document.getElementById("incidentKpis").innerHTML = `
      <div class="kpi"><small>Открыто</small><b>${count("open")}</b></div>
      <div class="kpi warn"><small>В работе</small><b>${count("in_progress")}</b></div>
      <div class="kpi good"><small>Решено</small><b>${count("resolved")}</b></div>`;

    const q = search.value.trim().toLowerCase();
    const list = all.filter(i =>
      (!q || `${i.title} ${i.room} ${i.assignee}`.toLowerCase().includes(q)) &&
      (!statusFilter.value || i.status === statusFilter.value));

    document.getElementById("incidentsBody").innerHTML = list.map(i => `
      <tr>
        <td>${i.id}</td><td class="wrap"><b>${escapeHtml(i.title)}</b></td><td>${i.room}</td>
        <td>${badge(i.priority)}</td><td>${badge(i.status)}</td><td>${escapeHtml(i.assignee)}</td>
        <td class="wrap">${escapeHtml(i.comment || "")}</td>
        <td class="actions"><button class="btn small secondary" data-edit="${i.id}">Изменить</button>
            <button class="btn small danger" data-del="${i.id}">Удалить</button></td>
      </tr>`).join("") || '<tr><td colspan="8" class="muted">Заявок нет</td></tr>';
  }

  function resetForm() {
    form.reset();
    fields.incidentId.value = "";
    document.getElementById("formTitle").textContent = "Новая заявка";
    document.getElementById("saveBtn").textContent = "Добавить заявку";
    document.getElementById("cancelBtn").hidden = true;
  }

  // Create / Update
  form.addEventListener("submit", e => {
    e.preventDefault();
    const incidents = getIncidents();
    const data = {
      title: fields.title.value.trim(),
      room: fields.room.value,
      priority: fields.priority.value,
      status: fields.status.value,
      assignee: fields.assignee.value.trim(),
      comment: fields.comment.value.trim()
    };
    const id = Number(fields.incidentId.value);

    if (id) {
      Object.assign(incidents.find(i => i.id === id), data);
      toast(`Заявка №${id} изменена`);
    } else {
      const newId = incidents.reduce((m, i) => Math.max(m, i.id), 0) + 1;
      incidents.push({ id: newId, ...data });
      toast(`Заявка №${newId} добавлена`);
    }

    saveData(KEYS.incidents, incidents);
    resetForm();
    render();
  });

  document.getElementById("cancelBtn").addEventListener("click", resetForm);

  // Edit / Delete
  document.getElementById("incidentsBody").addEventListener("click", e => {
    const editId = Number(e.target.dataset.edit);
    const delId = Number(e.target.dataset.del);

    if (editId) {
      const inc = getIncidents().find(i => i.id === editId);
      Object.keys(fields).forEach(k => { if (k !== "incidentId") fields[k].value = inc[k] || ""; });
      fields.incidentId.value = inc.id;
      document.getElementById("formTitle").textContent = `Изменение заявки №${inc.id}`;
      document.getElementById("saveBtn").textContent = "Сохранить изменения";
      document.getElementById("cancelBtn").hidden = false;
      form.scrollIntoView({ behavior: "smooth" });
    }

    if (delId && confirm(`Удалить заявку №${delId}?`)) {
      saveData(KEYS.incidents, getIncidents().filter(i => i.id !== delId));
      toast(`Заявка №${delId} удалена`);
      render();
    }
  });

  // Заявка из модуля Аналитика: incidents.html?room=A-205&title=...
  const params = new URLSearchParams(location.search);
  if (params.get("room")) {
    fields.room.value = params.get("room");
    fields.title.value = params.get("title") || "";
    fields.priority.value = params.get("priority") || "medium";
    fields.assignee.value = "Инженер";
    fields.comment.value = params.get("comment") || "";
  }

  [search, statusFilter].forEach(el => el.addEventListener("input", render));
  render();
}
