import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Upload, Plus, LogOut, Shield } from 'lucide-react';

const TOKEN_KEY = 'rtc_admin_token';

type EmailRow = {
  email: string;
  issued: boolean;
  fullName: string | null;
  issuedAt: string | null;
};

export function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [approved, setApproved] = useState(0);
  const [issued, setIssued] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [rows, setRows] = useState<EmailRow[]>([]);
  const [manualEmail, setManualEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadStats(authToken = token) {
    const res = await fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const json = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken('');
      }
      throw new Error(json?.error?.message || 'Failed to load stats');
    }
    setApproved(json.data.approved);
    setIssued(json.data.issued);
    setRemaining(json.data.remaining);
    setRows(json.data.emails || []);
  }

  useEffect(() => {
    if (!token) return;
    loadStats(token).catch((err) => setError(err.message));
  }, [token]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.status === 404) {
        setLoginError('API is not available on this host. Redeploy with the Express /api route enabled.');
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setLoginError(json?.error?.message || 'Login failed');
        return;
      }
      localStorage.setItem(TOKEN_KEY, json.data.token);
      setToken(json.data.token);
      setPassword('');
    } catch {
      setLoginError('Unable to reach the server.');
    } finally {
      setLoggingIn(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
  }

  async function handleUpload(file: File) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/emails/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message || 'Upload failed');
        return;
      }
      setMessage(
        `Imported ${json.data.imported} · Duplicates ${json.data.duplicates} · Rejected ${json.data.rejected}`,
      );
      await loadStats();
    } catch {
      setError('Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function addEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: manualEmail }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message || 'Could not add email');
        return;
      }
      setManualEmail('');
      setMessage(`Added ${json.data.email}`);
      await loadStats();
    } catch {
      setError('Could not add email.');
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 font-sans text-[#F2F2F2]">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl"
        >
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#DCFF00]/15 text-[#DCFF00]">
            <Shield className="h-5 w-5" />
          </div>
          <h1
            className="text-3xl tracking-tight"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Admin Login
          </h1>
          <p className="mt-2 text-sm text-[#83837D]">
            Upload approved emails. Only those emails can generate a certificate — once.
          </p>
          <label className="mt-6 mb-1.5 block text-sm">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-[#0A0A0A] px-4 py-3 outline-none focus:border-[#DCFF00]"
            autoFocus
          />
          {loginError && <p className="mt-2 text-sm text-red-400">{loginError}</p>}
          <button
            type="submit"
            disabled={loggingIn}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#DCFF00] px-4 py-3 font-bold text-[#0A0A0A]"
          >
            {loggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
          </button>
          <Link to="/" className="mt-4 block text-center text-sm text-[#83837D] hover:text-white">
            ← Back to certificate portal
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8 font-sans text-[#F2F2F2]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1
              className="text-3xl tracking-tight"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Approved Emails
            </h1>
            <p className="mt-1 text-sm text-[#83837D]">
              One approved email = one certificate. Unlisted emails are blocked.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
            >
              Student portal
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
            <p className="text-xs uppercase tracking-wide text-[#83837D]">Approved</p>
            <p className="mt-2 text-3xl font-semibold">{approved}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
            <p className="text-xs uppercase tracking-wide text-[#83837D]">Issued</p>
            <p className="mt-2 text-3xl font-semibold">{issued}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
            <p className="text-xs uppercase tracking-wide text-[#83837D]">Remaining</p>
            <p className="mt-2 text-3xl font-semibold">{remaining}</p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-white/20 bg-[#111111] p-5">
            <h2 className="font-medium">Upload CSV</h2>
            <p className="mt-1 text-sm text-[#83837D]">
              Use a column named <code>email</code>. Sample: <code>public/samples/emails.csv</code>
            </p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-8 hover:bg-white/10">
              <Upload className="h-6 w-6 text-[#DCFF00]" />
              <span className="mt-2 text-sm">
                {busy ? 'Uploading…' : 'Choose CSV file'}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          <form
            onSubmit={addEmail}
            className="rounded-2xl border border-white/10 bg-[#111111] p-5"
          >
            <h2 className="font-medium">Add one email</h2>
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="student@college.edu"
              className="mt-4 w-full rounded-lg border border-white/15 bg-[#0A0A0A] px-4 py-3 outline-none focus:border-[#DCFF00]"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#DCFF00] px-4 py-3 font-bold text-[#0A0A0A]"
            >
              <Plus className="h-4 w-4" />
              Add email
            </button>
          </form>
        </div>

        {message && <p className="mb-3 text-sm text-emerald-300">{message}</p>}
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="max-h-[min(60vh,520px)] overflow-x-auto overflow-y-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#161616] text-[#83837D]">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Issued name</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.email} className="border-t border-white/10">
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">
                      {row.issued ? (
                        <span className="text-amber-300">Issued</span>
                      ) : (
                        <span className="text-emerald-300">Eligible</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#C8C8C8]">{row.fullName || '—'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-[#83837D]">
                      No approved emails yet. Upload a CSV to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
