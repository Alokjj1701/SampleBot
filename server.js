const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to start viewer bot
app.post('/api/start', async (req, res) => {
  try {
    const { channel, viewers, proxies } = req.body;
    if (!channel || !viewers) {
      return res.status(400).json({ 
        success: false, 
        error: 'Channel and number of viewers are required' 
      });
    }
    
    // Import the viewer bot functionality
    const { launchViewer } = require('./main');
    const result = await launchViewer(channel, viewers, proxies);
    res.json({ 
      success: true, 
      message: 'Viewer bot started successfully',
      data: result 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to stop viewer bot
app.post('/api/stop', (req, res) => {
  try {
    // Import the stop functionality
    const { stopViewers } = require('./main');
    stopViewers();
    res.json({ success: true, message: 'Viewer bot stopped successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to get status
app.get('/api/status', (req, res) => {
  try {
    const { getViewerStats } = require('./main');
    const stats = getViewerStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
const listener = app.listen(port, () => {
  const glitchUrl = process.env.PROJECT_DOMAIN 
    ? `https://${process.env.PROJECT_DOMAIN}.glitch.me`
    : `http://localhost:${port}`;
    
  console.log(`Server is running on port ${port}`);
  console.log(`Web interface available at ${glitchUrl}`);
}); 