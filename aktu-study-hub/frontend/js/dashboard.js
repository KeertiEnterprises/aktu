const API = '';
const token = localStorage.getItem('circuit_token');
const user = JSON.parse(localStorage.getItem('circuit_user') || 'null');

if (!token || !user) {
  window.location.href = 'login.html';
}

document.getElementById('whoami').textContent = `@${user.username}`;
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('circuit_token');
  localStorage.removeItem('circuit_user');
  window.location.href = 'index.html';
});

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function apiCall(path, opts = {}) {
  const resp = await fetch(`${API}${path}`, { ...opts, headers: authHeaders() });
  if (resp.status === 401) {
    localStorage.removeItem('circuit_token');
    window.location.href = 'login.html';
    return null;
  }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

// ---------- Panel tabs ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const panel = btn.dataset.panel;
    document.getElementById('panel-resources').classList.toggle('hidden', panel !== 'resources');
    document.getElementById('panel-chat').classList.toggle('hidden', panel !== 'chat');
  });
});

// ---------- Resources ----------
const addBtn = document.getElementById('addResourceBtn');
const form = document.getElementById('addResourceForm');
addBtn.addEventListener('click', () => form.classList.toggle('hidden'));
document.getElementById('cancelResourceBtn').addEventListener('click', () => form.classList.add('hidden'));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const body = Object.fromEntries(fd.entries());
  try {
    await apiCall('/api/resources', { method: 'POST', body: JSON.stringify(body) });
    form.reset();
    form.classList.add('hidden');
    loadResources();
  } catch (err) {
    alert(err.message);
  }
});

async function loadResources() {
  const list = document.getElementById('resourceList');
  list.innerHTML = '<p>Loading…</p>';
  try {
    const resources = await apiCall('/api/resources');
    if (!resources.length) {
      list.innerHTML = '<p>No resources yet — add the first one.</p>';
      return;
    }
    list.innerHTML = '';
    resources.forEach(r => {
      const item = document.createElement('div');
      item.className = 'resource-item';
      item.innerHTML = `
        <div>
          <h4>${escapeHtml(r.title)}</h4>
          <div class="meta">${escapeHtml(r.subject)} · Sem ${escapeHtml(r.semester)} · ${escapeHtml(r.type)} · by @${escapeHtml(r.uploaded_by_name)}</div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <a class="open" href="${escapeAttr(r.url_or_path)}" target="_blank" rel="noopener">Open →</a>
          ${r.uploaded_by === user.id ? `<button class="del" data-id="${r.id}" title="Delete">✕</button>` : ''}
        </div>`;
      list.appendChild(item);
    });
    list.querySelectorAll('.del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this resource?')) return;
        await apiCall(`/api/resources/${btn.dataset.id}`, { method: 'DELETE' });
        loadResources();
      });
    });
  } catch (err) {
    list.innerHTML = `<p>${escapeHtml(err.message)}</p>`;
  }
}
loadResources();

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s) { return escapeHtml(s); }

// ---------- Chat ----------
const chatLog = document.getElementById('chatLog');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

function addBubble(role, text) {
  const el = document.createElement('div');
  el.className = `chat-line ${role === 'user' ? 'me' : 'them'}`;
  el.textContent = text;
  chatLog.appendChild(el);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function loadHistory() {
  try {
    const history = await apiCall('/api/chat/history');
    history.forEach(m => addBubble(m.role, m.content));
  } catch (err) { /* ignore on first load */ }
}
loadHistory();

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;
  addBubble('user', message);
  chatInput.value = '';
  addBubble('assistant', '…thinking');
  try {
    const data = await apiCall('/api/chat', { method: 'POST', body: JSON.stringify({ message }) });
    chatLog.lastChild.textContent = data.reply;
  } catch (err) {
    chatLog.lastChild.textContent = err.message;
  }
});
