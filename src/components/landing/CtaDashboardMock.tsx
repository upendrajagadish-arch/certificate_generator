import { ChatPanel } from './ChatPanel';
import { RaceHeroPreview } from './RaceHeroPreview';

interface CtaDashboardMockProps {
  onBegin?: () => void;
}

export function CtaDashboardMock({ onBegin }: CtaDashboardMockProps) {
  return (
    <div className="liquid-glass mx-auto flex h-full w-full max-w-none flex-col overflow-hidden rounded-[1.25rem] p-2 sm:rounded-[1.5rem] sm:p-2.5 lg:p-3">
      {/* Logos outside the animation component */}
      <div className="relative z-20 mb-2 flex shrink-0 flex-wrap items-center gap-2 sm:mb-2.5 sm:gap-2.5">
        <div className="rounded-xl bg-white px-2.5 py-2 shadow-lg sm:rounded-2xl sm:px-3 sm:py-2.5">
          <img
            src="/images/college-brand.png"
            alt="Ramachandra College of Engineering"
            className="h-7 w-auto object-contain sm:h-8 md:h-9"
          />
        </div>
        <div className="rounded-xl bg-white p-1.5 shadow-lg sm:p-2">
          <img
            src="/images/hackathon-logo.png"
            alt="Race to Create — Ideation Camp"
            className="h-11 w-auto object-contain sm:h-12 md:h-14"
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(220px,26%)_minmax(0,1fr)] sm:gap-2.5 lg:grid-cols-[minmax(240px,24%)_minmax(0,1fr)]">
        <div className="hidden min-h-0 sm:block">
          <ChatPanel initialScroll="top" animateMessagesIn />
        </div>
        <div className="min-h-0 h-full w-full">
          <RaceHeroPreview onBegin={onBegin} />
        </div>
      </div>
    </div>
  );
}
