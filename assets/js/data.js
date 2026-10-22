// Тестовые (учебные) данные Smart Campus AI.
// Показания датчиков имитируются — реальных IoT-устройств нет.

// history — последние показания температуры, CO2 и энергии (для z-score).
// baseline — базовая линия энергопотребления помещения, кВт·ч.
const DEFAULT_ROOMS = [
  { id: "A-101", building: "Корпус A", floor: 1, type: "Компьютерный класс", temperature: 24.3, co2: 780,  energy: 3.6, baseline: 3.5, occupancy: 18, capacity: 24 },
  { id: "A-102", building: "Корпус A", floor: 1, type: "Лекционная аудитория", temperature: 22.1, co2: 640, energy: 2.1, baseline: 2.2, occupancy: 35, capacity: 60 },
  { id: "A-205", building: "Корпус A", floor: 2, type: "Аудитория", temperature: 25.8, co2: 1620, energy: 2.4, baseline: 2.0, occupancy: 40, capacity: 40 },
  { id: "A-210", building: "Корпус A", floor: 2, type: "Лаборатория сетей", temperature: 23.4, co2: 910, energy: 4.1, baseline: 4.0, occupancy: 14, capacity: 16 },
  { id: "A-301", building: "Корпус A", floor: 3, type: "Серверная", temperature: 32.6, co2: 450, energy: 7.2, baseline: 6.8, occupancy: 0, capacity: 2 },
  { id: "B-104", building: "Корпус B", floor: 1, type: "Библиотека", temperature: 21.7, co2: 690, energy: 2.8, baseline: 2.9, occupancy: 22, capacity: 50 },
  { id: "B-112", building: "Корпус B", floor: 1, type: "Спортзал", temperature: 19.5, co2: 1180, energy: 3.3, baseline: 3.2, occupancy: 28, capacity: 60 },
  { id: "B-203", building: "Корпус B", floor: 2, type: "Компьютерный класс", temperature: 28.9, co2: 1050, energy: 4.4, baseline: 3.5, occupancy: 24, capacity: 24 },
  { id: "B-215", building: "Корпус B", floor: 2, type: "Аудитория", temperature: 22.9, co2: 720, energy: 5.6, baseline: 2.1, occupancy: 0, capacity: 30 },
  { id: "C-001", building: "Корпус C", floor: 0, type: "Техническое помещение", temperature: 20.4, co2: 520, energy: 1.9, baseline: 1.8, occupancy: 0, capacity: 3 },
  { id: "C-105", building: "Корпус C", floor: 1, type: "Администрация", temperature: 23.0, co2: 810, energy: 2.5, baseline: 2.4, occupancy: 9, capacity: 12 },
  { id: "C-118", building: "Корпус C", floor: 1, type: "Столовая", temperature: 26.4, co2: 980, energy: 6.1, baseline: 5.9, occupancy: 64, capacity: 120 },
  { id: "C-204", building: "Корпус C", floor: 2, type: "Лаборатория IoT", temperature: 24.0, co2: 860, energy: 3.9, baseline: 3.8, occupancy: 12, capacity: 16 },
  { id: "C-220", building: "Корпус C", floor: 2, type: "Конференц-зал", temperature: 22.6, co2: 600, energy: 1.6, baseline: 2.6, occupancy: 0, capacity: 80 }
];

// Генерация «прошлых» показаний вокруг нормального значения помещения.
function makeHistory(center, spread, count = 12) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const wave = Math.sin(i * 1.3 + center) * spread;
    out.push(+(center + wave).toFixed(1));
  }
  return out;
}

// Нормальные значения (до текущего замера) — чтобы аномалии было с чем сравнивать.
const NORMAL_STATE = {
  "A-101": [24.0, 760, 3.5], "A-102": [22.0, 650, 2.2], "A-205": [24.5, 900, 2.0], "A-210": [23.2, 880, 4.0],
  "A-301": [22.5, 450, 6.8], "B-104": [21.8, 700, 2.9], "B-112": [19.8, 1100, 3.2], "B-203": [24.0, 950, 3.5],
  "B-215": [22.8, 700, 2.1], "C-001": [20.5, 520, 1.8], "C-105": [23.0, 800, 2.4], "C-118": [26.0, 960, 5.9],
  "C-204": [24.0, 850, 3.8], "C-220": [22.5, 600, 2.6]
};

DEFAULT_ROOMS.forEach(room => {
  const [t, c, e] = NORMAL_STATE[room.id];
  room.history = {
    temperature: makeHistory(t, 0.9),
    co2: makeHistory(c, 70).map(Math.round),
    energy: makeHistory(e, 0.35)
  };
});

