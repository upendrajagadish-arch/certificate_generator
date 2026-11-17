import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface AnimatedTextProps {
  children: ReactNode;
}

function AnimatedText({ children }: AnimatedTextProps) {
  return (
    <span className="relative inline-flex h-[1.2em] overflow-hidden align-middle">
      <span className="inline-block transition-transform duration-300 ease-out group-hover:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute left-0 top-full inline-block transition-transform duration-300 ease-out group-hover:-translate-y-full"
      >
        {children}
      </span>
    </span>
  );
}

type Size = 'sm' | 'md' | 'lg';

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-5 text-xs',
  md: 'h-10 px-7 text-sm',
  lg: 'h-12 px-9 text-sm font-medium',
};

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: Size;
  as?: 'button';
}

export function PrimaryButton({
  children,
  size = 'lg',
  className,
  type = 'button',
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'group inline-flex items-center justify-center rounded-full bg-white/80 text-black leading-none transition-colors hover:bg-white',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      <AnimatedText>{children}</AnimatedText>
    </button>
  );
}
