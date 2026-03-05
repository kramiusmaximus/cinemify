const DEFAULT_API_BASE = 'http://localhost:3001';

export function getApiBase() {
  return localStorage.getItem('cinemify_api_base') || DEFAULT_API_BASE;
}

export function setApiBase(baseUrl) {
  localStorage.setItem('cinemify_api_base', baseUrl.trim() || DEFAULT_API_BASE);
}

export function setupBaseUrlInput(inputId, buttonId, messageId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);
  const message = document.getElementById(messageId);

  if (!input || !button) {
    return;
  }

  input.value = getApiBase();

  button.addEventListener('click', () => {
    setApiBase(input.value);
    if (message) {
      showMessage(message, `API base saved: ${getApiBase()}`);
    }
  });
}

export async function apiRequest(path, options = {}) {
  const url = `${getApiBase()}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let parsed = null;

  try {
    parsed = text ? JSON.parse(text) : null;
  } catch (_error) {
    parsed = { raw: text };
  }

  if (!response.ok) {
    const err = new Error(`HTTP ${response.status} ${response.statusText}`);
    err.status = response.status;
    err.data = parsed;
    throw err;
  }

  return parsed;
}

export function pretty(value) {
  return JSON.stringify(value, null, 2);
}

export function extractJobs(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.jobs)) {
    return payload.jobs;
  }

  if (payload && Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
}

export function getJobId(job) {
  if (!job || typeof job !== 'object') {
    return '';
  }

  return (
    job.jobId ||
    job.id ||
    job.job_id ||
    job.uuid ||
    ''
  );
}

export function getJobStatus(job) {
  if (!job || typeof job !== 'object') {
    return 'unknown';
  }

  return job.status || job.state || 'unknown';
}

export function showMessage(target, text, isError = false) {
  if (!target) {
    return;
  }

  target.textContent = text;
  target.className = isError ? 'status-box error' : 'status-box';
}

export function setJsonResult(target, payload) {
  if (!target) {
    return;
  }

  target.textContent = pretty(payload);
}

export function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

export function setQueryParam(name, value) {
  const url = new URL(window.location.href);

  if (value) {
    url.searchParams.set(name, value);
  } else {
    url.searchParams.delete(name);
  }

  window.history.replaceState({}, '', url);
}
