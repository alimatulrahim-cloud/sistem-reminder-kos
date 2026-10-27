// Backend Reminder Kos: Worker + D1. Semua data ada di satu "state" milik satu pengelola kos.
// Login admin (secret ADMIN_USER dan ADMIN_PASS) menghasilkan token bertanda tangan HMAC (kunci: APP_PASSCODE).

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

function sameString(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const enc = new TextEncoder();
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const TOKEN_TTL = 30 * 24 * 3600; // detik

async function sign(env, payload) {
  const key = await crypto.subtle.importKey('raw', enc.encode(env.APP_PASSCODE), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
}

async function makeToken(env) {
  const payload = String(Math.floor(Date.now() / 1000) + TOKEN_TTL);
  return payload + '.' + (await sign(env, payload));
}

async function authorized(request, env) {
  if (!env.APP_PASSCODE) return false;
  const [exp, sig] = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').split('.');
  if (!exp || !sig || !(Number(exp) > Date.now() / 1000)) return false;
  return sameString(sig, await sign(env, exp));
}

async function login(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'JSON tidak valid' }, 400); }
  const u = String(body.username || ''), p = String(body.password || '');
  const ok = sameString(u, env.ADMIN_USER || '') && sameString(p, env.ADMIN_PASS || '') && !!env.ADMIN_USER && !!env.ADMIN_PASS;
  if (!ok) {
    await new Promise((r) => setTimeout(r, 800)); // perlambat tebakan berulang
    return json({ error: 'Username atau password salah' }, 401);
  }
  return json({ token: await makeToken(env) });
}

async function readState(env) {
  const [rooms, payments, meta] = await env.DB.batch([
    env.DB.prepare('SELECT no, nama, wa, sewa, due_day, paid_until FROM rooms ORDER BY no'),
    env.DB.prepare('SELECT tgl, no, periode, nominal FROM payments ORDER BY tgl DESC, id DESC'),
    env.DB.prepare("SELECT k, v FROM meta WHERE k IN ('gate', 'sample')"),
  ]);
  const m = Object.fromEntries(meta.results.map((r) => [r.k, r.v]));
  return {
    empty: rooms.results.length === 0,
    rooms: rooms.results.map((r) => ({
      no: r.no, nama: r.nama, wa: r.wa, sewa: r.sewa, dueDay: r.due_day, paidUntil: r.paid_until,
    })),
    log: payments.results,
    gate: m.gate || '',
    sample: m.sample === '1',
  };
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function validState(s) {
  if (!s || !Array.isArray(s.rooms) || !Array.isArray(s.log)) return false;
  if (s.rooms.length > 200 || s.log.length > 20000) return false;
  const okRoom = (r) =>
    Number.isInteger(r.no) && typeof r.nama === 'string' && typeof r.wa === 'string' &&
    Number.isInteger(r.sewa) && Number.isInteger(r.dueDay) && r.dueDay >= 1 && r.dueDay <= 31 &&
    DATE.test(r.paidUntil);
  const okLog = (e) =>
    DATE.test(e.tgl) && Number.isInteger(e.no) && DATE.test(e.periode) && Number.isInteger(e.nominal);
  return s.rooms.every(okRoom) && s.log.every(okLog) && typeof s.gate === 'string';
}

async function writeState(env, s) {
  const stmts = [
    env.DB.prepare('DELETE FROM rooms'),
    env.DB.prepare('DELETE FROM payments'),
    ...s.rooms.map((r) =>
      env.DB.prepare('INSERT INTO rooms (no, nama, wa, sewa, due_day, paid_until) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(r.no, r.nama, r.wa, r.sewa, r.dueDay, r.paidUntil)),
    // log disimpan urut lama ke baru supaya id mengikuti urutan catat
    ...s.log.slice().reverse().map((e) =>
      env.DB.prepare('INSERT INTO payments (tgl, no, periode, nominal) VALUES (?, ?, ?, ?)')
        .bind(e.tgl, e.no, e.periode, e.nominal)),
    env.DB.prepare("INSERT INTO meta (k, v) VALUES ('gate', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(s.gate),
    env.DB.prepare("INSERT INTO meta (k, v) VALUES ('sample', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(s.sample ? '1' : '0'),
  ];
  await env.DB.batch(stmts);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    if (url.pathname === '/api/health') return json({ ok: true });

    if (!env.APP_PASSCODE) return json({ error: 'APP_PASSCODE belum diatur di Worker' }, 503);
    if (url.pathname === '/api/login' && request.method === 'POST') return login(request, env);
    if (!(await authorized(request, env))) return json({ error: 'Belum login' }, 401);

    if (url.pathname === '/api/state') {
      if (request.method === 'GET') return json(await readState(env));
      if (request.method === 'PUT') {
        let body;
        try { body = await request.json(); } catch { return json({ error: 'JSON tidak valid' }, 400); }
        if (!validState(body)) return json({ error: 'Data tidak valid' }, 400);
        await writeState(env, body);
        return json({ ok: true });
      }
      return json({ error: 'Method tidak didukung' }, 405);
    }
    return json({ error: 'Tidak ditemukan' }, 404);
  },
};
