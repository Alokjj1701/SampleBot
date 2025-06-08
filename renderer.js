// Get DOM elements
const channelInput = document.getElementById('channel');
const parentInput = document.getElementById('parent');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const totalViewersEl = document.getElementById('totalViewers');
const activeViewersEl = document.getElementById('activeViewers');
const errorViewersEl = document.getElementById('errorViewers');
const viewerListEl = document.getElementById('viewerList');
const statusEl = document.getElementById('status');

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
  statusEl.appendChild(div);
  statusEl.scrollTop = statusEl.scrollHeight;
}

function updateViewerStatus(index, proxy, status, error = null) {
  let viewerItem = document.getElementById(`viewer-${index}`);
  if (!viewerItem) {
    viewerItem = document.createElement('div');
    viewerItem.id = `viewer-${index}`;
    viewerItem.className = 'viewer-item';
    viewerListEl.appendChild(viewerItem);
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

// Fetch parent domain from server
async function fetchParentDomain() {
  try {
    const response = await fetch('/api/parent-domain');
    const data = await response.json();
    if (data.success) {
      parentInput.value = data.data.parentDomain;
      console.log('Parent domain set to:', data.data.parentDomain);
    }
  } catch (error) {
    console.error('Error fetching parent domain:', error);
    addStatus('Error fetching parent domain: ' + error.message, 'error');
  }
}

// Add status message
function addStatus(message, type = 'info') {
  const div = document.createElement('div');
  div.className = `status-item ${type}`;
  div.textContent = message;
  statusEl.insertBefore(div, statusEl.firstChild);
  console.log(`[${type}] ${message}`);
}

// Update viewer list
function updateViewerList(viewers) {
  viewerListEl.innerHTML = '';
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
    viewerListEl.appendChild(div);
  });
}

// Start viewer bot
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

// Stop viewer bot
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

// Update stats
function updateStats(data) {
  totalViewersEl.textContent = data.total;
  activeViewersEl.textContent = data.active;
  errorViewersEl.textContent = data.errors;
}

// Poll for status updates
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

// Initialize the application
function init() {
  console.log('Initializing application...');
  fetchParentDomain();
  setInterval(pollStatus, 5000);
}

// Set up event listeners
startBtn.addEventListener('click', startViewers);
stopBtn.addEventListener('click', stopViewers);

// Start the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init); 