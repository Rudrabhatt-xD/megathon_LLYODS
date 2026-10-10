import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import http from 'http';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const STREAMLIT_PORT = 8501;

// Spawn Streamlit process
const streamlit = spawn('python3', [
  '-m', 'streamlit', 'run', 'app/Home.py',
  '--server.port', `${STREAMLIT_PORT}`,
  '--server.address', '0.0.0.0',
  '--server.headless', 'true',
  '--browser.gatherUsageStats', 'false',
  '--server.enableCORS', 'false',
  '--server.enableXsrfProtection', 'false'
], {
  cwd: process.cwd(),
  stdio: 'inherit'
});

streamlit.on('error', (err) => {
  console.error('Failed to start Streamlit process:', err);
});

// Create Proxy to Streamlit
const streamlitProxy = createProxyMiddleware({
  target: `http://127.0.0.1:${STREAMLIT_PORT}`,
  changeOrigin: true,
  ws: true
});

app.use('/', streamlitProxy);

const server = http.createServer(app);

// Handle websocket upgrades for Streamlit
server.on('upgrade', (req, socket, head) => {
  if (streamlitProxy.upgrade) {
    streamlitProxy.upgrade(req, socket as any, head);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}, proxying to Streamlit on ${STREAMLIT_PORT}`);
});

process.on('SIGINT', () => {
  streamlit.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  streamlit.kill();
  process.exit();
});
