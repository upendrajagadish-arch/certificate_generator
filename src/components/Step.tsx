interface StepProps {
  number: number;
  children: React.ReactNode;
}

export function Step({ number, children }: StepProps) {
  return (
    <div className="mb-6 flex items-start gap-5 last:mb-0">
      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[#DCFF00] text-xs font-bold text-[#0A0A0A]">
        {number}.
      </div>
      <p className="text-[17px] leading-[1.55] text-[#E8E8E8]">{children}</p>
    </div>
  );
}
