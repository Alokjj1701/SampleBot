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

// Store viewer bot state
let viewerState = {
  isRunning: false,
  total: 0,
  active: 0,
  errors: 0,
  viewers: []
};

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

    // Update viewer state
    viewerState = {
      isRunning: true,
      total: parseInt(viewers),
      active: parseInt(viewers),
      errors: 0,
      viewers: Array(parseInt(viewers)).fill().map((_, i) => ({
        id: i + 1,
        status: 'active',
        error: null
      }))
    };
    
    res.json({ 
      success: true, 
      message: 'Viewer bot started successfully',
      data: viewerState
    });
  } catch (error) {
    console.error('Error starting viewer bot:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to stop viewer bot
app.post('/api/stop', (req, res) => {
  try {
    // Reset viewer state
    viewerState = {
      isRunning: false,
      total: 0,
      active: 0,
      errors: 0,
      viewers: []
    };
    
    res.json({ 
      success: true, 
      message: 'Viewer bot stopped successfully',
      data: viewerState
    });
  } catch (error) {
    console.error('Error stopping viewer bot:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to get status
app.get('/api/status', (req, res) => {
  try {
    res.json({ 
      success: true, 
      data: viewerState
    });
  } catch (error) {
    console.error('Error getting status:', error);
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