import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { DatabaseSync } from 'node:sqlite';
import {
  attachAuthUser,
  clearSessionCookie,
  hashPassword,
  requireAdmin,
  requireAuth,
  setSessionCookie,
  verifyPassword,
  type AuthedRequest,
} from './server/auth.ts';
import { createDatabase, db as defaultDb, recordAudit, type UserRole } from './server/db.ts';
import { generateAstrologyReply, isGeminiConfigured } from './server/gemini.ts';
import { CITIES } from './src/engine/data/coreData.ts';

dotenv.config();

function estimateTzAndZone(lat: number, lon: number, countryCode?: string, displayName?: string): { tz: number; timezoneId: string } {
  const cc = (countryCode || '').toLowerCase();
  const text = (displayName || '').toLowerCase();
  if (cc === 'in' || text.includes('india')) return { tz: 5.5, timezoneId: 'Asia/Kolkata' };
  if (cc === 'lk' || text.includes('sri lanka')) return { tz: 5.5, timezoneId: 'Asia/Colombo' };
  if (cc === 'np') return { tz: 5.75, timezoneId: 'Asia/Kathmandu' };
  if (cc === 'ae') return { tz: 4, timezoneId: 'Asia/Dubai' };
  if (cc === 'qa' || cc === 'sa') return { tz: 3, timezoneId: 'Asia/Riyadh' };
  if (cc === 'sg') return { tz: 8, timezoneId: 'Asia/Singapore' };
  if (cc === 'my') return { tz: 8, timezoneId: 'Asia/Kuala_Lumpur' };
  if (cc === 'th') return { tz: 7, timezoneId: 'Asia/Bangkok' };
  if (cc === 'jp') return { tz: 9, timezoneId: 'Asia/Tokyo' };
  if (cc === 'gb' || cc === 'uk') return { tz: 0, timezoneId: 'Europe/London' };
  if (cc === 'de' || cc === 'fr' || cc === 'ch') return { tz: 1, timezoneId: 'Europe/Berlin' };
  if (cc === 'au') return { tz: lon > 140 ? 10 : 8, timezoneId: lon > 140 ? 'Australia/Sydney' : 'Australia/Perth' };
  if (cc === 'nz') return { tz: 12, timezoneId: 'Pacific/Auckland' };
  if (cc === 'us' || cc === 'ca') {
    if (lon > -82) return { tz: -5, timezoneId: 'America/New_York' };
    if (lon > -102) return { tz: -6, timezoneId: 'America/Chicago' };
    if (lon > -115) return { tz: -7, timezoneId: 'America/Denver' };
    return { tz: -8, timezoneId: 'America/Los_Angeles' };
  }
  const approxTz = Math.round((lon / 15) * 2) / 2;
  return { tz: approxTz, timezoneId: `UTC${approxTz >= 0 ? '+' : ''}${approxTz}` };
}

