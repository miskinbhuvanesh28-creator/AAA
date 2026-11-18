import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { KNOWLEDGE_ARTICLES } from '../src/engine/knowledge.ts';

export type UserRole = 'user' | 'astrologer' | 'admin';

export interface DbUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  planId: string;
  passwordHash: string;
  createdAt: string;
}

function hashPasswordSync(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function createDatabase(dbPath?: string): DatabaseSync {
  const target = dbPath || process.env.ASTRO_DB_PATH || path.resolve(process.cwd(), 'data', 'astrojyotish.db');
  if (target !== ':memory:') {
    fs.mkdirSync(path.dirname(target), { recursive: true });
  }
  const db = new DatabaseSync(target);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      daily_ai_limit INTEGER NOT NULL,
      max_profiles INTEGER NOT NULL,
      max_reports INTEGER NOT NULL,
      price_monthly_inr INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      plan_id TEXT NOT NULL DEFAULT 'pro',
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS birth_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'male',
      y INTEGER NOT NULL,
      m INTEGER NOT NULL,
      d INTEGER NOT NULL,
      hh INTEGER NOT NULL,
      mi INTEGER NOT NULL,
      ss INTEGER NOT NULL DEFAULT 0,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      tz REAL NOT NULL,
      ay INTEGER NOT NULL DEFAULT 1,
      place TEXT NOT NULL,
      timezone_id TEXT,
      birth_time_known INTEGER NOT NULL DEFAULT 1,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      tags_json TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS calc_settings (
      user_id TEXT PRIMARY KEY,
      lang TEXT NOT NULL DEFAULT 'te',
      theme TEXT NOT NULL DEFAULT 'light',
      chart_style TEXT NOT NULL DEFAULT 'south',
      ay INTEGER NOT NULL DEFAULT 1,
      sidereal INTEGER NOT NULL DEFAULT 1,
      house_system TEXT NOT NULL DEFAULT 'placidus',
      node_type TEXT NOT NULL DEFAULT 'mean',
      kp_mode TEXT NOT NULL DEFAULT 'new',
      karaka_mode TEXT NOT NULL DEFAULT '7',
      calendar_system TEXT NOT NULL DEFAULT 'amanta',
      sidebar_collapsed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS life_events (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      event_date TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES birth_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      report_type TEXT NOT NULL,
      title TEXT NOT NULL,
      depth TEXT NOT NULL DEFAULT 'detailed',
      language TEXT NOT NULL DEFAULT 'te',
      content_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS report_versions (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      version_num INTEGER NOT NULL,
      content_json TEXT NOT NULL,
      edited_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      profile_id TEXT,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      model TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS knowledge_articles (
      id TEXT PRIMARY KEY,
      cat TEXT NOT NULL,
      cat_en TEXT NOT NULL,
      title TEXT NOT NULL,
      title_en TEXT NOT NULL,
      sub TEXT NOT NULL,
      sub_en TEXT NOT NULL,
      src TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      body TEXT NOT NULL,
      body_en TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      title TEXT NOT NULL,
      meta TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      UNIQUE(user_id, item_type, item_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS usage_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      usage_date TEXT NOT NULL,
      ai_calls INTEGER NOT NULL DEFAULT 0,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      reports_generated INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, usage_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workflow_progress (
      profile_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      step_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      updated_at TEXT NOT NULL,
      PRIMARY KEY (profile_id, user_id, step_id)
    );

    CREATE TABLE IF NOT EXISTS mantra_japa_logs (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      planet_id INTEGER,
      mantra_key TEXT NOT NULL,
      title TEXT NOT NULL,
      daily_target INTEGER NOT NULL DEFAULT 108,
      completed_count INTEGER NOT NULL DEFAULT 0,
      malas_completed INTEGER NOT NULL DEFAULT 0,
      start_date TEXT,
      completed_date TEXT,
      notes TEXT NOT NULL DEFAULT '',
      history_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification_records (
      profile_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      birth_time_status TEXT NOT NULL DEFAULT 'Needs Review',
      chart_accuracy_status TEXT NOT NULL DEFAULT 'Verified Ephemeris',
      items_json TEXT NOT NULL DEFAULT '[]',
      timeline_json TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      next_review_date TEXT,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (profile_id, user_id)
    );
  `);

  seedInitialData(db);
  return db;
}

function seedInitialData(db: DatabaseSync) {
  const now = new Date().toISOString();

  // 1. Subscription Plans
  const insertPlan = db.prepare(`
    INSERT OR IGNORE INTO subscription_plans (id, name, description, daily_ai_limit, max_profiles, max_reports, price_monthly_inr)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertPlan.run('seeker', 'Seeker', 'Personal charts, Panchanga, and essential consultations', 15, 10, 20, 0);
  insertPlan.run('pro', 'Jyotishi Pro', 'Full Parashari, KP, Jaimini, 23 Vargas & professional reports', 100, 250, 500, 999);
  insertPlan.run('enterprise', 'Sangha Enterprise', 'Unlimited client horoscopes, studio reporting & team administration', 1000, 5000, 5000, 3499);

  // 2. Demo Admin / Primary Workspace User + Demo User
  const existingAdmin = db.prepare('SELECT id FROM users WHERE id = ?').get('demo-admin') as { id: string } | undefined;
  if (!existingAdmin) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, name, role, plan_id, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run('demo-admin', 'admin@astrojyotish.pro', 'Acharya Vashishta (Admin)', 'admin', 'enterprise', hashPasswordSync('AstroPro@2026'), now);
    insertUser.run('demo-user', 'seeker@astrojyotish.pro', 'Surya Narayana', 'user', 'pro', hashPasswordSync('Seeker@2026'), now);

    const insertSettings = db.prepare(`
      INSERT OR IGNORE INTO calc_settings (user_id, lang, theme, chart_style, ay, sidereal, house_system, node_type, kp_mode, karaka_mode, calendar_system, sidebar_collapsed, updated_at)
      VALUES (?, 'te', 'light', 'south', 1, 1, 'placidus', 'mean', 'new', '7', 'amanta', 0, ?)
    `);
    insertSettings.run('demo-admin', now);
    insertSettings.run('demo-user', now);
  }

  // 3. Seed realistic Birth Profiles if none exist for demo-admin
  const profCount = db.prepare('SELECT COUNT(*) as cnt FROM birth_profiles WHERE user_id = ?').get('demo-admin') as { cnt: number };
  if (profCount.cnt === 0) {
    const insertProf = db.prepare(`
      INSERT INTO birth_profiles (
        id, user_id, name, gender, y, m, d, hh, mi, ss, lat, lon, tz, ay, place, timezone_id,
        birth_time_known, is_default, is_archived, tags_json, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertProf.run(
      'prof-rama', 'demo-admin', 'Sri Rama Rao', 'male',
      1990, 5, 14, 6, 42, 0, 17.385, 78.4867, 5.5, 1, 'Hyderabad, Telangana', 'Asia/Kolkata',
      1, 1, 0, JSON.stringify(['primary', 'vedic']), 'Reference sample chart for Parashari, KP & Jaimini analysis.', now, now,
    );
    insertProf.run(
      'prof-lakshmi', 'demo-admin', 'Lakshmi Devi', 'female',
      1993, 8, 22, 14, 15, 0, 16.5062, 80.648, 5.5, 1, 'Vijayawada, Andhra Pradesh', 'Asia/Kolkata',
      1, 0, 0, JSON.stringify(['matchmaking', 'sample']), 'Comparison sample profile for Ashtakoota & Synastry.', now, now,
    );
    insertProf.run(
      'prof-arjun', 'demo-admin', 'Arjun Sharma', 'male',
      1988, 11, 3, 21, 30, 0, 28.6139, 77.209, 5.5, 1, 'New Delhi, India', 'Asia/Kolkata',
      1, 0, 0, JSON.stringify(['career', 'dasha']), 'Evening Lagna sample profile for Dashamsha and Varshaphala.', now, now,
    );

    const insertEvent = db.prepare(`
      INSERT INTO life_events (id, profile_id, user_id, title, category, event_date, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertEvent.run('evt-1', 'prof-rama', 'demo-admin', 'Engineering Graduation', 'education', '2012-05-18', 'Completed university degree', now);
    insertEvent.run('evt-2', 'prof-rama', 'demo-admin', 'First Career Appointment', 'career', '2013-07-08', 'Joined software engineering role', now);
    insertEvent.run('evt-3', 'prof-rama', 'demo-admin', 'Marriage Ceremony', 'marriage', '2018-11-24', 'Traditional wedding in Hyderabad', now);
  }

  // 4. Sync Knowledge Articles
  const artCount = db.prepare('SELECT COUNT(*) as cnt FROM knowledge_articles').get() as { cnt: number };
  if (artCount.cnt === 0) {
    const insertArt = db.prepare(`
      INSERT OR IGNORE INTO knowledge_articles (id, cat, cat_en, title, title_en, sub, sub_en, src, tags_json, body, body_en, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const a of KNOWLEDGE_ARTICLES) {
      insertArt.run(
        String(a.id || ''),
        String(a.cat || ''),
        String(a.catEn || a.cat || ''),
        String(a.title || ''),
        String(a.titleEn || a.title || ''),
        String(a.sub || ''),
        String(a.subEn || a.sub || ''),
        String(a.src || ''),
        JSON.stringify(a.tags || []),
        String(a.body || ''),
        String(a.bodyEn || a.body || ''),
        now,
      );
    }
  }

  // 5. Seed Welcome Notification
  const notifCount = db.prepare('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ?').get('demo-admin') as { cnt: number };
  if (notifCount.cnt === 0) {
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, read, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(
      'notif-welcome',
      'demo-admin',
      'కార్యక్షేత్రం సిద్ధంగా ఉంది',
      '3 నమూనా జన్మ ప్రొఫైల్స్, 23 వర్గ చక్రాలు (D1–D144), KP 1–249 హోరరీ మరియు సమగ్ర నివేదికలు సిద్ధంగా ఉన్నాయి.',
      now,
    );
  }
}

export const db = createDatabase();

export function recordAudit(database: DatabaseSync, userId: string | null, action: string, resource: string, details = '') {
  database.prepare(`
    INSERT INTO audit_logs (id, user_id, action, resource, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), userId, action, resource, details, new Date().toISOString());
}
