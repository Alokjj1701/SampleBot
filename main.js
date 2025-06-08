const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const proxyList = require('./proxyList');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

let mainWindow;
let activeBrowsers = new Map();

// Glitch specific configuration
const isGlitch = process.env.PROJECT_DOMAIN !== undefined;
const PORT = process.env.PORT || 3000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // In Glitch, we need to use the full URL
  if (isGlitch) {
    mainWindow.loadURL(`https://${process.env.PROJECT_DOMAIN}.glitch.me`);
  } else {
    mainWindow.loadFile('index.html');
  }
}

app.whenReady().then(createWindow);

// Test proxy connection
async function testProxy(proxy) {
  try {
    const proxyUrl = new URL(proxy);
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        `--proxy-server=${proxyUrl.hostname}:${proxyUrl.port}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-accelerated-2d-canvas',
        '--disable-infobars',
        '--disable-notifications',
        '--mute-audio'
      ]
    });

    const page = await browser.newPage();
    
    if (proxyUrl.username && proxyUrl.password) {
      await page.authenticate({
        username: proxyUrl.username,
        password: proxyUrl.password
      });
    }

    await page.goto('https://www.google.com', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await browser.close();
    return true;
  } catch (error) {
    console.error(`Proxy test failed for ${proxy}:`, error.message);
    return false;
  }
}

ipcMain.on('start-viewers', async (event, { channel, parent }) => {
  await stopAllBrowsers();
  
  event.reply('viewer-status', { status: 'Testing proxies...' });
  
  const workingProxies = [];
  for (let i = 0; i < proxyList.length; i++) {
    const proxy = proxyList[i];
    event.reply('viewer-status', {
      index: i,
      proxy,
      status: 'Testing proxy...'
    });

    const isWorking = await testProxy(proxy);
    if (isWorking) {
      workingProxies.push(proxy);
      event.reply('viewer-status', {
        index: i,
        proxy,
        status: 'Proxy working'
      });
    } else {
      event.reply('viewer-status', {
        index: i,
        proxy,
        status: 'Error',
        error: 'Proxy test failed'
      });
    }
  }

  if (workingProxies.length === 0) {
    event.reply('viewer-status', {
      status: 'Error',
      error: 'No working proxies found'
    });
    return;
  }

  for (let i = 0; i < workingProxies.length; i++) {
    const proxy = workingProxies[i];
    launchViewer(i, proxy, channel, isGlitch ? process.env.PROJECT_DOMAIN : parent, event);
  }
  
  event.reply('all-viewers-started');
});

ipcMain.on('stop-viewers', async (event) => {
  await stopAllBrowsers();
  event.reply('all-viewers-stopped');
});

async function stopAllBrowsers() {
  for (const [index, browser] of activeBrowsers.entries()) {
    try {
      await browser.close();
      mainWindow.webContents.send('viewer-status', {
        index,
        proxy: proxyList[index],
        status: 'Stopped'
      });
    } catch (error) {
      console.error(`Error closing browser ${index}:`, error);
    }
  }
  activeBrowsers.clear();
}

async function reconnectViewer(index, proxy, channel, parent, event) {
  try {
    const proxyUrl = new URL(proxy);
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        `--proxy-server=${proxyUrl.hostname}:${proxyUrl.port}`,
        '--window-size=1280,720',
        '--mute-audio',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-infobars',
        '--disable-notifications',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--allow-insecure-localhost'
      ]
    });

    activeBrowsers.set(index, browser);

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });

    if (proxyUrl.username && proxyUrl.password) {
      await page.authenticate({
        username: proxyUrl.username,
        password: proxyUrl.password
      });
    }

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto('https://www.google.com', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.goto(`https://player.twitch.tv/?channel=${channel}&parent=${parent}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.waitForSelector('button[data-a-target="player-play-pause-button"]', {
      visible: true,
      timeout: 15000
    });
    await page.click('button[data-a-target="player-play-pause-button"]');

    event.reply('viewer-status', {
      index,
      proxy,
      status: 'Running'
    });

    browser.on('disconnected', async () => {
      activeBrowsers.delete(index);
      event.reply('viewer-status', {
        index,
        proxy,
        status: 'Disconnected'
      });
      
      setTimeout(() => {
        reconnectViewer(index, proxy, channel, parent, event);
      }, 5000);
    });

  } catch (error) {
    event.reply('viewer-status', {
      index,
      proxy,
      status: 'Error',
      error: error.message
    });
    
    setTimeout(() => {
      reconnectViewer(index, proxy, channel, parent, event);
    }, 5000);
  }
}

async function launchViewer(index, proxy, channel, parent, event) {
  await reconnectViewer(index, proxy, channel, parent, event);
}

app.on('window-all-closed', async () => {
  await stopAllBrowsers();
  app.quit();
});

let viewerStats = {
  total: 0,
  active: 0,
  errors: 0,
  viewers: []
};

function getViewerStats() {
  return {
    ...viewerStats,
    viewers: viewerStats.viewers.map(v => ({
      id: v.id,
      status: v.status,
      proxy: v.proxy
    }))
  };
}

async function launchViewer(channel, numViewers, proxies = []) {
  if (!channel || !numViewers) {
    throw new Error('Channel and number of viewers are required');
  }

  // Reset stats
  viewerStats = {
    total: numViewers,
    active: 0,
    errors: 0,
    viewers: []
  };

  // Launch viewers
  for (let i = 0; i < numViewers; i++) {
    const proxy = proxies[i % proxies.length];
    const viewer = {
      id: i + 1,
      status: 'connecting',
      proxy: proxy
    };
    viewerStats.viewers.push(viewer);
    
    try {
      await launchViewer(channel, proxy);
      viewer.status = 'active';
      viewerStats.active++;
    } catch (error) {
      viewer.status = 'error';
      viewerStats.errors++;
      console.error(`Viewer ${i + 1} failed to connect:`, error);
    }
  }

  return getViewerStats();
}

// Export the necessary functions
module.exports = {
  launchViewer,
  stopViewers,
  getViewerStats
}; 