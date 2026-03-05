import { setupAuthNav, setupBaseUrlInput, showMessage } from './app.js';

const msg = document.getElementById('homeMessage');
setupBaseUrlInput('apiBase', 'saveApiBase', 'homeMessage');
setupAuthNav();

if (msg) {
  msg.style.display = 'block';
  showMessage(msg, 'Set backend base URL once, then navigate using the top tabs.');
}
