import { CtaDashboardMock } from './CtaDashboardMock';

const GRASS_SRC =
  'https://res.cloudinary.com/dy5er7kv5/image/upload/q_auto/f_auto/v1780586778/cta-bg_mlwy5s.png';

interface CtaSectionProps {
  onGetCertificate: () => void;
}

export function CtaSection({ onGetCertificate }: CtaSectionProps) {
  return (
    <section
      id="cta"
      className="relative h-[100dvh] w-full overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, transparent 0%, #14191E 100%)',
      }}
    >
      <img
        src="/images/college-campus.jpg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0d1116]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="relative z-20 mx-auto flex h-full w-full max-w-[1680px] flex-col px-3 pb-8 pt-3 sm:px-5 sm:pb-10 sm:pt-4 md:px-6 md:pb-12 md:pt-5 lg:px-8 lg:pb-12 lg:pt-6">
        {/* Ramachandra logo — outside the glass box */}
        <div className="mb-2 flex shrink-0 sm:mb-3 md:mb-4">
          <div className="rounded-lg bg-white px-2.5 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.35)] sm:rounded-xl sm:px-3 sm:py-2.5 md:rounded-2xl md:px-4 md:py-3">
            <img
              src="/images/college-brand.png"
              alt="Ramachandra College of Engineering"
              className="h-7 w-auto max-w-[min(70vw,280px)] object-contain sm:h-9 md:h-10 lg:h-11"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <CtaDashboardMock onBegin={onGetCertificate} />
        </div>
      </div>

      <img
        src={GRASS_SRC}
        alt=""
        aria-hidden
        className="pointer-events-none absolute bottom-[-12px] left-0 right-0 z-30 w-full select-none object-cover sm:bottom-[-28px] md:bottom-[-40px] lg:bottom-[-60px]"
      />
    </section>
  );
}
