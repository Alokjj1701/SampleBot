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

startBtn.addEventListener('click', () => {
  const channel = channelInput.value.trim();
  const parent = parentInput.value.trim();
  if (!channel || !parent) {
    addStatusMessage('Please enter both channel and parent domain.', true);
    return;
  }
  
  startBtn.disabled = true;
  stopBtn.disabled = false;
  statusDiv.innerHTML = '';
  viewerList.innerHTML = '';
  viewerStats = { total: 0, active: 0, errors: 0 };
  updateStats();
  
  addStatusMessage('Launching viewers...');
  ipcRenderer.send('start-viewers', { channel, parent });
});

stopBtn.addEventListener('click', () => {
  ipcRenderer.send('stop-viewers');
  startBtn.disabled = false;
  stopBtn.disabled = true;
  addStatusMessage('Stopping all viewers...');
});

ipcRenderer.on('viewer-status', (event, { index, proxy, status, error }) => {
  if (status === 'Testing proxy...') {
    addStatusMessage(`Testing proxy ${index + 1}...`);
  } else if (status === 'Proxy working') {
    addStatusMessage(`Proxy ${index + 1} is working`);
    viewerStats.total++;
    updateStats();
  } else {
    updateViewerStatus(index, proxy, status, error);
  }
});

ipcRenderer.on('all-viewers-started', () => {
  addStatusMessage('All viewers launched successfully.');
});

ipcRenderer.on('all-viewers-stopped', () => {
  addStatusMessage('All viewers stopped.');
  startBtn.disabled = false;
  stopBtn.disabled = true;
  viewerStats = { total: 0, active: 0, errors: 0 };
  updateStats();
}); 