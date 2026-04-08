const fs = require('fs');

const path = "C:\\\\Users\\\\YCK\\\\Desktop\\\\claude\\\\YCK-Agent\\\\src\\\\web\\\\public\\\\index.html";
let content = fs.readFileSync(path, 'utf8');

const missingCode = `
window.showNativeChat = function() {
  const ws = document.getElementById('welcomeScreen');
  const ic = document.getElementById('innerChatColumn');
  if(ws) ws.style.display = 'flex';
  if(ic) ic.style.display = 'none';
};
window.hideNativeChat = function() {
  const ws = document.getElementById('welcomeScreen');
  const ic = document.getElementById('innerChatColumn');
  if(ws) ws.style.display = 'none';
  if(ic) ic.style.display = 'flex';
};
window.clearChat = function() {
  const msgs = document.getElementById('messages');
  if(msgs) msgs.innerHTML = '';
  showNativeChat();
  currentSessionId = Date.now().toString();
};
window.toggleAppMenu = function(e) {
  if(e) e.stopPropagation();
  const menu = document.getElementById('appMenuDropdown');
  if(menu) menu.classList.toggle('active');
};
document.addEventListener('click', () => {
  const menu = document.getElementById('appMenuDropdown');
  if(menu && menu.classList.contains('active')) menu.classList.remove('active');
});
window.toggleIncognito = function() {
  document.body.classList.toggle('incognito-mode');
};
window.toggleTheme = function() {
  const el = document.documentElement;
  const target = el.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  el.setAttribute('data-theme', target);
  const btn = document.getElementById('themeToggleBtn');
  if(btn) btn.textContent = target === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', target);
};
window.triggerFileUpload = function() {
  alert('FileUpload is not implemented in logic yet');
};
window.sendQuick = function(text) {
  const input = document.getElementById('chatInput');
  if(input) { input.value = text; window.sendMessage(); }
};
window.closeSandbox = function() {
  const el = document.getElementById('mainBody');
  if(el) el.classList.remove('has-sandbox');
};
window.openCustomize = function() {
  const modal = document.getElementById('customizeModal');
  const backdrop = document.getElementById('customizeBackdrop');
  if(modal) modal.classList.add('active');
  if(backdrop) backdrop.classList.add('active');
};
window.closeCustomize = function() {
  const modal = document.getElementById('customizeModal');
  const backdrop = document.getElementById('customizeBackdrop');
  if(modal) modal.classList.remove('active');
  if(backdrop) backdrop.classList.remove('active');
};
window.switchProvider = function(name) {
  fetch('/api/provider', { method: 'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({provider:name}) })
  .then(()=>location.reload());
};
window.loadSessions = async function() {
  try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      const list = document.getElementById('historyList');
      if(list && data && typeof data.map === 'function') {
        list.innerHTML = data.map(s => '<button class="history-item" onclick="loadSession(\\'' + s.id + '\\')"><span class="history-title">' + s.title + '</span> <span class="history-date">' + new Date(s.updatedAt).toLocaleTimeString() + '</span></button>').join('');
      }
  } catch(e) {}
};
window.loadSession = async function(id) {
  currentSessionId = id;
  const res = await fetch('/api/sessions/' + id);
  const msgs = await res.json();
  const container = document.getElementById('messages');
  if(container) container.innerHTML = '';
  if(msgs && msgs.forEach) { msgs.forEach(m => appendMessage(m.role, m.content)); }
  hideNativeChat();
};
window.renderHistory = function() { loadSessions(); };
window.closeModal = function(e, force) {
  if (force || (e && e.target && e.target.classList && e.target.classList.contains('modal-overlay'))) {
    const el = document.getElementById('infoModal');
    if(el) el.style.display = 'none';
  }
};
window.closeFolderBrowser = function() {
  const el = document.getElementById('folderBrowser');
  if(el) el.classList.remove('active');
};
window.confirmFolderSelect = function() {
  closeFolderBrowser();
};
window.updateBadgeCounts = function() {};
window.loadProjectTree = function() {};
window.renderAttachments = function() {};
window.autoResize = function(el) {
  if(el && el.style) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
};

document.addEventListener('DOMContentLoaded', init);
</script>
</body>
</html>
`;

if (!content.includes('window.showNativeChat')) {
  fs.writeFileSync(path, content + missingCode, 'utf8');
  console.log("Successfully appended missing UI functions.");
} else {
  console.log("Functions already exist, doing nothing.");
}
