import { apiRequest, pretty, getJobId, setupAuthNav, showMessage } from './app.js';

const form = document.getElementById('createJobForm');
const message = document.getElementById('createMessage');
const result = document.getElementById('createResult');
setupAuthNav();

function parseExtraJson(rawText) {
  if (!rawText.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch (_error) {
    throw new Error('Extra JSON fields must be valid JSON.');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);

  try {
    const extraJson = parseExtraJson(String(formData.get('extraJson') || ''));

    const payload = {
      inputVideoUrl: String(formData.get('inputVideoUrl') || '').trim(),
      stylePreset: String(formData.get('stylePreset') || '').trim() || undefined,
      prompt: String(formData.get('prompt') || '').trim() || undefined,
      referenceImageUrl: String(formData.get('referenceImageUrl') || '').trim() || undefined,
      outputResolution: String(formData.get('targetResolution') || '').trim() || undefined,
      ...extraJson,
    };

    showMessage(message, 'Creating job...');
    message.style.display = 'block';

    const response = await apiRequest('/v1/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    result.textContent = pretty(response);

    const newJobId = getJobId(response);
    if (newJobId) {
      showMessage(
        message,
        `Job created: ${newJobId}. Open detail page: job.html?jobId=${encodeURIComponent(newJobId)}`
      );
    } else {
      showMessage(message, 'Job created, but no explicit jobId field was found in the response.');
    }
  } catch (error) {
    const friendlyMessage = error.status === 401
      ? 'Please log in first from the Login page, then try creating the job again.'
      : `Create failed: ${error.message}`;
    const details = error.data ? `\n${pretty(error.data)}` : '';
    result.textContent = `Error: ${error.message}${details}`;
    message.style.display = 'block';
    showMessage(message, friendlyMessage, true);
  }
});
