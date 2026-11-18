import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import { createApp, createDatabase } from '../server.ts';

async function startTestServer() {
  const db = createDatabase(':memory:');
  const app = createApp(db);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  assert.ok(addr && typeof addr === 'object');
  const baseUrl = `http://127.0.0.1:${addr.port}`;
  return { server, baseUrl, db };
}

test('API end-to-end: health, auth/RBAC, profiles, settings, life-events, reports, knowledge & gemini status', async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    // 1. Health
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const health = (await healthRes.json()) as { ok: boolean; service: string; geminiConfigured: boolean };
    assert.equal(health.ok, true);
    assert.equal(health.service, 'astrojyotish-pro');

    // 2. Default demo-admin context works in preview
    const meRes = await fetch(`${baseUrl}/api/auth/me`);
    const me = (await meRes.json()) as { user: { id: string; role: string } | null };
    assert.equal(me.user?.id, 'demo-admin');
    assert.equal(me.user?.role, 'admin');

    // 3. Profiles list & CRUD
    const profRes = await fetch(`${baseUrl}/api/profiles`);
    const profList = (await profRes.json()) as { profiles: Array<{ id: string; name: string }> };
    assert.ok(profList.profiles.length >= 3, 'Should seed 3 sample profiles');

    const createRes = await fetch(`${baseUrl}/api/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Native',
        gender: 'female',
        y: 1995, m: 11, d: 22, hh: 14, mi: 15, ss: 0,
        lat: 13.0827, lon: 80.2707, tz: 5.5,
        place: 'Chennai, India',
      }),
    });
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as { profile: { id: string; name: string } };
    assert.equal(created.profile.name, 'Test Native');

    // 4. Settings PUT/GET
    const putSet = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ay: 3, houseSystem: 'whole-sign', kpMode: 'old' }),
    });
    assert.equal(putSet.status, 200);
    const getSet = await fetch(`${baseUrl}/api/settings`);
    const setJson = (await getSet.json()) as { settings: { ay: number; house_system: string; kp_mode: string } };
    assert.equal(setJson.settings.ay, 3);
    assert.equal(setJson.settings.house_system, 'whole-sign');

    // 5. Life events
    const evRes = await fetch(`${baseUrl}/api/life-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: created.profile.id,
        title: 'University Graduation',
        category: 'education',
        eventDate: '2017-06-15',
      }),
    });
    assert.equal(evRes.status, 201);

    // 6. Reports + Versioning
    const repCreate = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: created.profile.id,
        reportType: 'natal-full',
        title: 'Test Native Full Report',
        depth: 'detailed',
        language: 'en',
        content: { sections: [{ heading: 'Overview', body: 'Initial' }] },
      }),
    });
    assert.equal(repCreate.status, 201);
    const repId = ((await repCreate.json()) as { id: string }).id;

    const repUpdate = await fetch(`${baseUrl}/api/reports/${repId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Native Full Report v2',
        content: { sections: [{ heading: 'Overview', body: 'Edited' }] },
      }),
    });
    assert.equal(repUpdate.status, 200);
    const repVer = (await repUpdate.json()) as { version: number };
    assert.equal(repVer.version, 2);

    // 7. Knowledge & Bookmarks
    const knowRes = await fetch(`${baseUrl}/api/knowledge`);
    const know = (await knowRes.json()) as { articles: Array<{ id: string }> };
    assert.ok(know.articles.length >= 6);

    const bmRes = await fetch(`${baseUrl}/api/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemType: 'article', itemId: know.articles[0].id, title: 'Saved Article' }),
    });
    assert.equal(bmRes.status, 201);

    // 8. Admin Overview works as admin, blocked as registered standard user
    const adminOk = await fetch(`${baseUrl}/api/admin/overview`);
    assert.equal(adminOk.status, 200);

    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Standard Member',
        email: 'member@example.com',
        password: 'password123',
      }),
    });
    assert.equal(regRes.status, 201);
    const cookie = regRes.headers.get('set-cookie') || '';
    assert.ok(cookie.includes('ajp_session='));

    const adminForbidden = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Cookie: cookie.split(';')[0] },
    });
    assert.equal(adminForbidden.status, 403);

    // 9. Gemini status & explicit key check (when GEMINI_API_KEY not set in test env)
    if (!process.env.GEMINI_API_KEY) {
      const chatRes = await fetch(`${baseUrl}/api/gemini/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie.split(';')[0] },
        body: JSON.stringify({ message: 'Explain my Lagna' }),
      });
      assert.equal(chatRes.status, 503);
      const errJson = (await chatRes.json()) as { error: string };
      assert.ok(errJson.error.includes('GEMINI_API_KEY'));
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
