import { ArrowRight } from 'lucide-react';

interface PrimaryButtonProps {
  label: string;
  href?: string;
}

export function PrimaryButton({ label, href = '#' }: PrimaryButtonProps) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-3 rounded-lg bg-[#DCFF00] px-6 py-3 font-bold text-[#0A0A0A] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c9ea00]"
    >
      {label}
      <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
    </a>
  );
}