export function createApp(database: DatabaseSync = defaultDb) {
  const app = express();
  app.use(express.json({ limit: '4mb' }));
  app.use(attachAuthUser(database));

  // ---- Health ----
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'astrojyotish-pro',
      timestamp: new Date().toISOString(),
      geminiConfigured: isGeminiConfigured(),
      sqlite: 'node:sqlite',
    });
  });

  // ---- Auth ----
  app.get('/api/auth/me', (req: AuthedRequest, res) => {
    const user = req.authUser || null;
    if (!user) {
      res.json({ user: null, settings: null });
      return;
    }
    const settings = database.prepare('SELECT * FROM calc_settings WHERE user_id = ?').get(user.id);
    res.json({ user, settings });
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, name, password } = req.body as { email?: string; name?: string; password?: string };
    if (!email || !name || !password || password.length < 6) {
      res.status(400).json({ error: 'Name, valid email, and password (6+ chars) are required.' });
      return;
    }
    const normEmail = email.trim().toLowerCase();
    const existing = database.prepare('SELECT id FROM users WHERE email = ?').get(normEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    database
      .prepare('INSERT INTO users (id, email, name, role, plan_id, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, normEmail, name.trim(), 'user', 'pro', hashPassword(password), now);
    database
      .prepare(`
        INSERT INTO calc_settings (user_id, lang, theme, chart_style, ay, sidereal, house_system, node_type, kp_mode, karaka_mode, calendar_system, sidebar_collapsed, updated_at)
        VALUES (?, 'te', 'light', 'south', 1, 1, 'placidus', 'mean', 'new', '7', 'amanta', 0, ?)
      `)
      .run(id, now);
    // Copy sample starter profile so newly registered user immediately has a chart
    database
      .prepare(`
        INSERT INTO birth_profiles (id, user_id, name, gender, y, m, d, hh, mi, ss, lat, lon, tz, ay, place, timezone_id, birth_time_known, is_default, is_archived, tags_json, notes, created_at, updated_at)
        VALUES (?, ?, 'Sample Horoscope', 'male', 1990, 5, 14, 6, 42, 0, 17.385, 78.4867, 5.5, 1, 'Hyderabad, India', 'Asia/Kolkata', 1, 1, 0, '["sample"]', 'Starter sample chart', ?, ?)
      `)
      .run(crypto.randomUUID(), id, now, now);

    recordAudit(database, id, 'REGISTER', 'users', normEmail);
    setSessionCookie(res, id);
    res.status(201).json({
      user: { id, email: normEmail, name: name.trim(), role: 'user', planId: 'pro' },
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const row = database
      .prepare('SELECT id, email, name, role, plan_id, password_hash FROM users WHERE email = ?')
      .get(email.trim().toLowerCase()) as
      | { id: string; email: string; name: string; role: UserRole; plan_id: string; password_hash: string }
      | undefined;

    if (!row || !verifyPassword(password, row.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    recordAudit(database, row.id, 'LOGIN', 'users', row.email);
    setSessionCookie(res, row.id);
    res.json({
      user: { id: row.id, email: row.email, name: row.name, role: row.role, planId: row.plan_id },
    });
  });

  app.post('/api/auth/switch-demo', (req, res) => {
    const { role } = req.body as { role?: 'admin' | 'user' };
    const uid = role === 'user' ? 'demo-user' : 'demo-admin';
    const row = database
      .prepare('SELECT id, email, name, role, plan_id FROM users WHERE id = ?')
      .get(uid) as { id: string; email: string; name: string; role: UserRole; plan_id: string } | undefined;
    if (!row) {
      res.status(404).json({ error: 'Demo account not found' });
      return;
    }
    setSessionCookie(res, row.id);
    res.json({ user: { id: row.id, email: row.email, name: row.name, role: row.role, planId: row.plan_id } });
  });

  app.post('/api/auth/logout', (_req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.put('/api/auth/profile', requireAuth, (req: AuthedRequest, res) => {
    const { name } = req.body as { name?: string };
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Display name is required.' });
      return;
    }
    database.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.authUser!.id);
    recordAudit(database, req.authUser!.id, 'UPDATE_ACCOUNT', 'users', name.trim());
    res.json({ ok: true, name: name.trim() });
  });

  // ---- Birth Profiles ----
  app.get('/api/profiles', requireAuth, (req: AuthedRequest, res) => {
    const rows = database
      .prepare('SELECT * FROM birth_profiles WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC')
      .all(req.authUser!.id) as Record<string, unknown>[];
    res.json({
      profiles: rows.map(mapProfileRow),
    });
  });

  app.post('/api/profiles', requireAuth, (req: AuthedRequest, res) => {
    const body = req.body as Record<string, unknown>;
    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : crypto.randomUUID();
    const now = new Date().toISOString();
    const isDefault = body.isDefault ? 1 : 0;
    if (isDefault) {
      database.prepare('UPDATE birth_profiles SET is_default = 0 WHERE user_id = ?').run(req.authUser!.id);
    }

    database
      .prepare(`
        INSERT INTO birth_profiles (
          id, user_id, name, gender, y, m, d, hh, mi, ss, lat, lon, tz, ay, place, timezone_id,
          birth_time_known, is_default, is_archived, tags_json, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        id,
        req.authUser!.id,
        String(body.name || 'Unnamed Profile'),
        String(body.gender || 'male'),
        Number(body.y ?? 1990),
        Number(body.m ?? 1),
        Number(body.d ?? 1),
        Number(body.hh ?? 12),
        Number(body.mi ?? 0),
        Number(body.ss ?? 0),
        Number(body.lat ?? 17.385),
        Number(body.lon ?? 78.4867),
        Number(body.tz ?? 5.5),
        Number(body.ay ?? 1),
        String(body.place || 'Hyderabad, India'),
        body.timezoneId ? String(body.timezoneId) : 'Asia/Kolkata',
        body.birthTimeKnown === false ? 0 : 1,
        isDefault,
        body.isArchived ? 1 : 0,
        JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
        String(body.notes || ''),
        now,
        now,
      );

    recordAudit(database, req.authUser!.id, 'CREATE_PROFILE', 'birth_profiles', String(body.name || id));
    const created = database.prepare('SELECT * FROM birth_profiles WHERE id = ?').get(id) as Record<string, unknown>;
    res.status(201).json({ profile: mapProfileRow(created) });
  });

  app.put('/api/profiles/:id', requireAuth, (req: AuthedRequest, res) => {
    const { id } = req.params;
    const existing = database
      .prepare('SELECT * FROM birth_profiles WHERE id = ? AND user_id = ?')
      .get(id, req.authUser!.id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Birth profile not found' });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const now = new Date().toISOString();
    const isDefault = body.isDefault !== undefined ? (body.isDefault ? 1 : 0) : Number(existing.is_default);
    if (isDefault) {
      database.prepare('UPDATE birth_profiles SET is_default = 0 WHERE user_id = ?').run(req.authUser!.id);
    }

    database
      .prepare(`
        UPDATE birth_profiles SET
          name = ?, gender = ?, y = ?, m = ?, d = ?, hh = ?, mi = ?, ss = ?,
          lat = ?, lon = ?, tz = ?, ay = ?, place = ?, timezone_id = ?,
          birth_time_known = ?, is_default = ?, is_archived = ?, tags_json = ?, notes = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `)
      .run(
        String(body.name ?? existing.name),
        String(body.gender ?? existing.gender),
        Number(body.y ?? existing.y),
        Number(body.m ?? existing.m),
        Number(body.d ?? existing.d),
        Number(body.hh ?? existing.hh),
        Number(body.mi ?? existing.mi),
        Number(body.ss ?? existing.ss),
        Number(body.lat ?? existing.lat),
        Number(body.lon ?? existing.lon),
        Number(body.tz ?? existing.tz),
        Number(body.ay ?? existing.ay),
        String(body.place ?? existing.place),
        String(body.timezoneId ?? existing.timezone_id ?? 'Asia/Kolkata'),
        body.birthTimeKnown !== undefined ? (body.birthTimeKnown ? 1 : 0) : Number(existing.birth_time_known),
        isDefault,
        body.isArchived !== undefined ? (body.isArchived ? 1 : 0) : Number(existing.is_archived),
        body.tags ? JSON.stringify(body.tags) : String(existing.tags_json),
        String(body.notes ?? existing.notes),
        now,
        id,
        req.authUser!.id,
      );

    const updated = database.prepare('SELECT * FROM birth_profiles WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({ profile: mapProfileRow(updated) });
  });

  app.delete('/api/profiles/:id', requireAuth, (req: AuthedRequest, res) => {
    const { id } = req.params;
    const info = database
      .prepare('DELETE FROM birth_profiles WHERE id = ? AND user_id = ?')
      .run(id, req.authUser!.id);
    if (info.changes === 0) {
      res.status(404).json({ error: 'Birth profile not found' });
      return;
    }
    recordAudit(database, req.authUser!.id, 'DELETE_PROFILE', 'birth_profiles', id);
    res.json({ ok: true });
  });

  app.post('/api/profiles/import', requireAuth, (req: AuthedRequest, res) => {
    const payload = req.body as { profiles?: Record<string, unknown>[] };
    const list = Array.isArray(payload.profiles) ? payload.profiles : [req.body as Record<string, unknown>];
    const now = new Date().toISOString();
    const inserted: Record<string, unknown>[] = [];
    for (const p of list) {
      if (!p || !p.name) continue;
      const newId = crypto.randomUUID();
      database
        .prepare(`
          INSERT INTO birth_profiles (
            id, user_id, name, gender, y, m, d, hh, mi, ss, lat, lon, tz, ay, place, timezone_id,
            birth_time_known, is_default, is_archived, tags_json, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)
        `)
        .run(
          newId,
          req.authUser!.id,
          String(p.name),
          String(p.gender || 'male'),
          Number(p.y ?? 1990),
          Number(p.m ?? 1),
          Number(p.d ?? 1),
          Number(p.hh ?? 12),
          Number(p.mi ?? 0),
          Number(p.ss ?? 0),
          Number(p.lat ?? 17.385),
          Number(p.lon ?? 78.4867),
          Number(p.tz ?? 5.5),
          Number(p.ay ?? 1),
          String(p.place || 'Hyderabad'),
          String(p.timezoneId || 'Asia/Kolkata'),
          p.birthTimeKnown === false ? 0 : 1,
          JSON.stringify(Array.isArray(p.tags) ? p.tags : ['imported']),
          String(p.notes || ''),
          now,
          now,
        );
      const row = database.prepare('SELECT * FROM birth_profiles WHERE id = ?').get(newId) as Record<string, unknown>;
      inserted.push(mapProfileRow(row));
    }
    res.status(201).json({ importedCount: inserted.length, profiles: inserted });
  });

  // ---- Calc & App Settings ----
  app.get('/api/settings', requireAuth, (req: AuthedRequest, res) => {
    const row = database.prepare('SELECT * FROM calc_settings WHERE user_id = ?').get(req.authUser!.id);
    res.json({ settings: row || null });
  });

  app.put('/api/settings', requireAuth, (req: AuthedRequest, res) => {
    const s = req.body as Record<string, unknown>;
    const existing = (database.prepare('SELECT * FROM calc_settings WHERE user_id = ?').get(req.authUser!.id) || {}) as Record<string, unknown>;
    const now = new Date().toISOString();

    database
      .prepare(`
        INSERT INTO calc_settings (user_id, lang, theme, chart_style, ay, sidereal, house_system, node_type, kp_mode, karaka_mode, calendar_system, sidebar_collapsed, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          lang = excluded.lang,
          theme = excluded.theme,
          chart_style = excluded.chart_style,
          ay = excluded.ay,
          sidereal = excluded.sidereal,
          house_system = excluded.house_system,
          node_type = excluded.node_type,
          kp_mode = excluded.kp_mode,
          karaka_mode = excluded.karaka_mode,
          calendar_system = excluded.calendar_system,
          sidebar_collapsed = excluded.sidebar_collapsed,
          updated_at = excluded.updated_at
      `)
      .run(
        req.authUser!.id,
        String(s.lang ?? existing.lang ?? 'te'),
        String(s.theme ?? existing.theme ?? 'light'),
        String(s.chart_style ?? s.chartStyle ?? existing.chart_style ?? 'south'),
        Number(s.ay ?? existing.ay ?? 1),
        s.sidereal !== undefined ? (s.sidereal ? 1 : 0) : Number(existing.sidereal ?? 1),
        String(s.house_system ?? s.houseSystem ?? existing.house_system ?? 'placidus'),
        String(s.node_type ?? s.nodeType ?? existing.node_type ?? 'mean'),
        String(s.kp_mode ?? s.kpMode ?? existing.kp_mode ?? 'new'),
        String(s.karaka_mode ?? s.karakaMode ?? existing.karaka_mode ?? '7'),
        String(s.calendar_system ?? s.calendarSystem ?? existing.calendar_system ?? 'amanta'),
        s.sidebar_collapsed !== undefined || s.sidebarCollapsed !== undefined
          ? (s.sidebar_collapsed || s.sidebarCollapsed ? 1 : 0)
          : Number(existing.sidebar_collapsed ?? 0),
        now,
      );

    const updated = database.prepare('SELECT * FROM calc_settings WHERE user_id = ?').get(req.authUser!.id);
    res.json({ settings: updated });
  });

  // ---- Life Events (Rectification) ----
  app.get('/api/life-events/:profileId', requireAuth, (req: AuthedRequest, res) => {
    const rows = database
      .prepare('SELECT * FROM life_events WHERE profile_id = ? AND user_id = ? ORDER BY event_date ASC')
      .all(req.params.profileId, req.authUser!.id);
    res.json({ events: rows });
  });

  app.post('/api/life-events', requireAuth, (req: AuthedRequest, res) => {
    const { profileId, title, category, eventDate, notes } = req.body as {
      profileId?: string;
      title?: string;
      category?: string;
      eventDate?: string;
      notes?: string;
    };
    if (!profileId || !title || !eventDate) {
      res.status(400).json({ error: 'profileId, title, and eventDate are required.' });
      return;
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    database
      .prepare('INSERT INTO life_events (id, profile_id, user_id, title, category, event_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, profileId, req.authUser!.id, title.trim(), category || 'other', eventDate, notes || '', now);
    const created = database.prepare('SELECT * FROM life_events WHERE id = ?').get(id);
    res.status(201).json({ event: created });
  });

  app.delete('/api/life-events/:id', requireAuth, (req: AuthedRequest, res) => {
    database.prepare('DELETE FROM life_events WHERE id = ? AND user_id = ?').run(req.params.id, req.authUser!.id);
    res.json({ ok: true });
  });

  // ---- Professional Reports + Versioning ----
  app.get('/api/reports', requireAuth, (req: AuthedRequest, res) => {
    const rows = database
      .prepare('SELECT id, user_id, profile_id, report_type, title, depth, language, created_at, updated_at FROM reports WHERE user_id = ? ORDER BY updated_at DESC')
      .all(req.authUser!.id);
    res.json({ reports: rows });
  });

  app.get('/api/reports/:id', requireAuth, (req: AuthedRequest, res) => {
    const row = database
      .prepare('SELECT * FROM reports WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.authUser!.id) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    const versions = database
      .prepare('SELECT id, version_num, edited_by, created_at FROM report_versions WHERE report_id = ? ORDER BY version_num DESC')
      .all(row.id as string);
    res.json({
      report: { ...row, content: JSON.parse(String(row.content_json)) },
      versions,
    });
  });

  app.post('/api/reports', requireAuth, (req: AuthedRequest, res) => {
    const { profileId, reportType, title, depth, language, content } = req.body as {
      profileId?: string;
      reportType?: string;
      title?: string;
      depth?: string;
      language?: string;
      content?: unknown;
    };
    if (!profileId || !reportType || !title || !content) {
      res.status(400).json({ error: 'profileId, reportType, title, and content are required.' });
      return;
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const contentJson = JSON.stringify(content);
    database
      .prepare('INSERT INTO reports (id, user_id, profile_id, report_type, title, depth, language, content_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.authUser!.id, profileId, reportType, title, depth || 'detailed', language || 'te', contentJson, now, now);
    database
      .prepare('INSERT INTO report_versions (id, report_id, version_num, content_json, edited_by, created_at) VALUES (?, ?, 1, ?, ?, ?)')
      .run(crypto.randomUUID(), id, contentJson, req.authUser!.name, now);

    const today = now.slice(0, 10);
    database
      .prepare(`
        INSERT INTO usage_records (id, user_id, usage_date, ai_calls, tokens_used, reports_generated)
        VALUES (?, ?, ?, 0, 0, 1)
        ON CONFLICT(user_id, usage_date) DO UPDATE SET reports_generated = reports_generated + 1
      `)
      .run(crypto.randomUUID(), req.authUser!.id, today);

    recordAudit(database, req.authUser!.id, 'CREATE_REPORT', 'reports', title);
    res.status(201).json({ id, title, createdAt: now });
  });

  app.put('/api/reports/:id', requireAuth, (req: AuthedRequest, res) => {
    const existing = database
      .prepare('SELECT * FROM reports WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.authUser!.id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    const { title, content } = req.body as { title?: string; content?: unknown };
    const now = new Date().toISOString();
    const contentJson = content ? JSON.stringify(content) : String(existing.content_json);
    database
      .prepare('UPDATE reports SET title = ?, content_json = ?, updated_at = ? WHERE id = ?')
      .run(title || String(existing.title), contentJson, now, req.params.id);

    const maxVer = database
      .prepare('SELECT COALESCE(MAX(version_num), 0) as mv FROM report_versions WHERE report_id = ?')
      .get(req.params.id) as { mv: number };
    database
      .prepare('INSERT INTO report_versions (id, report_id, version_num, content_json, edited_by, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), req.params.id, maxVer.mv + 1, contentJson, req.authUser!.name, now);

    res.json({ ok: true, version: maxVer.mv + 1, updatedAt: now });
  });

  app.delete('/api/reports/:id', requireAuth, (req: AuthedRequest, res) => {
    database.prepare('DELETE FROM reports WHERE id = ? AND user_id = ?').run(req.params.id, req.authUser!.id);
    res.json({ ok: true });
  });

  // ---- Knowledge & Bookmarks ----
  app.get('/api/knowledge', (_req, res) => {
    const rows = database.prepare('SELECT * FROM knowledge_articles ORDER BY title_en ASC').all() as Record<string, unknown>[];
    res.json({
      articles: rows.map((r) => ({
        id: r.id,
        cat: r.cat,
        catEn: r.cat_en,
        title: r.title,
        titleEn: r.title_en,
        sub: r.sub,
        subEn: r.sub_en,
        src: r.src,
        tags: JSON.parse(String(r.tags_json || '[]')),
        body: r.body,
        bodyEn: r.body_en,
      })),
    });
  });

  app.get('/api/bookmarks', requireAuth, (req: AuthedRequest, res) => {
    const rows = database.prepare('SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC').all(req.authUser!.id);
    res.json({ bookmarks: rows });
  });

  app.post('/api/bookmarks', requireAuth, (req: AuthedRequest, res) => {
    const { itemType, itemId, title, meta } = req.body as { itemType?: string; itemId?: string; title?: string; meta?: string };
    if (!itemType || !itemId || !title) {
      res.status(400).json({ error: 'itemType, itemId, and title are required.' });
      return;
    }
    const id = crypto.randomUUID();
    database
      .prepare('INSERT OR IGNORE INTO bookmarks (id, user_id, item_type, item_id, title, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.authUser!.id, itemType, itemId, title, meta || '', new Date().toISOString());
    res.status(201).json({ ok: true });
  });

  app.delete('/api/bookmarks/:itemType/:itemId', requireAuth, (req: AuthedRequest, res) => {
    database
      .prepare('DELETE FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?')
      .run(req.authUser!.id, req.params.itemType, req.params.itemId);
    res.json({ ok: true });
  });

  // ---- Notifications & Usage ----
  app.get('/api/notifications', requireAuth, (req: AuthedRequest, res) => {
    const rows = database
      .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30')
      .all(req.authUser!.id);
    res.json({ notifications: rows });
  });

  app.post('/api/notifications/:id/read', requireAuth, (req: AuthedRequest, res) => {
    database.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.authUser!.id);
    res.json({ ok: true });
  });

  app.get('/api/usage', requireAuth, (req: AuthedRequest, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const plan = database.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(req.authUser!.planId);
    const plans = database.prepare('SELECT * FROM subscription_plans ORDER BY price_monthly_inr ASC').all();
    const todayUsage = database
      .prepare('SELECT * FROM usage_records WHERE user_id = ? AND usage_date = ?')
      .get(req.authUser!.id, today);
    const history = database
      .prepare('SELECT * FROM usage_records WHERE user_id = ? ORDER BY usage_date DESC LIMIT 14')
      .all(req.authUser!.id);
    res.json({ plan, plans, todayUsage: todayUsage || { ai_calls: 0, tokens_used: 0, reports_generated: 0 }, history });
  });

  // ---- Gemini AI Astrologer ----
  app.get('/api/gemini/status', (_req, res) => {
    res.json({ configured: isGeminiConfigured(), model: 'gemini-4-hydrogen' });
  });

  app.get('/api/gemini/conversations', requireAuth, (req: AuthedRequest, res) => {
    const rows = database
      .prepare('SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC')
      .all(req.authUser!.id);
    res.json({ conversations: rows });
  });

  app.get('/api/gemini/conversations/:id', requireAuth, (req: AuthedRequest, res) => {
    const conv = database
      .prepare('SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.authUser!.id);
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    const messages = database
      .prepare('SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(req.params.id);
    res.json({ conversation: conv, messages });
  });

  app.delete('/api/gemini/conversations/:id', requireAuth, (req: AuthedRequest, res) => {
    database.prepare('DELETE FROM ai_conversations WHERE id = ? AND user_id = ?').run(req.params.id, req.authUser!.id);
    res.json({ ok: true });
  });

  app.post('/api/gemini/chat', requireAuth, async (req: AuthedRequest, res) => {
    const { conversationId, profileId, message, chartContextSummary, language, focusTopic } = req.body as {
      conversationId?: string;
      profileId?: string;
      message?: string;
      chartContextSummary?: string;
      language?: 'te' | 'en' | 'hi';
      focusTopic?: string;
    };
    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Question prompt is required.' });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const plan = database
      .prepare('SELECT daily_ai_limit FROM subscription_plans WHERE id = ?')
      .get(req.authUser!.planId) as { daily_ai_limit: number } | undefined;
    const usage = database
      .prepare('SELECT ai_calls FROM usage_records WHERE user_id = ? AND usage_date = ?')
      .get(req.authUser!.id, today) as { ai_calls: number } | undefined;
    const limit = plan?.daily_ai_limit ?? 50;
    if ((usage?.ai_calls ?? 0) >= limit) {
      res.status(429).json({ error: `Daily AI consultation quota (${limit}) reached for today.` });
      return;
    }

    const now = new Date().toISOString();
    let cid = conversationId;
    if (!cid) {
      cid = crypto.randomUUID();
      database
        .prepare('INSERT INTO ai_conversations (id, user_id, profile_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(cid, req.authUser!.id, profileId || null, message.trim().slice(0, 64), now, now);
    }

    const prevMsgs = database
      .prepare('SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(cid) as { role: 'user' | 'assistant'; content: string }[];

    const userMsgId = crypto.randomUUID();
    database
      .prepare('INSERT INTO ai_messages (id, conversation_id, role, content, tokens_used, model, created_at) VALUES (?, ?, ?, ?, 0, NULL, ?)')
      .run(userMsgId, cid, 'user', message.trim(), now);

    try {
      const result = await generateAstrologyReply({
        messages: [...prevMsgs, { role: 'user', content: message.trim() }],
        chartContextSummary: chartContextSummary || 'No active chart summary attached.',
        language: language || 'te',
        focusTopic,
      });

      const assistantTime = new Date().toISOString();
      const assistantMsgId = crypto.randomUUID();
      database
        .prepare('INSERT INTO ai_messages (id, conversation_id, role, content, tokens_used, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(assistantMsgId, cid, 'assistant', result.reply, result.tokensUsed, result.model, assistantTime);
      database.prepare('UPDATE ai_conversations SET updated_at = ? WHERE id = ?').run(assistantTime, cid);

      database
        .prepare(`
          INSERT INTO usage_records (id, user_id, usage_date, ai_calls, tokens_used, reports_generated)
          VALUES (?, ?, ?, 1, ?, 0)
          ON CONFLICT(user_id, usage_date) DO UPDATE SET
            ai_calls = ai_calls + 1,
            tokens_used = tokens_used + excluded.tokens_used
        `)
        .run(crypto.randomUUID(), req.authUser!.id, today, result.tokensUsed);

      res.json({
        conversationId: cid,
        reply: result.reply,
        model: result.model,
        tokensUsed: result.tokensUsed,
      });
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      res.status(e.statusCode || 502).json({
        error: e.message || 'Failed to generate AI astrology response.',
        conversationId: cid,
      });
    }
  });

  // ---- Admin Console Routes ----
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const users = database.prepare('SELECT id, email, name, role, plan_id, created_at FROM users ORDER BY created_at DESC').all();
    const auditLogs = database.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 60').all();
    const stats = {
      users: (database.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c,
      profiles: (database.prepare('SELECT COUNT(*) as c FROM birth_profiles').get() as { c: number }).c,
      reports: (database.prepare('SELECT COUNT(*) as c FROM reports').get() as { c: number }).c,
      conversations: (database.prepare('SELECT COUNT(*) as c FROM ai_conversations').get() as { c: number }).c,
      articles: (database.prepare('SELECT COUNT(*) as c FROM knowledge_articles').get() as { c: number }).c,
    };
    res.json({ users, auditLogs, stats, geminiConfigured: isGeminiConfigured() });
  });

  app.put('/api/admin/users/:id', requireAdmin, (req: AuthedRequest, res) => {
    const { role, planId } = req.body as { role?: UserRole; planId?: string };
    database
      .prepare('UPDATE users SET role = COALESCE(?, role), plan_id = COALESCE(?, plan_id) WHERE id = ?')
      .run(role || null, planId || null, req.params.id);
    recordAudit(database, req.authUser!.id, 'ADMIN_UPDATE_USER', 'users', `${req.params.id} -> role=${role || '-'} plan=${planId || '-'}`);
    res.json({ ok: true });
  });

  app.post('/api/admin/knowledge', requireAdmin, (req: AuthedRequest, res) => {
    const a = req.body as Record<string, unknown>;
    const id = String(a.id || crypto.randomUUID());
    const now = new Date().toISOString();
    database
      .prepare(`
        INSERT INTO knowledge_articles (id, cat, cat_en, title, title_en, sub, sub_en, src, tags_json, body, body_en, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          cat = excluded.cat, cat_en = excluded.cat_en, title = excluded.title, title_en = excluded.title_en,
          sub = excluded.sub, sub_en = excluded.sub_en, src = excluded.src, tags_json = excluded.tags_json,
          body = excluded.body, body_en = excluded.body_en, updated_at = excluded.updated_at
      `)
      .run(
        id,
        String(a.cat || 'శాస్త్ర గ్రంథాలు'),
        String(a.catEn || 'Classical Jyotisha'),
        String(a.title || a.titleEn || 'Untitled'),
        String(a.titleEn || a.title || 'Untitled'),
        String(a.sub || ''),
        String(a.subEn || ''),
        String(a.src || 'Admin Entry'),
        JSON.stringify(Array.isArray(a.tags) ? a.tags : []),
        String(a.body || a.bodyEn || ''),
        String(a.bodyEn || a.body || ''),
        now,
      );
    recordAudit(database, req.authUser!.id, 'UPSERT_KNOWLEDGE', 'knowledge_articles', id);
    res.status(201).json({ ok: true, id });
  });

  app.delete('/api/admin/knowledge/:id', requireAdmin, (req: AuthedRequest, res) => {
    database.prepare('DELETE FROM knowledge_articles WHERE id = ?').run(req.params.id);
    recordAudit(database, req.authUser!.id, 'DELETE_KNOWLEDGE', 'knowledge_articles', req.params.id);
    res.json({ ok: true });
  });

  // ---- Location Geocoding (Nominatim OpenStreetMap + local CITIES fallback) ----
  app.get('/api/geocode', async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) {
      res.json({ results: [] });
      return;
    }

    const qLower = q.toLowerCase();
    const localMatches = CITIES
      .filter(([city, region]) => `${city} ${region}`.toLowerCase().includes(qLower))
      .slice(0, 6)
      .map(([city, region, lat, lon, tz]) => ({
        place: `${city}, ${region}`,
        lat,
        lon,
        tz,
        timezoneId: tz === 5.5 ? 'Asia/Kolkata' : `UTC${tz >= 0 ? '+' : ''}${tz}`,
        source: 'local' as const,
      }));

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'AstroJyotish/1.0', 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(3500),
      });
      if (resp.ok) {
        const data = (await resp.json()) as Array<{
          display_name?: string;
          name?: string;
          lat?: string;
          lon?: string;
          address?: { country_code?: string; state?: string; country?: string; city?: string; town?: string; village?: string };
        }>;
        const nomResults = (Array.isArray(data) ? data : []).map((item) => {
          const lat = Number(item.lat ?? 0);
          const lon = Number(item.lon ?? 0);
          const addr = item.address || {};
          const shortName = [item.name || addr.city || addr.town || addr.village, addr.state, addr.country].filter(Boolean).join(', ') || String(item.display_name || q);
          const est = estimateTzAndZone(lat, lon, addr.country_code, item.display_name);
          return {
            place: shortName,
            fullDisplayName: String(item.display_name || shortName),
            lat: Number(lat.toFixed(4)),
            lon: Number(lon.toFixed(4)),
            tz: est.tz,
            timezoneId: est.timezoneId,
            source: 'nominatim' as const,
          };
        });
        const merged = [...nomResults];
        for (const lm of localMatches) {
          if (!merged.some((m) => Math.abs(m.lat - lm.lat) < 0.08 && Math.abs(m.lon - lm.lon) < 0.08)) {
            merged.push(lm);
          }
        }
        res.json({ results: merged.slice(0, 8) });
        return;
      }
    } catch {
      // Fallback smoothly to localMatches when external Nominatim is unreachable
    }
    res.json({ results: localMatches });
  });

  // ---- Workflow Progress (Steps 01-21) ----
  app.get('/api/workflow/:profileId', requireAuth, (req: AuthedRequest, res) => {
    const rows = database
      .prepare('SELECT step_id, status, updated_at FROM workflow_progress WHERE profile_id = ? AND user_id = ?')
      .all(req.params.profileId, req.authUser!.id) as Array<{ step_id: string; status: string; updated_at: string }>;
    const steps: Record<string, 'pending' | 'completed'> = {};
    for (const r of rows) steps[r.step_id] = r.status === 'completed' ? 'completed' : 'pending';
    res.json({ steps });
  });

  app.put('/api/workflow/:profileId', requireAuth, (req: AuthedRequest, res) => {
    const { stepId, status } = req.body as { stepId?: string; status?: 'pending' | 'completed' };
    if (!stepId) {
      res.status(400).json({ error: 'stepId is required' });
      return;
    }
    const cleanStatus = status === 'completed' ? 'completed' : 'pending';
    const now = new Date().toISOString();
    database
      .prepare(`
        INSERT INTO workflow_progress (profile_id, user_id, step_id, status, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(profile_id, user_id, step_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at
      `)
      .run(req.params.profileId, req.authUser!.id, stepId, cleanStatus, now);
    res.json({ ok: true, stepId, status: cleanStatus });
  });

  // ---- Mantra Japa Logs (Section 20) ----
  app.get('/api/japa/:profileId', requireAuth, (req: AuthedRequest, res) => {
    const rows = database
      .prepare('SELECT * FROM mantra_japa_logs WHERE profile_id = ? AND user_id = ? ORDER BY updated_at DESC')
      .all(req.params.profileId, req.authUser!.id) as Record<string, unknown>[];
    res.json({
      logs: rows.map((r) => ({
        id: String(r.id),
        profileId: String(r.profile_id),
        planetId: r.planet_id === null || r.planet_id === undefined ? null : Number(r.planet_id),
        mantraKey: String(r.mantra_key),
        title: String(r.title),
        dailyTarget: Number(r.daily_target),
        completedCount: Number(r.completed_count),
        malasCompleted: Number(r.malas_completed),
        startDate: r.start_date ? String(r.start_date) : '',
        completedDate: r.completed_date ? String(r.completed_date) : '',
        notes: String(r.notes || ''),
        history: JSON.parse(String(r.history_json || '[]')),
        updatedAt: String(r.updated_at),
      })),
    });
  });

  app.post('/api/japa/:profileId', requireAuth, (req: AuthedRequest, res) => {
    const b = req.body as Record<string, unknown>;
    const id = typeof b.id === 'string' && b.id.trim() ? b.id.trim() : crypto.randomUUID();
    const now = new Date().toISOString();
    database
      .prepare(`
        INSERT INTO mantra_japa_logs (
          id, profile_id, user_id, planet_id, mantra_key, title, daily_target, completed_count,
          malas_completed, start_date, completed_date, notes, history_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        id,
        req.params.profileId,
        req.authUser!.id,
        b.planetId === null || b.planetId === undefined ? null : Number(b.planetId),
        String(b.mantraKey || 'gayatri'),
        String(b.title || 'Mantra Japa'),
        Number(b.dailyTarget ?? 108),
        Number(b.completedCount ?? 0),
        Number(b.malasCompleted ?? 0),
        String(b.startDate || now.slice(0, 10)),
        b.completedDate ? String(b.completedDate) : null,
        String(b.notes || ''),
        JSON.stringify(Array.isArray(b.history) ? b.history : []),
        now,
      );
    res.status(201).json({ ok: true, id, updatedAt: now });
  });

  app.put('/api/japa/:profileId/:id', requireAuth, (req: AuthedRequest, res) => {
    const b = req.body as Record<string, unknown>;
    const existing = database
      .prepare('SELECT * FROM mantra_japa_logs WHERE id = ? AND profile_id = ? AND user_id = ?')
      .get(req.params.id, req.params.profileId, req.authUser!.id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Japa log not found' });
      return;
    }
    const now = new Date().toISOString();
    database
      .prepare(`
        UPDATE mantra_japa_logs SET
          daily_target = ?, completed_count = ?, malas_completed = ?, start_date = ?,
          completed_date = ?, notes = ?, history_json = ?, updated_at = ?
        WHERE id = ? AND profile_id = ? AND user_id = ?
      `)
      .run(
        Number(b.dailyTarget ?? existing.daily_target),
        Number(b.completedCount ?? existing.completed_count),
        Number(b.malasCompleted ?? existing.malas_completed),
        String(b.startDate ?? existing.start_date ?? now.slice(0, 10)),
        b.completedDate !== undefined ? (b.completedDate ? String(b.completedDate) : null) : existing.completed_date,
        String(b.notes ?? existing.notes ?? ''),
        b.history !== undefined ? JSON.stringify(b.history) : String(existing.history_json || '[]'),
        now,
        req.params.id,
        req.params.profileId,
        req.authUser!.id,
      );
    res.json({ ok: true, updatedAt: now });
  });

  app.delete('/api/japa/:profileId/:id', requireAuth, (req: AuthedRequest, res) => {
    database
      .prepare('DELETE FROM mantra_japa_logs WHERE id = ? AND profile_id = ? AND user_id = ?')
      .run(req.params.id, req.params.profileId, req.authUser!.id);
    res.json({ ok: true });
  });

  // ---- Verification & Implementation Status (Section 21) ----
  app.get('/api/verification/:profileId', requireAuth, (req: AuthedRequest, res) => {
    const row = database
      .prepare('SELECT * FROM verification_records WHERE profile_id = ? AND user_id = ?')
      .get(req.params.profileId, req.authUser!.id) as Record<string, unknown> | undefined;
    if (!row) {
      res.json({
        record: {
          profileId: req.params.profileId,
          birthTimeStatus: 'Needs Review',
          chartAccuracyStatus: 'Verified Ephemeris',
          items: [],
          timeline: [],
          notes: '',
          nextReviewDate: '',
          updatedAt: new Date().toISOString(),
        },
      });
      return;
    }
    res.json({
      record: {
        profileId: String(row.profile_id),
        birthTimeStatus: String(row.birth_time_status),
        chartAccuracyStatus: String(row.chart_accuracy_status),
        items: JSON.parse(String(row.items_json || '[]')),
        timeline: JSON.parse(String(row.timeline_json || '[]')),
        notes: String(row.notes || ''),
        nextReviewDate: row.next_review_date ? String(row.next_review_date) : '',
        updatedAt: String(row.updated_at),
      },
    });
  });

  app.put('/api/verification/:profileId', requireAuth, (req: AuthedRequest, res) => {
    const b = req.body as Record<string, unknown>;
    const now = new Date().toISOString();
    database
      .prepare(`
        INSERT INTO verification_records (
          profile_id, user_id, birth_time_status, chart_accuracy_status, items_json, timeline_json, notes, next_review_date, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(profile_id, user_id) DO UPDATE SET
          birth_time_status = excluded.birth_time_status,
          chart_accuracy_status = excluded.chart_accuracy_status,
          items_json = excluded.items_json,
          timeline_json = excluded.timeline_json,
          notes = excluded.notes,
          next_review_date = excluded.next_review_date,
          updated_at = excluded.updated_at
      `)
      .run(
        req.params.profileId,
        req.authUser!.id,
        String(b.birthTimeStatus || 'Needs Review'),
        String(b.chartAccuracyStatus || 'Verified Ephemeris'),
        JSON.stringify(Array.isArray(b.items) ? b.items : []),
        JSON.stringify(Array.isArray(b.timeline) ? b.timeline : []),
        String(b.notes || ''),
        b.nextReviewDate ? String(b.nextReviewDate) : null,
        now,
      );
    res.json({ ok: true, updatedAt: now });
  });

  return app;
}

function mapProfileRow(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    name: String(r.name),
    gender: String(r.gender || 'male'),
    y: Number(r.y),
    m: Number(r.m),
    d: Number(r.d),
    hh: Number(r.hh),
    mi: Number(r.mi),
    ss: Number(r.ss ?? 0),
    lat: Number(r.lat),
    lon: Number(r.lon),
    tz: Number(r.tz),
    ay: Number(r.ay ?? 1),
    place: String(r.place),
    timezoneId: r.timezone_id ? String(r.timezone_id) : 'Asia/Kolkata',
    birthTimeKnown: Boolean(r.birth_time_known),
    isDefault: Boolean(r.is_default),
    isArchived: Boolean(r.is_archived),
    tags: JSON.parse(String(r.tags_json || '[]')),
    notes: String(r.notes || ''),
    createdAt: String(r.created_at || ''),
    updatedAt: String(r.updated_at || ''),
  };
}

async function startServer() {
  const app = createApp(defaultDb);
  const port = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`ASTROJYOTISH PRO server listening on http://0.0.0.0:${port}`);
  });
}

// Start server only when executed directly (allows unit testing createApp without binding port)
const isMain = process.argv[1] && path.resolve(process.argv[1]).endsWith('server.ts');
if (isMain) {
  startServer().catch((err) => {
    console.error('Failed to start ASTROJYOTISH PRO server:', err);
    process.exit(1);
  });
}

export { createDatabase };
