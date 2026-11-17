import { PrimaryButton } from './PrimaryButton';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4';

interface RaceHeroPreviewProps {
  onBegin?: () => void;
}

export function RaceHeroPreview({ onBegin }: RaceHeroPreviewProps) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl"
      style={{ backgroundColor: 'hsl(201 100% 13%)' }}
    >
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover object-center"
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/50 via-black/25 to-black/60" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-4 text-center sm:px-6 md:px-8">
        <p className="text-[10px] font-semibold tracking-[0.28em] text-white/80 sm:text-[11px]">
          RACE TO CREATE 2026 · RCEE
        </p>

        <h1
          className="mt-2 max-w-[95%] text-[1.45rem] font-normal leading-[1.05] tracking-[-0.02em] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.55)] sm:text-2xl md:text-3xl lg:text-[2.15rem]"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          From ideation spark to official certificate.
        </h1>

        <p className="mt-2.5 max-w-[90%] text-[10px] leading-relaxed text-white/85 sm:mt-3 sm:max-w-lg sm:text-[11px] md:text-xs">
          Ideation Camp 2026 at Ramachandra College of Engineering — claim the
          certificate that proves you showed up and built.
        </p>

        <div className="mt-4 sm:mt-5">
          <PrimaryButton onClick={onBegin} size="md">
            Get Certificate
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
