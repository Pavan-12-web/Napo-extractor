/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { fetchShareLink } from './src/server/fetchShare';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'Napo extractor' });
  });

  // Share link fetch proxy endpoint
  app.post('/api/fetch-share', async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: 'URL parameter is required.' });
      return;
    }

    try {
      const result = await fetchShareLink(url);
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Internal server error';
      res.status(500).json({ success: false, error: msg });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath);

  if (isProduction && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Mount Vite dev server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Napo Extractor server running on http://0.0.0.0:${PORT} (${isProduction && hasDist ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
