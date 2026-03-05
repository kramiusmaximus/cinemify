import { apiRequest, extractJobs, getJobId, getJobStatus, showMessage } from './app.js';

const refreshButton = document.getElementById('refreshJobs');
const tableBody = document.querySelector('#jobsTable tbody');
const message = document.getElementById('jobsMessage');

function clearRows() {
  tableBody.innerHTML = '';
}

function appendEmptyRow(text) {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = 5;
  cell.textContent = text;
  row.appendChild(cell);
  tableBody.appendChild(row);
}

function renderRows(jobs) {
  clearRows();

  if (!jobs.length) {
    appendEmptyRow('No jobs returned by backend.');
    return;
  }

  for (const job of jobs) {
    const jobId = getJobId(job) || '(missing id)';
    const status = getJobStatus(job);
    const createdAt = job.createdAt || job.created_at || '-';
    const updatedAt = job.updatedAt || job.updated_at || '-';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(jobId)}</td>
      <td>${escapeHtml(status)}</td>
      <td>${escapeHtml(createdAt)}</td>
      <td>${escapeHtml(updatedAt)}</td>
      <td><a href="./job.html?jobId=${encodeURIComponent(jobId)}">Open</a></td>
    `;

    tableBody.appendChild(row);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function loadJobs() {
  try {
    message.style.display = 'block';
    showMessage(message, 'Loading jobs...');

    const response = await apiRequest('/v1/jobs');
    const jobs = extractJobs(response);
    renderRows(jobs);

    showMessage(message, `Loaded ${jobs.length} job(s).`);
  } catch (error) {
    clearRows();
    appendEmptyRow(`Failed to load jobs: ${error.message}`);
    message.style.display = 'block';
    showMessage(message, `Load failed: ${error.message}`, true);
  }
}

refreshButton.addEventListener('click', loadJobs);
loadJobs();
