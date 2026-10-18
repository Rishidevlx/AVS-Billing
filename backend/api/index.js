import app from '../src/app.js';
import { initDatabase } from '../src/config/db.js';

let isDbInitialized = false;

export default async function handler(req, res) {
  if (!isDbInitialized) {
    try {
      await initDatabase();
      isDbInitialized = true;
    } catch (err) {
      console.error('[Vercel Serverless DB Init Error]:', err.message);
    }
  }
  return app(req, res);
}
