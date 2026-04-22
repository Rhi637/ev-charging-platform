import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '../../data/ev_charging.db'));

// 启用 WAL 模式以提升性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
