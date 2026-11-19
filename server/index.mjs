import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IS_VERCEL = Boolean(process.env.VERCEL);
const FILE_STORE_PATH = path.join(ROOT, 'data', 'store.json');
const PORT = Number(process.env.API_PORT || process.env.PORT || 8787);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'RCE_T&P';
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'race-to-create-admin-secret';

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

if (IS_VERCEL && !supabase) {
  console.warn(
    '[store] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing. ' +
      'Approved emails will NOT persist across refreshes on Vercel.',
  );
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '32kb' }));

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function normalizeName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function emptyStore() {
  return { approvedEmails: [], issued: {} };
}

function normalizeStore(data) {
  if (!data || typeof data !== 'object') return emptyStore();
  return {
    approvedEmails: Array.isArray(data.approvedEmails) ? data.approvedEmails : [],
    issued:
      data.issued && typeof data.issued === 'object' && !Array.isArray(data.issued)
        ? data.issued
        : {},
  };
}

function storageKind() {
  if (supabase) return 'supabase';
  if (IS_VERCEL) return 'ephemeral-tmp';
  return 'local-file';
}

function ensureFileStore() {
  const dir = path.dirname(FILE_STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE_STORE_PATH)) {
    fs.writeFileSync(FILE_STORE_PATH, JSON.stringify(emptyStore(), null, 2), 'utf8');
  }
}

async function readStoreFromSupabase() {
  const [{ data: approved, error: approvedError }, { data: issuedRows, error: issuedError }] =
    await Promise.all([
      supabase.from('approved_emails').select('email').order('email', { ascending: true }),
      supabase.from('issued_certificates').select('email, full_name, issued_at'),
    ]);

  if (approvedError) throw approvedError;
  if (issuedError) throw issuedError;

  const issued = {};
  for (const row of issuedRows || []) {
    issued[row.email] = {
      fullName: row.full_name,
      email: row.email,
      issuedAt: row.issued_at,
    };
  }

  return {
    approvedEmails: (approved || []).map((row) => row.email),
    issued,
  };
}

