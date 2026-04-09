import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import express from 'express';
import { app, bootstrap } from './index';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

// Build the frontend before starting
console.log('Building frontend...');
execSync('npx vite build', { stdio: 'inherit' });
console.log('Frontend build complete.');

// Initialize DB and Redis connections
await bootstrap();

// Serve static frontend assets from dist/
app.use(express.static(distDir));

// SPA fallback — serve index.html for all non-API routes
app.get(/^(?!\/api).*$/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});
