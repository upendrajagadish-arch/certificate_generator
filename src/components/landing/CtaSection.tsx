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
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-[#14191E]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.12),transparent_55%)]" />

      <div className="relative z-20 mx-auto flex h-full w-full max-w-[1760px] items-center px-3 pb-10 pt-3 sm:px-4 sm:pb-12 sm:pt-4 lg:px-5 lg:pb-10 lg:pt-5 xl:px-6">
        <div className="mx-auto aspect-[16/9] w-full max-h-[52vh] max-w-none sm:max-h-[56vh] lg:max-h-[62vh] xl:max-h-[66vh]">
          <CtaDashboardMock onBegin={onGetCertificate} />
        </div>
      </div>

      <img
        src={GRASS_SRC}
        alt=""
        aria-hidden
        className="pointer-events-none absolute bottom-[-6px] left-0 right-0 z-30 w-full select-none object-cover sm:bottom-[-16px] lg:bottom-[-28px]"
      />
    </section>
  );
}
