import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { initDatabase } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Initialize TiDB connection and tables
    await initDatabase();

    // 2. Start Express Server
    app.listen(PORT, () => {
      console.log(`[Rinvox Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Rinvox Backend] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
