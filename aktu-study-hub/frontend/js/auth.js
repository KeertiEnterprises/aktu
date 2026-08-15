const API = ''; // same-origin; backend serves this frontend too

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    document.getElementById('loginForm').classList.toggle('hidden', target !== 'login');
    document.getElementById('signupForm').classList.toggle('hidden', target !== 'signup');
  });
});

function saveSession(data) {
  localStorage.setItem('circuit_token', data.token);
  localStorage.setItem('circuit_user', JSON.stringify(data.user));
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  const form = new FormData(e.target);
  try {
    const resp = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.get('username'), password: form.get('password') }),
    });
    const data = await resp.json();
    if (!resp.ok) { errEl.textContent = data.error || 'Login failed.'; return; }
    saveSession(data);
    window.location.href = 'dashboard.html';
  } catch (err) {
    errEl.textContent = 'Could not reach the server. Is the backend running?';
  }
});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('signupError');
  errEl.textContent = '';
  const form = new FormData(e.target);
  try {
    const resp = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.get('username'),
        email: form.get('email'),
        password: form.get('password'),
      }),
    });
    const data = await resp.json();
    if (!resp.ok) { errEl.textContent = data.error || 'Sign up failed.'; return; }
    saveSession(data);
    window.location.href = 'dashboard.html';
  } catch (err) {
    errEl.textContent = 'Could not reach the server. Is the backend running?';
  }
});
