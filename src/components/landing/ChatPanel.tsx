import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { FadeUp } from './FadeUp';
import { MIcon } from './MIcon';
import { cn } from '../../lib/cn';

type Role = 'assistant' | 'user';

interface Message {
  role: Role;
  text: string;
}

const SEED: Message[] = [
  {
    role: 'assistant',
    text: 'Welcome to Race to Create 2026. I’ll help you claim your official participation certificate. What do you need?',
  },
  {
    role: 'user',
    text: 'I finished the Ideation Camp — how do I get my certificate with my name on it?',
  },
  {
    role: 'assistant',
    text: 'Perfect. Tap Get Certificate, enter your approved college email and full name, and we’ll place your name on the gold line — ready to download as a crisp PDF.',
  },
];

const REPLIES = [
  'Use the same email you registered with for the camp. Each email can claim once.',
  'Your name appears in elegant script across the official Race to Create template.',
  'Need help? Ask a faculty coordinator if your email isn’t on the approved list yet.',
];

interface ChatPanelProps {
  initialScroll?: 'top' | 'bottom';
  animateMessagesIn?: boolean;
}

export function ChatPanel({
  initialScroll = 'top',
  animateMessagesIn = false,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(SEED);
  const [draft, setDraft] = useState('');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const replyIndex = useRef(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = initialScroll === 'bottom' ? el.scrollHeight : 0;
  }, [initialScroll]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    const reply = REPLIES[replyIndex.current % REPLIES.length];
    replyIndex.current += 1;
    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: reply },
    ]);
    setDraft('');
    requestAnimationFrame(() => {
      const el = scrollerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[rgba(8,8,10,0.6)] backdrop-blur-[24px]">
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
          <MIcon name="auto_awesome" size={14} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Race to Create</p>
          <p className="text-[11px] text-white/40">Ideation Camp · Certificate desk</p>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="scrollbar-hide min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5"
      >
        {messages.map((msg, i) => {
          const bubble = (
            <div
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-white/15 text-white/90'
                    : 'border border-white/5 bg-white/5 text-white/70',
                )}
              >
                {msg.text}
              </div>
            </div>
          );

          if (!animateMessagesIn) return <div key={i}>{bubble}</div>;
          return (
            <FadeUp key={i} delay={i * 0.12} y={16}>
              {bubble}
            </FadeUp>
          );
        })}
      </div>

      <div className="p-3">
        <div className="liquid-glass flex items-end gap-2 rounded-2xl p-2">
          <textarea
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about your certificate..."
            className="max-h-24 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/35"
          />
          <button
            type="button"
            onClick={send}
            className="rounded-xl bg-white p-2 text-black transition hover:bg-white/90"
            aria-label="Send"
          >
            <MIcon name="arrow_upward" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
