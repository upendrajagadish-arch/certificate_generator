import { normalizeCertificateName } from '../lib/generateCertificate';

interface CertificatePreviewProps {
  fullName: string;
}

export function CertificatePreview({ fullName }: CertificatePreviewProps) {
  const name = normalizeCertificateName(fullName);

  return (
    <div
      className="relative mx-auto w-full max-w-lg overflow-hidden rounded-[12px] border border-white/10 shadow-2xl"
      style={{ containerType: 'inline-size' }}
    >
      <img
        src="/certificate-template.jpg"
        alt="Race to Create 2026 Certificate"
        className="block h-auto w-full"
      />
      <div
        className="pointer-events-none absolute left-1/2 w-[62%] text-center"
        style={{
          top: '53.71%',
          transform: 'translate(-50%, -87%)',
        }}
      >
        <p
          className="leading-none text-[#0a0817]"
          style={{
            fontFamily: "'Allura', cursive",
            fontWeight: 400,
            fontSize: '6cqw',
            letterSpacing: 'normal',
            fontFeatureSettings: "'liga' 0, 'clig' 0, 'calt' 0, 'dlig' 0, 'curs' 0",
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </p>
      </div>
    </div>
  );
}
