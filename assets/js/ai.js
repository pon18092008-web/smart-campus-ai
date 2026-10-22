// AI Analytics: пороги, z-score, рекомендации и симуляция датчиков.
// Это статистическое (rule-based) обнаружение аномалий, а не генеративный AI.

const THRESHOLDS = {
  temperature: { warning: 28, critical: 32 },  // °C
  co2: { warning: 1000, critical: 1500 },       // ppm
  energy: { warning: 0.3, critical: 0.6 }       // рост от базовой линии: +30% / +60%
};

const LEVEL_RANK = { normal: 0, warning: 1, critical: 2 };

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values) {
  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0)
    / values.length;

  return Math.sqrt(variance);
}

function zScore(values, current) {
  const sd = stdDev(values);

  if (sd === 0) return 0;

  return Math.abs((current - mean(values)) / sd);
}

// Уровень по порогам для одного параметра.
function levelTemperature(t) {
  if (t >= THRESHOLDS.temperature.critical) return "critical";
  if (t >= THRESHOLDS.temperature.warning) return "warning";
  return "normal";
}

function levelCO2(c) {
  if (c >= THRESHOLDS.co2.critical) return "critical";
  if (c >= THRESHOLDS.co2.warning) return "warning";
  return "normal";
}

function levelEnergy(energy, baseline) {
  const growth = (energy - baseline) / baseline;
  if (growth >= THRESHOLDS.energy.critical) return "critical";
  if (growth >= THRESHOLDS.energy.warning) return "warning";
  return "normal";
}

// Итоговый статус помещения — худший из трёх параметров.
function roomStatus(room) {
  const levels = [levelTemperature(room.temperature), levelCO2(room.co2), levelEnergy(room.energy, room.baseline)];
  return levels.reduce((worst, l) => (LEVEL_RANK[l] > LEVEL_RANK[worst] ? l : worst), "normal");
}

function getRecommendation(room) {
  if (room.co2 >= 1500) {
    return "Критический CO2: включить вентиляцию и проверить аудиторию.";
  }

  if (room.temperature >= 32) {
    return "Перегрев: проверить кондиционер или систему вентиляции.";
  }

  if (room.occupancy === 0 && room.energy > room.baseline * 1.3) {
    return "В помещении нет людей, но энергопотребление высокое: выключить оборудование и свет.";
  }

  if (room.co2 >= 1000) {
    return "CO2 выше нормы: проветрить помещение на перемене.";
  }

  if (room.temperature >= 28) {
    return "Температура повышена: снизить нагрузку или включить кондиционер.";
  }

  if (room.energy > room.baseline * 1.3) {
    return "Перерасход энергии: проверить оборудование, оставленное включённым.";
  }

  return "Параметры в норме.";
}

// Рекомендация по конкретному параметру, в котором найдена аномалия.
function getParamRecommendation(room, param) {
  const avg = mean(room.history[param]);
  const below = room[param] < avg;

  if (param === "temperature") {
    if (below) return "Температура резко упала: проверить отопление и закрыты ли окна.";
    if (room.temperature >= 32) return "Перегрев: проверить кондиционер или систему вентиляции.";
    return "Температура выше обычной: включить кондиционер или проветрить помещение.";
  }

  if (param === "co2") {
    if (below) return "CO2 резко снизился: проверить исправность датчика.";
    if (room.co2 >= 1500) return "Критический CO2: включить вентиляцию и проверить аудиторию.";
    return "CO2 выше нормы: проветрить помещение на перемене.";
  }

  if (below) return "Потребление ниже обычного: проверить, не отключено ли оборудование и исправен ли счётчик.";
  if (room.occupancy === 0) return "В помещении нет людей, но энергопотребление высокое: выключить оборудование и свет.";
  return "Перерасход энергии: проверить оборудование, оставленное включённым.";
}

const PARAM_INFO = {
  temperature: { name: "Температура", unit: "°C" },
  co2: { name: "CO2", unit: "ppm" },
  energy: { name: "Энергия", unit: "кВт·ч" }
};

