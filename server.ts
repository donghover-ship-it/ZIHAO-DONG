/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Ensure data directories exist
const dataDir = path.join(__dirname, 'src/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const historyDir = path.join(__dirname, 'src/data/history');
if (!fs.existsSync(historyDir)) {
  fs.mkdirSync(historyDir, { recursive: true });
}

// Initialize SQLite database
const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS image_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    styles TEXT,
    colors TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const upload = multer({ dest: 'src/data/' });

async function startServer() {
  const app = express();
  
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  
  // Serve history images statically
  app.use('/history', express.static(historyDir));

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/upload', upload.single('file'), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ 
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path
    });
  });

  // History API
  app.get('/api/history', (req, res) => {
    console.log('GET /api/history called');
    try {
      const stmt = db.prepare('SELECT * FROM image_history ORDER BY created_at DESC');
      const rows = stmt.all();
      res.json(rows.map((row: any) => ({
        id: row.id,
        url: `/history/${row.filename}`,
        styles: row.styles ? JSON.parse(row.styles) : [],
        colors: row.colors ? JSON.parse(row.colors) : []
      })));
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  app.post('/api/history', (req, res) => {
    console.log('POST /api/history called');
    try {
      const { imageBase64, styles, colors } = req.body;
      
      if (!imageBase64) {
        console.log('POST /api/history: imageBase64 is required');
        return res.status(400).json({ error: 'imageBase64 is required' });
      }
      
      // Extract base64 data
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        console.log('POST /api/history: Invalid base64 string');
        return res.status(400).json({ error: 'Invalid base64 string' });
      }
      
      const ext = matches[1].split('/')[1] || 'jpeg';
      const buffer = Buffer.from(matches[2], 'base64');
      const filename = `history_${Date.now()}.${ext}`;
      const filepath = path.join(historyDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      
      const stmt = db.prepare('INSERT INTO image_history (filename, styles, colors) VALUES (?, ?, ?)');
      const info = stmt.run(filename, JSON.stringify(styles || []), JSON.stringify(colors || []));
      
      console.log('POST /api/history: Success', info.lastInsertRowid);
      res.json({
        id: info.lastInsertRowid,
        url: `/history/${filename}`,
        styles: styles || [],
        colors: colors || []
      });
    } catch (error) {
      console.error('Error saving history:', error);
      res.status(500).json({ error: 'Failed to save history' });
    }
  });

  app.delete('/api/history/:id', (req, res) => {
    try {
      const id = req.params.id;
      const stmt = db.prepare('SELECT filename FROM image_history WHERE id = ?');
      const row = stmt.get(id) as any;
      
      if (row) {
        const filepath = path.join(historyDir, row.filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        const deleteStmt = db.prepare('DELETE FROM image_history WHERE id = ?');
        deleteStmt.run(id);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting history:', error);
      res.status(500).json({ error: 'Failed to delete history' });
    }
  });

  app.post('/api/design/save', (req, res) => {
    const { module, data } = req.body;
    console.log(`Saving design data for module: ${module}`);
    // In a real app, save to database (e.g. SQLite or Firestore)
    res.json({ status: 'success', message: `Data for ${module} saved` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
