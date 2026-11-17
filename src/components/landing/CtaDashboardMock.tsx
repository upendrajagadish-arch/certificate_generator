import { ChatPanel } from './ChatPanel';
import { RaceHeroPreview } from './RaceHeroPreview';

interface CtaDashboardMockProps {
  onBegin?: () => void;
}

export function CtaDashboardMock({ onBegin }: CtaDashboardMockProps) {
  return (
    <div className="liquid-glass mx-auto h-full w-full overflow-hidden rounded-2xl p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:rounded-[1.35rem] sm:p-2 md:rounded-[1.5rem] md:p-2.5 lg:rounded-[1.75rem] lg:p-3">
      {/*
        Mobile: animation only
        Tablet (md+): chat + animation
        Desktop (lg+): wider animation share
      */}
      <div className="grid h-full min-h-0 grid-cols-1 gap-1.5 sm:gap-2 md:grid-cols-[minmax(180px,28%)_minmax(0,1fr)] md:gap-2.5 lg:grid-cols-[minmax(220px,22%)_minmax(0,1fr)] lg:gap-3 xl:grid-cols-[minmax(240px,20%)_minmax(0,1fr)]">
        <div className="hidden min-h-0 md:block">
          <ChatPanel initialScroll="top" animateMessagesIn />
        </div>
        <div className="min-h-0 h-full w-full">
          <RaceHeroPreview onBegin={onBegin} />
        </div>
      </div>
    </div>
  );
}
