// Backend Reminder Kos: Worker + D1. Semua data ada di satu "state" milik satu pengelola kos.
// Akses dikunci dengan kode akses (secret APP_PASSCODE) yang dikirim lewat header Authorization.

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

function authorized(request, env) {
  const secret = env.APP_PASSCODE;
  if (!secret) return false;
  const given = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return sameString(given, secret);
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
    if (!authorized(request, env)) return json({ error: 'Kode akses salah' }, 401);

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
