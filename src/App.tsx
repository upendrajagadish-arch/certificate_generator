import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, Loader2, X } from 'lucide-react';
import { CertificatePreview } from './components/CertificatePreview';
import {
  downloadPdf,
  generateCertificatePdf,
  normalizeCertificateName,
} from './lib/generateCertificate';

type Stage = 'landing' | 'success';

function App() {
  const [stage, setStage] = useState<Stage>('landing');
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [issuedName, setIssuedName] = useState('');
  const [downloading, setDownloading] = useState(false);

  function openPopup() {
    setError('');
    setOpen(true);
  }

  function closePopup() {
    if (loading) return;
    setOpen(false);
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const name = normalizeCertificateName(fullName);
    const mail = email.trim();

    if (name.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mail, fullName: name }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const code = json?.error?.code as string | undefined;
        if (code === 'already_issued') {
          setError(
            json?.error?.message ||
              'A certificate has already been issued for this email.',
          );
        } else if (code === 'not_approved') {
          setError(
            json?.error?.message ||
              'This email is not on the approved participant list.',
          );
        } else {
          setError(json?.error?.message || 'Unable to generate certificate.');
        }
        return;
      }

      setIssuedName(json.data.fullName || name);
      setStage('success');
      setOpen(false);
    } catch {
      setError('Network error. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    setError('');
    try {
      const bytes = await generateCertificatePdf(issuedName);
      const safe = issuedName.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'certificate';
      downloadPdf(bytes, `race-to-create-2026-${safe}.pdf`);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not generate PDF. Please try again.',
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 py-10 font-sans">
      <div className="mx-auto w-full max-w-[640px] overflow-hidden shadow-2xl ring-1 ring-white/5">
        <div className="bg-[#111111] text-[#F2F2F2]">
          {stage === 'landing' ? (
            <section className="relative w-full overflow-hidden">
              {/* Visible college campus photo */}
              <div className="relative h-[280px] w-full sm:h-[320px]">
                <img
                  src="/images/college-campus.jpg"
                  alt="Ramachandra College of Engineering campus"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-[#111111]" />
                <div className="absolute left-4 top-4 rounded-xl bg-white/95 px-3 py-2 shadow-lg">
                  <img
                    src="/images/college-brand.png"
                    alt="Ramachandra College of Engineering"
                    className="h-10 w-auto object-contain sm:h-12"
                  />
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center px-6 pb-10 pt-2 text-center">
                <div className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5">
                  <p className="text-[11px] font-semibold tracking-[0.28em] text-white sm:text-[12px]">
                    OFFICIAL CERTIFICATE PORTAL
                  </p>
                </div>

                {/* Logo fills the white card tightly */}
                <div className="mt-5 w-full overflow-hidden rounded-2xl bg-white p-2 shadow-xl sm:p-3">
                  <img
                    src="/images/hackathon-logo.png"
                    alt="Race to Create — Ideation Camp"
                    className="h-auto w-full object-contain"
                  />
                </div>

                <h1
                  className="mt-6 max-w-[560px] text-[40px] leading-[1.08] tracking-tight text-white sm:text-[48px]"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  Race to Create
                  <br />
                  Certificate 2026
                </h1>

                <p className="mt-3 text-[13px] font-medium tracking-[0.16em] text-[#F0D78C]">
                  RAMACHANDRA COLLEGE OF ENGINEERING
                </p>

                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#E8E8E8]">
                  Enter your details and download your official participation certificate.
                </p>

                <button
                  type="button"
                  onClick={openPopup}
                  className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#D8F90A] px-8 py-4 font-semibold text-[#1E1E1E] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c9ea00]"
                >
                  Get Certificate
                  <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
                </button>

                <Link
                  to="/admin"
                  className="mt-5 text-xs tracking-wide text-[#83837D] hover:text-white"
                >
                  Admin · upload approved emails
                </Link>
              </div>
            </section>
          ) : (
            <section className="px-6 py-10 text-center sm:px-8">
              <div className="mb-5 flex flex-col items-center gap-3">
                <img
                  src="/images/college-brand.png"
                  alt="RCEE"
                  className="h-10 w-auto object-contain"
                />
                <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white p-2">
                  <img
                    src="/images/hackathon-logo.png"
                    alt="Race to Create"
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>

              <p className="text-[13px] font-semibold tracking-[0.28em] text-[#DCFF00]">
                CERTIFICATE READY
              </p>
              <h2
                className="mt-3 text-[36px] leading-[1.05] tracking-tight sm:text-[42px]"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Congratulations!
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[16px] leading-[1.55] text-[#E8E8E8]">
                Your Race to Create 2026 certificate is ready with your name on the gold line.
              </p>

              <div className="mt-7">
                <CertificatePreview fullName={issuedName} />
              </div>

              {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="mt-8 inline-flex items-center gap-3 rounded-lg bg-[#DCFF00] px-6 py-3 font-bold text-[#0A0A0A] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c9ea00] disabled:opacity-60"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Preparing PDF…
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" strokeWidth={2.5} />
                    Download Certificate
                  </>
                )}
              </button>
            </section>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={closePopup} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-6 text-[#F2F2F2] shadow-2xl">
            <button
              type="button"
              onClick={closePopup}
              className="absolute right-4 top-4 rounded-full p-1 text-[#83837D] transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 overflow-hidden rounded-xl bg-white p-2">
              <img
                src="/images/hackathon-logo.png"
                alt="Race to Create"
                className="h-auto w-full object-contain"
              />
            </div>

            <h3
              className="pr-8 text-center text-[32px] leading-tight tracking-tight"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Get your certificate
            </h3>
            <p className="mt-2 text-center text-sm text-[#83837D]">
              Your name will appear in elegant script on the gold line.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="fullName" className="mb-1.5 block text-sm text-[#E8E8E8]">
                  Full Name
                </label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-white/15 bg-[#0A0A0A] px-4 py-3 text-[#F2F2F2] outline-none transition focus:border-[#DCFF00]"
                  autoComplete="name"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm text-[#E8E8E8]">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/15 bg-[#0A0A0A] px-4 py-3 text-[#F2F2F2] outline-none transition focus:border-[#DCFF00]"
                  autoComplete="email"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-3 rounded-lg bg-[#DCFF00] px-6 py-3 font-bold text-[#0A0A0A] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c9ea00] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating certificate…
                  </>
                ) : (
                  <>
                    Generate Certificate
                    <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
