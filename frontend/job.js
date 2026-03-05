import {
  apiRequest,
  getQueryParam,
  setQueryParam,
  setJsonResult,
  showMessage,
} from './app.js';

const jobIdInput = document.getElementById('jobId');
const loadBtn = document.getElementById('loadJob');
const planBtn = document.getElementById('planSegments');
const startBtn = document.getElementById('startJob');
const pollToggle = document.getElementById('pollToggle');
const message = document.getElementById('jobMessage');
const output = document.getElementById('jobResult');

let pollTimer = null;

function currentJobId() {
  return jobIdInput.value.trim();
}

function requireJobId() {
  const jobId = currentJobId();
  if (!jobId) {
    throw new Error('jobId is required.');
  }
  return jobId;
}

async function fetchJob() {
  const jobId = requireJobId();
  setQueryParam('jobId', jobId);

  showMessage(message, `Loading job ${jobId}...`);
  message.style.display = 'block';

  const response = await apiRequest(`/v1/jobs/${encodeURIComponent(jobId)}`);
  setJsonResult(output, response);
  showMessage(message, `Job ${jobId} loaded.`);
}

async function planSegments() {
  const jobId = requireJobId();

  showMessage(message, `Planning segments for ${jobId}...`);
  message.style.display = 'block';

  const response = await apiRequest(`/v1/jobs/${encodeURIComponent(jobId)}/plan-segments`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  setJsonResult(output, response);
  showMessage(message, `Segments planned for ${jobId}.`);
}

async function startJob() {
  const jobId = requireJobId();

  showMessage(message, `Starting ${jobId}...`);
  message.style.display = 'block';

  const response = await apiRequest(`/v1/jobs/${encodeURIComponent(jobId)}/start`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  setJsonResult(output, response);
  showMessage(message, `Start requested for ${jobId}.`);
}

async function handleAction(action) {
  try {
    await action();
  } catch (error) {
    showMessage(message, `Request failed: ${error.message}`, true);
    message.style.display = 'block';
  }
}

function applyPolling(enabled) {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  if (!enabled) {
    return;
  }

  pollTimer = setInterval(() => {
    handleAction(fetchJob);
  }, 5000);
}

loadBtn.addEventListener('click', () => handleAction(fetchJob));
planBtn.addEventListener('click', () => handleAction(planSegments));
startBtn.addEventListener('click', () => handleAction(startJob));
pollToggle.addEventListener('change', () => applyPolling(pollToggle.checked));

const initialJobId = getQueryParam('jobId');
if (initialJobId) {
  jobIdInput.value = initialJobId;
  handleAction(fetchJob);
}
