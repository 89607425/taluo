import 'dotenv/config';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { app, bootstrap } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');

// Build the frontend before starting the server
console.log('Building frontend...');
execSync('vite build', { stdio: 'inherit' });
console.log('Frontend build complete.');

// Initialise DB / Redis connections
await bootstrap();

// Serve static frontend assets
app.use(express.static(distDir));

// SPA fallback — all non-API routes serve index.html
app.get(/^(?!\/api).*$/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});