const DEFAULT_DEVICES = [
  { id: "TEMP-A101-01", room: "A-101", type: "Датчик температуры", status: "online",  value: 24.3, unit: "°C" },
  { id: "CO2-A101-01",  room: "A-101", type: "Датчик CO2",         status: "online",  value: 780,  unit: "ppm" },
  { id: "LIGHT-A102-01", room: "A-102", type: "Контроллер освещения",  status: "online",  value: 70,   unit: "%" },
  { id: "CO2-A205-01",  room: "A-205", type: "Датчик CO2",         status: "online",  value: 1620, unit: "ppm" },
  { id: "TEMP-A205-01", room: "A-205", type: "Датчик температуры", status: "online",  value: 25.8, unit: "°C" },
  { id: "PWR-A210-01",  room: "A-210", type: "Счётчик энергии",        status: "online",  value: 4.1,  unit: "кВт·ч" },
  { id: "TEMP-A301-01", room: "A-301", type: "Датчик температуры", status: "online",  value: 32.6, unit: "°C" },
  { id: "PWR-A301-01",  room: "A-301", type: "Счётчик энергии",        status: "online",  value: 7.2,  unit: "кВт·ч" },
  { id: "ACS-A301-01",  room: "A-301", type: "Контроль доступа",     status: "online",  value: 0,    unit: "входов" },
  { id: "CAM-B104-01",  room: "B-104", type: "IP-камера",          status: "online",  value: 1,    unit: "поток" },
  { id: "TEMP-B112-01", room: "B-112", type: "Датчик температуры", status: "offline", value: 19.5, unit: "°C" },
  { id: "CO2-B112-01",  room: "B-112", type: "Датчик CO2",         status: "online",  value: 1180, unit: "ppm" },
  { id: "TEMP-B203-01", room: "B-203", type: "Датчик температуры", status: "online",  value: 28.9, unit: "°C" },
  { id: "PWR-B203-01",  room: "B-203", type: "Счётчик энергии",        status: "online",  value: 4.4,  unit: "кВт·ч" },
  { id: "PWR-B215-01",  room: "B-215", type: "Счётчик энергии",        status: "online",  value: 5.6,  unit: "кВт·ч" },
  { id: "MOTION-B215-01", room: "B-215", type: "Датчик движения",    status: "online",  value: 0,    unit: "чел." },
  { id: "LEAK-C001-01", room: "C-001", type: "Датчик протечки",        status: "offline", value: 0,    unit: "" },
  { id: "TEMP-C105-01", room: "C-105", type: "Датчик температуры", status: "online",  value: 23.0, unit: "°C" },
  { id: "CAM-C118-01",  room: "C-118", type: "IP-камера",          status: "online",  value: 1,    unit: "поток" },
  { id: "PWR-C118-01",  room: "C-118", type: "Счётчик энергии",        status: "online",  value: 6.1,  unit: "кВт·ч" },
  { id: "CO2-C204-01",  room: "C-204", type: "Датчик CO2",         status: "online",  value: 860,  unit: "ppm" },
  { id: "LIGHT-C204-01", room: "C-204", type: "Контроллер освещения",  status: "online",  value: 85,   unit: "%" },
  { id: "ACS-C220-01",  room: "C-220", type: "Контроль доступа",     status: "online",  value: 0,    unit: "входов" },
  { id: "LIGHT-C220-01", room: "C-220", type: "Контроллер освещения",  status: "offline", value: 0,    unit: "%" }
];

DEFAULT_DEVICES.forEach((d, i) => {
  d.updatedAt = `2026-10-22 14:${String(10 + i).padStart(2, "0")}`;
});

const DEFAULT_INCIDENTS = [
  { id: 1, title: "Высокий уровень CO2", room: "A-205", priority: "high", status: "open", assignee: "Инженер", comment: "Датчик показывает более 1500 ppm во время пары." },
  { id: 2, title: "Перегрев серверной", room: "A-301", priority: "high", status: "in_progress", assignee: "Системный администратор", comment: "Проверить кондиционер." },
  { id: 3, title: "Не отвечает датчик температуры", room: "B-112", priority: "medium", status: "open", assignee: "Инженер", comment: "Датчик не в сети с утра." },
  { id: 4, title: "Перегорела лампа", room: "C-220", priority: "low", status: "resolved", assignee: "Электрик", comment: "Заменена 21.10." }
];

// Энергопотребление кампуса за последние 7 дней, кВт·ч.
const ENERGY_WEEK = {
  labels: ["16.10", "17.10", "18.10", "19.10", "20.10", "21.10", "22.10"],
  values: [398, 405, 260, 241, 420, 431, 412]
};