async function writeStoreToSupabase(store) {
  const payload = normalizeStore(store);
  const emails = payload.approvedEmails;

  const { data: existingRows, error: existingError } = await supabase
    .from('approved_emails')
    .select('email');
  if (existingError) throw existingError;

  const existing = new Set((existingRows || []).map((row) => row.email));
  const next = new Set(emails);

  const toInsert = emails.filter((email) => !existing.has(email)).map((email) => ({ email }));
  const toDelete = [...existing].filter((email) => !next.has(email));

  if (toDelete.length) {
    const { error } = await supabase.from('approved_emails').delete().in('email', toDelete);
    if (error) throw error;
  }

  if (toInsert.length) {
    const { error } = await supabase.from('approved_emails').upsert(toInsert, {
      onConflict: 'email',
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }

  const issuedEntries = Object.entries(payload.issued);
  if (issuedEntries.length) {
    const rows = issuedEntries.map(([email, value]) => ({
      email,
      full_name: value.fullName,
      issued_at: value.issuedAt || new Date().toISOString(),
    }));
    const { error } = await supabase.from('issued_certificates').upsert(rows, {
      onConflict: 'email',
    });
    if (error) throw error;
  }
}

async function readStore() {
  if (supabase) return readStoreFromSupabase();

  const storePath = IS_VERCEL
    ? path.join('/tmp', 'certificate-store.json')
    : FILE_STORE_PATH;

  if (!IS_VERCEL) ensureFileStore();
  else {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(storePath)) {
      fs.writeFileSync(storePath, JSON.stringify(emptyStore(), null, 2), 'utf8');
    }
  }

  const raw = fs.readFileSync(storePath, 'utf8');
  return normalizeStore(JSON.parse(raw));
}

async function writeStore(store) {
  const payload = normalizeStore(store);

  if (supabase) {
    await writeStoreToSupabase(payload);
    return;
  }

  const storePath = IS_VERCEL
    ? path.join('/tmp', 'certificate-store.json')
    : FILE_STORE_PATH;

  if (!IS_VERCEL) ensureFileStore();
  else {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  const tmp = `${storePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf8');
  fs.renameSync(tmp, storePath);
}

function makeAdminToken() {
  const payload = `admin:${Date.now()}`;
  const sig = crypto
    .createHmac('sha256', ADMIN_TOKEN_SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

function verifyAdminToken(token) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [payload, sig] = decoded.split('.');
    if (!payload || !sig) return false;
    const expected = crypto
      .createHmac('sha256', ADMIN_TOKEN_SECRET)
      .update(payload)
      .digest('hex');
    if (sig !== expected) return false;
    const ts = Number(payload.split(':')[1]);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < 12 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!verifyAdminToken(token)) {
    return res.status(401).json({
      success: false,
      error: { code: 'unauthorized', message: 'Admin login required.' },
    });
  }
  return next();
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    storage: storageKind(),
  });
});

app.post('/api/admin/login', (req, res) => {
  const password = String(req.body?.password || '');
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      error: { code: 'invalid_credentials', message: 'Incorrect admin password.' },
    });
  }
  return res.json({
    success: true,
    data: { token: makeAdminToken() },
  });
});

app.get('/api/admin/stats', requireAdmin, async (_req, res) => {
  try {
    const store = await readStore();
    const issuedCount = Object.keys(store.issued).length;
    res.json({
      success: true,
      data: {
        approved: store.approvedEmails.length,
        issued: issuedCount,
        remaining: Math.max(0, store.approvedEmails.length - issuedCount),
        storage: storageKind(),
        emails: store.approvedEmails.map((email) => ({
          email,
          issued: Boolean(store.issued[email]),
          fullName: store.issued[email]?.fullName || null,
          issuedAt: store.issued[email]?.issuedAt || null,
        })),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: {
        code: 'store_error',
        message:
          err?.message ||
          'Could not load email list. Check Supabase tables and service role key.',
      },
    });
  }
});

app.post('/api/admin/emails/upload', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'missing_file', message: 'Upload a CSV file with an email column.' },
      });
    }

    const text = req.file.buffer.toString('utf8');
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    const rows = parsed.data || [];
    const headers = parsed.meta?.fields || [];
    const emailHeader =
      headers.find((h) =>
        ['email', 'email address', 'e-mail', 'mail', 'registered email'].includes(h),
      ) || null;

    let extracted = [];
    if (emailHeader) {
      extracted = rows.map((row) => normalizeEmail(row[emailHeader]));
    } else {
      extracted = text
        .split(/\r?\n/)
        .map((line) => normalizeEmail(line.split(',')[0]))
        .filter(Boolean)
        .filter((v) => v !== 'email');
    }

    const store = await readStore();
    const existing = new Set(store.approvedEmails);
    let imported = 0;
    let duplicates = 0;
    let rejected = 0;
    const rejectedRows = [];

    for (const email of extracted) {
      if (!email) {
        rejected += 1;
        continue;
      }
      if (!isValidEmail(email)) {
        rejected += 1;
        rejectedRows.push({ email, reason: 'Invalid email' });
        continue;
      }
      if (existing.has(email)) {
        duplicates += 1;
        continue;
      }
      existing.add(email);
      imported += 1;
    }

    store.approvedEmails = Array.from(existing).sort();
    await writeStore(store);

    return res.json({
      success: true,
      data: {
        imported,
        duplicates,
        rejected,
        totalApproved: store.approvedEmails.length,
        rejectedRows: rejectedRows.slice(0, 50),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'import_failed',
        message: err?.message || 'Could not import emails.',
      },
    });
  }
});

app.post('/api/admin/emails', requireAdmin, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: { code: 'invalid_email', message: 'Enter a valid email address.' },
      });
    }

    const store = await readStore();
    if (store.approvedEmails.includes(email)) {
      return res.status(409).json({
        success: false,
        error: { code: 'duplicate', message: 'Email is already on the approved list.' },
      });
    }

    store.approvedEmails.push(email);
    store.approvedEmails.sort();
    await writeStore(store);

    return res.status(201).json({
      success: true,
      data: { email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'store_error',
        message: err?.message || 'Could not save email.',
      },
    });
  }
});

app.post('/api/certificates/issue', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const fullName = normalizeName(req.body?.fullName);

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'invalid_name', message: 'Please enter your full name.' },
      });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: { code: 'invalid_email', message: 'Please enter a valid email address.' },
      });
    }

    const store = await readStore();

    if (!store.approvedEmails.includes(email)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'not_approved',
          message:
            'This email is not on the approved participant list. Contact the organizer.',
        },
      });
    }

    if (store.issued[email]) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'already_issued',
          message: 'A certificate has already been issued for this email address.',
          lockedName: store.issued[email].fullName,
          issuedAt: store.issued[email].issuedAt,
        },
      });
    }

    store.issued[email] = {
      fullName,
      email,
      issuedAt: new Date().toISOString(),
    };
    await writeStore(store);

    return res.json({
      success: true,
      data: {
        fullName,
        email,
        issuedAt: store.issued[email].issuedAt,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: { code: 'server_error', message: 'Unable to issue certificate right now.' },
    });
  }
});

const distDir = path.join(ROOT, 'dist');
if (!IS_VERCEL && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

if (!IS_VERCEL) {
  ensureFileStore();
  app.listen(PORT, () => {
    console.log(`Certificate API running on http://localhost:${PORT}`);
    console.log(`Admin login ready (password from ADMIN_PASSWORD / default)`);
    console.log(`Storage: ${storageKind()}`);
  });
}

export default app;
