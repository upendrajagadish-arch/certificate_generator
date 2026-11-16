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
      {/* Same normalized name + natural spacing as the downloaded PDF */}
      <div
        className="pointer-events-none absolute left-1/2 w-[58%] text-center"
        style={{
          top: '53.65%',
          transform: 'translate(-50%, -92%)',
        }}
      >
        <p
          className="leading-none text-[#1f1a2e]"
          style={{
            fontFamily: "'Great Vibes', cursive",
            fontWeight: 400,
            fontSize: '5.3cqw',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </p>
      </div>
    </div>
  );
}
