# Twitch Viewer Bot

A headless Twitch viewer bot with proxy support, built using Electron and Puppeteer.

## Features

- Multiple concurrent viewers
- Proxy support with automatic testing
- Headless operation
- Real-time viewer status monitoring
- Automatic reconnection for disconnected viewers
- Clean and intuitive GUI

## Prerequisites

- Node.js >= 14.0.0
- npm or yarn
- Valid proxy list (see Configuration section)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/twitch-viewer-bot.git
cd twitch-viewer-bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure your proxies in `proxyList.js`:
```javascript
module.exports = [
    'http://proxy1.example.com:8080',
    'http://proxy2.example.com:8080',
    // Add more proxies...
];
```

## Usage

1. Start the application:
```bash
npm start
```

2. Enter the Twitch channel name and parent URL
3. Click "Start Viewers" to begin
4. Monitor viewer status in real-time
5. Click "Stop Viewers" to stop all viewers

## Configuration

### Proxy Format
Proxies should be in the following format:
- HTTP: `http://hostname:port`
- HTTP with auth: `http://username:password@hostname:port`
- SOCKS: `socks5://hostname:port`

### Environment Variables
- `PORT`: Web server port (default: 3000)
- `PROJECT_DOMAIN`: Glitch project domain (for Glitch deployment)

## Security Note

This tool is for educational purposes only. Please ensure compliance with Twitch's Terms of Service when using this application.

## License

MIT License

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 