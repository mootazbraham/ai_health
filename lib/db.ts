import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

// Database file path
const dbPath = path.join(process.cwd(), "data", "healthai.db")
const dbDir = path.dirname(dbPath)

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Initialize database connection
const db = new Database(dbPath)

// Enable foreign keys and WAL mode for better performance
db.pragma("foreign_keys = ON")
db.pragma("journal_mode = WAL")

// Initialize schema
export function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Health metrics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS health_metrics (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Meal logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS meal_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      meal_name TEXT,
      calories REAL,
      protein REAL,
      carbs REAL,
      fat REAL,
      fiber REAL,
      image_url TEXT,
      image_path TEXT,
      ai_analysis TEXT,
      classification TEXT,
      assessment TEXT,
      recommendation TEXT,
      logged_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // AI coaching history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coaching_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_message TEXT NOT NULL,
      coach_response TEXT NOT NULL,
      user_health_data TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date 
    ON health_metrics(user_id, recorded_at);
    
    CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date 
    ON meal_logs(user_id, logged_at);
    
    CREATE INDEX IF NOT EXISTS idx_coaching_history_user_date 
    ON coaching_history(user_id, created_at);
  `)

  console.log("[Database] Schema initialized successfully")
}

// Initialize on import
initDatabase()

// Database query helpers
export const dbQueries = {
  // User operations
  createUser: db.prepare(`
    INSERT INTO users (id, email, password_hash, name)
    VALUES (?, ?, ?, ?)
  `),

  getUserByEmail: db.prepare(`
    SELECT * FROM users WHERE email = ?
  `),

  getUserById: db.prepare(`
    SELECT id, email, name, created_at FROM users WHERE id = ?
  `),

  // Health metrics operations
  insertMetric: db.prepare(`
    INSERT INTO health_metrics (id, user_id, type, value, unit, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `),

  getMetricsByUser: db.prepare(`
    SELECT * FROM health_metrics 
    WHERE user_id = ? 
    ORDER BY recorded_at DESC
    LIMIT ?
  `),

  getMetricsByUserAndType: db.prepare(`
    SELECT * FROM health_metrics 
    WHERE user_id = ? AND type = ?
    ORDER BY recorded_at DESC
    LIMIT ?
  `),

  getMetricsByDateRange: db.prepare(`
    SELECT * FROM health_metrics 
    WHERE user_id = ? 
    AND date(recorded_at) BETWEEN date(?) AND date(?)
    ORDER BY recorded_at DESC
  `),

  // Meal operations
  insertMeal: db.prepare(`
    INSERT INTO meal_logs (
      id, user_id, meal_name, calories, protein, carbs, fat, fiber,
      image_url, image_path, ai_analysis, classification, assessment, recommendation
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  getMealsByUser: db.prepare(`
    SELECT * FROM meal_logs 
    WHERE user_id = ?
    ORDER BY logged_at DESC
    LIMIT ?
  `),

  getMealById: db.prepare(`
    SELECT * FROM meal_logs WHERE id = ? AND user_id = ?
  `),

  deleteMeal: db.prepare(`
    DELETE FROM meal_logs WHERE id = ? AND user_id = ?
  `),

  // Coaching history operations
  insertCoachingSession: db.prepare(`
    INSERT INTO coaching_history (id, user_id, user_message, coach_response, user_health_data)
    VALUES (?, ?, ?, ?, ?)
  `),

  getCoachingHistory: db.prepare(`
    SELECT * FROM coaching_history 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `),
}

// Transaction helper
export function transaction<T>(fn: () => T): T {
  return db.transaction(fn)()
}

export default db


