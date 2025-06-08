const { ipcRenderer } = require('electron');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const channelInput = document.getElementById('channel');
const parentInput = document.getElementById('parent');
const statusDiv = document.getElementById('status');
const viewerList = document.getElementById('viewerList');
const totalViewersEl = document.getElementById('totalViewers');
const activeViewersEl = document.getElementById('activeViewers');
const errorViewersEl = document.getElementById('errorViewers');

let viewerStats = {
  total: 0,
  active: 0,
  errors: 0
};

function updateStats() {
  totalViewersEl.textContent = viewerStats.total;
  activeViewersEl.textContent = viewerStats.active;
  errorViewersEl.textContent = viewerStats.errors;
}

function addStatusMessage(message, isError = false) {
  const div = document.createElement('div');
  div.className = `status-item ${isError ? 'error' : 'success'}`;
  div.textContent = message;
  statusDiv.appendChild(div);
  statusDiv.scrollTop = statusDiv.scrollHeight;
}

function updateViewerStatus(index, proxy, status, error = null) {
  let viewerItem = document.getElementById(`viewer-${index}`);
  if (!viewerItem) {
    viewerItem = document.createElement('div');
    viewerItem.id = `viewer-${index}`;
    viewerItem.className = 'viewer-item';
    viewerList.appendChild(viewerItem);
  }

  const statusDot = document.createElement('div');
  statusDot.className = 'viewer-status';
  
  if (status === 'Running') {
    statusDot.classList.add('running');
    viewerStats.active++;
  } else if (status === 'Error') {
    statusDot.classList.add('error');
    viewerStats.errors++;
  } else if (status === 'Disconnected') {
    statusDot.classList.add('disconnected');
    viewerStats.active--;
  }

  const proxyText = document.createElement('span');
  proxyText.textContent = proxy.split('@')[1];

  const statusText = document.createElement('span');
  statusText.textContent = error ? `Error: ${error}` : status;

  viewerItem.innerHTML = '';
  viewerItem.appendChild(statusDot);
  viewerItem.appendChild(proxyText);
  viewerItem.appendChild(statusText);

  updateStats();
}

async function fetchParentDomain() {
  try {
    const response = await fetch('/api/parent-domain');
    const data = await response.json();
    if (data.success) {
      parentInput.value = data.data.parentDomain;
    }
  } catch (error) {
    console.error('Error fetching parent domain:', error);
  }
}

fetchParentDomain();

function addStatus(message, type = 'info') {
  const div = document.createElement('div');
  div.className = `status-item ${type}`;
  div.textContent = message;
  statusDiv.insertBefore(div, statusDiv.firstChild);
}

function updateViewerList(viewers) {
  viewerList.innerHTML = '';
  viewers.forEach(viewer => {
    const div = document.createElement('div');
    div.className = 'viewer-item';
    div.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div class="viewer-status ${viewer.status}"></div>
        <span>Viewer ${viewer.id}</span>
      </div>
      <span>${viewer.status}</span>
    `;
    viewerList.appendChild(div);
  });
}

async function startViewers() {
  const channel = channelInput.value.trim();
  const parent = parentInput.value.trim();
  const viewers = 5; // Default to 5 viewers for testing

  if (!channel) {
    addStatus('Please enter a channel name', 'error');
    return;
  }

  try {
    startBtn.disabled = true;
    addStatus('Starting viewers...');

    const response = await fetch('/api/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, viewers, parent })
    });

    const data = await response.json();
    if (data.success) {
      addStatus('Viewers started successfully', 'success');
      stopBtn.disabled = false;
      updateStats(data.data);
      updateViewerList(data.data.viewers);
    } else {
      addStatus(data.error || 'Failed to start viewers', 'error');
      startBtn.disabled = false;
    }
  } catch (error) {
    addStatus('Error starting viewers: ' + error.message, 'error');
    startBtn.disabled = false;
  }
}

async function stopViewers() {
  try {
    stopBtn.disabled = true;
    addStatus('Stopping viewers...');

    const response = await fetch('/api/stop', {
      method: 'POST'
    });

    const data = await response.json();
    if (data.success) {
      addStatus('Viewers stopped successfully', 'success');
      startBtn.disabled = false;
      updateStats(data.data);
      updateViewerList(data.data.viewers);
    } else {
      addStatus(data.error || 'Failed to stop viewers', 'error');
      stopBtn.disabled = false;
    }
  } catch (error) {
    addStatus('Error stopping viewers: ' + error.message, 'error');
    stopBtn.disabled = false;
  }
}

function updateStats(data) {
  totalViewersEl.textContent = data.total;
  activeViewersEl.textContent = data.active;
  errorViewersEl.textContent = data.errors;
}

async function pollStatus() {
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    if (data.success) {
      updateStats(data.data);
      updateViewerList(data.data.viewers);
    }
  } catch (error) {
    console.error('Error polling status:', error);
  }
}

startBtn.addEventListener('click', startViewers);
stopBtn.addEventListener('click', stopViewers);

setInterval(pollStatus, 5000); 