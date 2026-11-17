import { PrimaryButton } from './PrimaryButton';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4';

interface RaceHeroPreviewProps {
  onBegin?: () => void;
}

export function RaceHeroPreview({ onBegin }: RaceHeroPreviewProps) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-xl sm:rounded-2xl"
      style={{ backgroundColor: 'hsl(201 100% 13%)' }}
    >
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover object-[center_70%]"
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/80 via-black/55 to-black/40" />

      <div className="relative z-10 flex h-full min-h-0 w-full flex-col items-center overflow-y-auto overscroll-contain px-3 pb-4 pt-2.5 text-center scrollbar-hide sm:px-5 sm:pb-5 sm:pt-3.5 md:px-7 md:pt-4 lg:px-8 lg:pt-5">
        {/* Banner logo — scales across phone / tablet / desktop */}
        <div className="w-full max-w-[min(100%,420px)] rounded-xl bg-white px-2.5 py-2 shadow-[0_10px_36px_rgba(0,0,0,0.45)] sm:max-w-[520px] sm:rounded-2xl sm:px-3.5 sm:py-2.5 md:max-w-[640px] md:px-4 md:py-3 lg:max-w-[720px] lg:px-5 lg:py-3.5">
          <img
            src="/images/hackathon-logo.png"
            alt="Race to Create — Ideation Camp"
            className="mx-auto h-[3.25rem] w-auto max-w-full object-contain sm:h-16 md:h-20 lg:h-24 xl:h-28"
          />
        </div>

        <p
          className="mt-3 text-[clamp(0.7rem,2.4vw,1.25rem)] font-semibold uppercase tracking-[0.18em] text-[#F0D78C] drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)] sm:mt-4 sm:tracking-[0.26em] md:tracking-[0.3em] lg:tracking-[0.34em]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Race to Create 2026 · RCEE
        </p>

        <h1
          className="mt-2 max-w-[18ch] text-[clamp(1.7rem,5.5vw,3.75rem)] font-normal leading-[1.08] tracking-[-0.03em] text-white drop-shadow-[0_3px_24px_rgba(0,0,0,0.6)] sm:mt-3 md:mt-4"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
        >
          From ideation spark to{' '}
          <em className="italic text-white/90">official certificate.</em>
        </h1>

        <p
          className="mt-3 max-w-[34rem] text-[clamp(0.9rem,2.1vw,1.35rem)] font-medium leading-[1.5] text-white/90 drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] sm:mt-4 sm:max-w-xl md:max-w-2xl"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Ideation Camp 2026 at Ramachandra College of Engineering — claim the
          certificate that proves you showed up and built.
        </p>

        <div className="mt-4 w-full max-w-xs sm:mt-5 sm:max-w-none md:mt-6 lg:mt-7">
          <PrimaryButton
            onClick={onBegin}
            size="lg"
            className="w-full sm:w-auto"
          >
            Get Certificate
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
