// Учебная форма входа: сохраняем только email и роль (пароль не храним).
if (getSession()) location.href = "dashboard.html";

document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;
  const error = document.getElementById("loginError");

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    error.textContent = "Введите корректный email.";
    return;
  }
  if (password.length < 4) {
    error.textContent = "Пароль должен содержать минимум 4 символа.";
    return;
  }

  saveData(KEYS.session, { email, role, name: email.split("@")[0] });
  location.href = "dashboard.html";
});
