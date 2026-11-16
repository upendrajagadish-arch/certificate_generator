import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STORE_PATH = path.join(ROOT, 'data', 'store.json');
const PORT = Number(process.env.API_PORT || 8787);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'RCE_T&P';
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'race-to-create-admin-secret';

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

function ensureStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(
      STORE_PATH,
      JSON.stringify({ approvedEmails: [], issued: {} }, null, 2),
      'utf8',
    );
  }
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  const data = JSON.parse(raw);
  return {
    approvedEmails: Array.isArray(data.approvedEmails) ? data.approvedEmails : [],
    issued:
      data.issued && typeof data.issued === 'object' && !Array.isArray(data.issued)
        ? data.issued
        : {},
  };
}

function writeStore(store) {
  ensureStore();
  const tmp = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmp, STORE_PATH);
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
    // Token valid for 12 hours
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
  res.json({ ok: true });
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

app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const store = readStore();
  const issuedCount = Object.keys(store.issued).length;
  res.json({
    success: true,
    data: {
      approved: store.approvedEmails.length,
      issued: issuedCount,
      remaining: Math.max(0, store.approvedEmails.length - issuedCount),
      emails: store.approvedEmails.map((email) => ({
        email,
        issued: Boolean(store.issued[email]),
        fullName: store.issued[email]?.fullName || null,
        issuedAt: store.issued[email]?.issuedAt || null,
      })),
    },
  });
});

app.post('/api/admin/emails/upload', requireAdmin, upload.single('file'), (req, res) => {
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

    // Support headerless single-column files
    let extracted = [];
    if (emailHeader) {
      extracted = rows.map((row) => normalizeEmail(row[emailHeader]));
    } else {
      // fallback: first column values
      extracted = text
        .split(/\r?\n/)
        .map((line) => normalizeEmail(line.split(',')[0]))
        .filter(Boolean)
        .filter((v) => v !== 'email');
    }

    const store = readStore();
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
    writeStore(store);

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
      error: { code: 'import_failed', message: 'Could not import emails.' },
    });
  }
});

app.post('/api/admin/emails', requireAdmin, (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: { code: 'invalid_email', message: 'Enter a valid email address.' },
    });
  }

  const store = readStore();
  if (store.approvedEmails.includes(email)) {
    return res.status(409).json({
      success: false,
      error: { code: 'duplicate', message: 'Email is already on the approved list.' },
    });
  }

  store.approvedEmails.push(email);
  store.approvedEmails.sort();
  writeStore(store);

  return res.status(201).json({
    success: true,
    data: { email },
  });
});

/**
 * Public certificate claim:
 * - email must be approved
 * - email can be used only once
 */
app.post('/api/certificates/issue', (req, res) => {
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

    const store = readStore();

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

    // Atomic claim in single-threaded process: re-check then write
    store.issued[email] = {
      fullName,
      email,
      issuedAt: new Date().toISOString(),
    };
    writeStore(store);

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

app.listen(PORT, () => {
  ensureStore();
  console.log(`Certificate API running on http://localhost:${PORT}`);
  console.log(`Admin login ready (password from ADMIN_PASSWORD / default)`);
});