// Поиск аномалий по всем помещениям: пороги + z-score (> 2) относительно истории.
function detectAnomalies(rooms) {
  const result = [];

  rooms.forEach(room => {
    const levels = {
      temperature: levelTemperature(room.temperature),
      co2: levelCO2(room.co2),
      energy: levelEnergy(room.energy, room.baseline)
    };

    Object.keys(PARAM_INFO).forEach(param => {
      const current = room[param];
      const z = zScore(room.history[param], current);
      const level = levels[param];
      const statistical = z > 2;

      if (level === "normal" && !statistical) return;

      const avg = mean(room.history[param]);
      const info = PARAM_INFO[param];
      const reasons = [];
      if (level !== "normal") reasons.push(`превышен порог (${level === "critical" ? "critical" : "warning"})`);
      if (statistical) reasons.push(`z-score = ${z.toFixed(1)}: отклонение от среднего ${avg.toFixed(1)} ${info.unit}`);

      // Риск: critical по порогу или очень сильное отклонение — высокий.
      let risk = "low";
      if (level === "warning" || z > 3) risk = "medium";
      if (level === "critical" || (level === "warning" && z > 3)) risk = "high";

      result.push({
        room: room.id,
        building: room.building,
        param,
        paramName: info.name,
        value: `${current} ${info.unit}`,
        z: +z.toFixed(2),
        risk,
        reason: reasons.join("; "),
        recommendation: getParamRecommendation(room, param)
      });
    });
  });

  const order = { high: 0, medium: 1, low: 2 };
  return result.sort((a, b) => order[a.risk] - order[b.risk] || b.z - a.z);
}

// Уведомления для колокольчика и dashboard.
function buildNotifications(rooms, devices) {
  const list = [];

  rooms.forEach(r => {
    if (levelCO2(r.co2) !== "normal") {
      list.push({ level: levelCO2(r.co2), text: `${r.id}: высокий CO2 — ${r.co2} ppm` });
    }
    if (levelTemperature(r.temperature) !== "normal") {
      list.push({ level: levelTemperature(r.temperature), text: `${r.id}: перегрев — ${r.temperature} °C` });
    }
    if (levelEnergy(r.energy, r.baseline) !== "normal") {
      const growth = Math.round((r.energy / r.baseline - 1) * 100);
      list.push({ level: levelEnergy(r.energy, r.baseline), text: `${r.id}: перерасход энергии +${growth}%` });
    }
  });

  devices.filter(d => d.status === "offline").forEach(d => {
    list.push({ level: "warning", text: `${d.id}: датчик не в сети (${d.room})` });
  });

  return list.sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level]);
}

// ---------- Симуляция датчиков ----------

function random(min, max) {
  return +(Math.random() * (max - min) + min).toFixed(1);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Новое показание: небольшое случайное колебание, иногда — резкий скачок (аномалия).
function simulateRoom(room) {
  ["temperature", "co2", "energy"].forEach(param => {
    room.history[param].push(room[param]);
    if (room.history[param].length > 12) room.history[param].shift();
  });

  const avgT = mean(room.history.temperature);
  const avgC = mean(room.history.co2);
  const spike = Math.random() < 0.12;

  room.temperature = clamp(+(avgT + random(-0.8, 0.8) + (spike ? random(5, 9) : 0)).toFixed(1), 16, 40);
  room.co2 = Math.round(clamp(avgC + random(-60, 60) + (spike ? random(500, 800) : 0), 400, 2200));
  room.energy = clamp(+(room.baseline * random(0.85, 1.15) + (Math.random() < 0.08 ? room.baseline * 0.7 : 0)).toFixed(1), 0.5, 12);
  room.occupancy = room.capacity > 3 ? Math.round(random(0, room.capacity)) : 0;

  return room;
}

// Один «тик» симуляции: обновляем помещения, связанные датчики и тренд температуры.
function runSimulation() {
  const rooms = getRooms().map(simulateRoom);
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ` +
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const devices = getDevices().map(d => {
    const room = rooms.find(r => r.id === d.room);
    if (d.status === "offline" || !room) return d;
    if (d.type === "Датчик температуры") d.value = room.temperature;
    if (d.type === "Датчик CO2") d.value = room.co2;
    if (d.type === "Счётчик энергии") d.value = room.energy;
    if (d.type === "Датчик движения") d.value = room.occupancy;
    d.updatedAt = stamp;
    return d;
  });

  const trend = loadData(KEYS.tempTrend, []);
  trend.push(+mean(rooms.map(r => r.temperature)).toFixed(1));
  if (trend.length > 12) trend.shift();

  saveData(KEYS.rooms, rooms);
  saveData(KEYS.devices, devices);
  saveData(KEYS.tempTrend, trend);
}
