import { apiRequest, pretty, setAuthToken, setupAuthNav, showMessage } from './app.js';

const form = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');
const result = document.getElementById('loginResult');

setupAuthNav();

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    email: String(formData.get('email') || '').trim(),
    password: String(formData.get('password') || ''),
  };

  try {
    message.style.display = 'block';
    showMessage(message, 'Signing in...');

    const loginResponse = await apiRequest('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!loginResponse?.token) {
      throw new Error('Login succeeded but token is missing in response.');
    }

    setAuthToken(loginResponse.token);

    const meResponse = await apiRequest('/v1/auth/me');
    result.textContent = pretty(meResponse);
    showMessage(message, 'Login successful. You can now create and manage jobs.');

    setupAuthNav();
  } catch (error) {
    const details = error.data ? `\n${pretty(error.data)}` : '';
    result.textContent = `Error: ${error.message}${details}`;
    message.style.display = 'block';
    showMessage(message, `Login failed: ${error.message}`, true);
  }
});
